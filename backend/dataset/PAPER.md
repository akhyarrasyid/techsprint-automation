# Automated Inventory Reconciliation Pipeline untuk UMKM F&B
## Deteksi Shrinkage Berbasis Statistik pada Data Operasional Terfragmentasi

---

## Abstrak

Makalah ini memaparkan rancangan dan implementasi sistem otomasi data untuk merekonsiliasi data penjualan POS dengan catatan fisik gudang pada UMKM F&B Kopikita Roastery. Permasalahan utama yang dihadapi adalah fragmentasi data lintas tiga sistem dengan satuan ukur yang tidak kompatibel, ditambah kualitas data mentah yang sangat rendah akibat penggunaan sistem POS murah. Pipeline yang dibangun memproses 170.613 baris data penjualan dan 7.350 catatan gudang menjadi laporan `Action_Report.csv` yang mengklasifikasikan status setiap bahan baku per hari. Dengan menerapkan hybrid anomaly detection berbasis Modified Z-score (MAD), sistem berhasil memisahkan 625 false positive dari 29 sinyal shrinkage nyata, di mana 23 di antaranya (79,3%) merupakan kehilangan stok yang tidak dapat dijelaskan oleh catatan penjualan. Evaluasi exhaustive terhadap 8 kombinasi strategi penanganan data menunjukkan bahwa kuantinasi nilai Quantity anomalus (99 dan 150) merupakan variabel paling krusial dalam mengurangi derau deteksi. Seluruh pipeline berjalan dalam satu siklus eksekusi tanpa intervensi manusia dengan runtime ~0,38 detik.

---

## 1. Pendahuluan

Bisnis F&B skala UMKM menghadapi tantangan unik dalam manajemen inventaris: volume transaksi tinggi, banyak bahan baku, dan keterbatasan infrastruktur sistem. Kopikita Roastery mengelola 42 bahan baku dengan tiga sumber data yang tidak saling terhubung — sistem kasir POS, pencatatan gudang, dan master katalog — masing-masing menggunakan satuan ukur berbeda dan format yang tidak standar.

Tanpa rekonsiliasi otomatis antara data penjualan dan stok fisik, kehilangan bahan baku (shrinkage) akibat pencurian, pemborosan, atau kesalahan pencatatan tidak dapat terdeteksi. Sistem yang dibangun bertujuan menjawab satu pertanyaan operasional: *pada hari dan bahan tertentu, apakah stok berkurang sesuai penjualan, perlu diisi ulang, atau ada yang hilang tanpa penjelasan?*

### 1.1 Titik Lemah Operasional

**Data Silos dan UoM Mismatch.** POS mencatat "1 Iced Latte terjual" — tetapi gudang menghitung dalam mililiter susu dan gram kopi. Tidak ada konversi otomatis antara keduanya.

**Dirty Data dari Sistem Legacy.** Data POS mengandung berbagai kelas kerusakan: enam format DateTime berbeda, Quantity non-numerik, nilai mencurigakan (99 dan 150), dan Transaction ID malformed.

**Schema Drift di Data Gudang.** Field `stock_remaining` berganti nama menjadi `sisa_stok_akhir` pada April 2025 tanpa notifikasi — menyebabkan separuh data hilang jika tidak ditangani.

**Threshold Restock Tidak Langsung Dapat Digunakan.** `Min_Stock_Threshold` di katalog menggunakan satuan supplier (Karton, Kilogram, Liter) — bukan satuan warehouse. Konversi 1 Karton = X pcs tidak tersedia di dataset.

**Tidak Ada Mekanisme Deteksi Kehilangan.** Tanpa rekonsiliasi POS vs. gudang, shrinkage tidak terdeteksi.

---

## 2. Dataset

### 2.1 Sumber Data

| File | Format | Deskripsi | Ukuran |
|---|---|---|---|
| `sales_history` | CSV | Log transaksi harian POS | 170.613 baris |
| `warehouse_stock` | JSON | Stok fisik akhir hari per item | 7.350 entri |
| `Recipe_BOM` | JSON | Resep: komposisi bahan per menu | 25 menu, 120 entri |
| `Master_Inventory` | CSV | Katalog bahan baku | 42 item |
| `Employee` | JSON | Data karyawan | 6 orang |

Periode: Januari – Juni 2025 (175 hari).

### 2.2 Struktur Relasional

```
sales_history ──(Menu_ID)──► Recipe_BOM ──(Item_ID)──► Master_Inventory
                                                              ▲
warehouse_stock ──────────────────────────────(Item_ID)──────┘
```

---

## 3. Pembersihan & Normalisasi Data

Sebelum kalkulasi dimulai, seluruh dataset diproses melalui dua lapisan: **normalisasi struktural** pada `warehouse_stock` (perubahan skema dan satuan), dan **cleansing** pada `sales_history` (perbaikan nilai rusak). Penanganan yang bersifat deterministik dilakukan sebelum pipeline; penanganan yang melibatkan trade-off dievaluasi sebagai variabel strategi (§3.9).

### 3.1 Normalisasi Struktural: `warehouse_stock`

#### Schema Drift

Field `stock_remaining` berganti nama menjadi `sisa_stok_akhir` mulai 1 April 2025. Tanpa penanganan, seluruh data Apr–Jun menghasilkan NaN.

| Periode | Field dalam JSON | Contoh nilai |
|---|---|---|
| Jan–Mar 2025 | `stock_remaining` | `{"stock_remaining": 15000.0, "delivery_in": 0}` |
| Apr–Jun 2025 | `sisa_stok_akhir` | `{"sisa_stok_akhir": 14200.0, "delivery_in": 500}` |

**Penanganan:** `entry.get('stock_remaining', entry.get('sisa_stok_akhir'))` — mengambil field manapun yang tersedia, tanpa pengecekan tanggal.

#### UoM Mismatch

Empat baris menggunakan satuan supplier (`kilogram`, `liter`) alih-alih satuan warehouse (`gram`, `ml`), membuat nilai stok tampak 1.000× lebih kecil.

| Item_ID | UoM tercatat | Nilai | UoM seharusnya | Setelah fix |
|---|---|---|---|---|
| INV-0003 | `kilogram` | 15,5 | `gram` | 15.500,0 |
| INV-0012 | `liter` | 8,0 | `ml` | 8.000,0 |
| INV-0023 | `kilogram` | 22,3 | `gram` | 22.300,0 |
| INV-0031 | `liter` | 5,5 | `ml` | 5.500,0 |

**Penanganan:** konversi ×1.000 pada `stock_remaining` dan `delivery_in` untuk baris dengan UoM `kilogram` atau `liter`.

---

### 3.2 Gambaran Umum: `sales_history`

Dari 170.613 baris, ditemukan 12 kelas masalah. Penanganan deterministik menghasilkan **168.080 baris bersih**; empat variabel lainnya dievaluasi sebagai strategi (§3.9).

| Masalah | Jumlah | Penanganan |
|---|---|---|
| `Transaction_ID` malformed (3 pola) | 1.659 | Regex fix (deterministik) |
| DateTime format non-standar (6 format) | 3.030 | Multi-format parser (deterministik) |
| DateTime null (semua kolom kosong) | 1.008 | Drop (deterministik) |
| Quantity non-numerik (5 varian) | 2.035 | Word-to-number + strip (deterministik) |
| `Menu_ID` null dengan `Item_Name` valid | 1.287 | Fallback mapping (deterministik) |
| Duplicate rows identik sempurna | 1.525 | Drop (deterministik) |
| Duplicate `Transaction_ID` non-identik | 3.517 | *Strategi: drop / sum* |
| Quantity negatif | 1.297 | *Strategi: quarantine* |
| Quantity nol atau null | 1.937 | Quarantine (deterministik) |
| Quantity suspicious (99 & 150) | 1.379 | *Strategi: keep / invalid* |
| Ghost `Menu_ID` | 1.672 | Quarantine (deterministik) |
| `Additional_Info` error string | 6.458 | *Strategi: ignore / filter* |

---

### 3.3 `Transaction_ID` — Tiga Pola Malformed

1.659 baris (0,97%) tidak sesuai format standar `TRX-YYYYMMDD-XXXX`. Ketiga pola bersifat deterministik — dapat diperbaiki regex tanpa kehilangan data.

| Pola | Contoh kotor | Jumlah | Setelah fix |
|---|---|---|---|
| Trailing whitespace | `"TRX-20250306-0216 "` | 564 | `TRX-20250306-0216` |
| Underscore + trailing X | `TRX_20250103-0096X` | 563 | `TRX-20250103-0096` |
| Double dash | `TRX--20250628-0906` | 532 | `TRX-20250628-0906` |
| **Total** | | **1.659** | 0 malformed tersisa |

**Penanganan:** tiga operasi regex berurutan — (1) `.strip()`, (2) `re.sub(r'^TRX_', 'TRX-')` + `rstrip('X')`, (3) `replace('--', '-')`.

---

### 3.4 `DateTime` — Enam Format Non-Standar

3.030 baris (1,78%) menggunakan format selain `YYYY-MM-DD HH:MM:SS`. Keenam format muncul dengan frekuensi hampir merata (~500 baris masing-masing), mengindikasikan rotasi sistematis dari versi POS berbeda.

| Format | Contoh nilai kotor | Parser (`strptime`) |
|---|---|---|
| `DD/MM/YYYY HH:MM` | `15/01/2025 09:30` | `%d/%m/%Y %H:%M` |
| `YYYYMMDDHHmm` | `202501150930` | `%Y%m%d%H%M` |
| `MM-DD-YYYY HH:MM AM/PM` | `01-15-2025 09:30 AM` | `%m-%d-%Y %I:%M %p` |
| `YYYY/MM/DD HH:MM:SS` | `2025/01/15 09:30:00` | `%Y/%m/%d %H:%M:%S` |
| `DD-Mon-YYYY HH:MM` | `15-Jan-2025 09:30` | `%d-%b-%Y %H:%M` |
| `D/M/YY H:MM` | `5/1/25 9:30` | `%d/%m/%y %H:%M` |

**Penanganan:** sequential multi-format parser — setiap format dicoba via `pd.to_datetime(s, format=fmt, errors='coerce')`; nilai pertama yang bukan NaT diterima.

**Kasus null (1.008 baris):** diverifikasi bahwa `Menu_ID`, `Quantity`, dan `Employee_ID` juga null pada baris yang sama — tidak ada informasi yang bisa diselamatkan, di-drop.

---

### 3.5 `Quantity` — Nilai Non-Numerik

2.035 baris tidak dapat langsung di-parse sebagai angka. Lima varian ditemukan:

| Varian | Contoh kotor | Jumlah | Metode fix | Hasil |
|---|---|---|---|---|
| Kata (Inggris) | `"two"`, `"three"` | 418 | Word-to-number EN | 2, 3 |
| Kata (Indonesia) | `"dua"`, `"tiga"` | 411 | Word-to-number ID | 2, 3 |
| Koma desimal | `"2,0"`, `"1,5"` | 402 | `replace(',', '.')` | 2.0, 1.5 |
| Unit suffix | `"1 pcs"`, `"2 cups"` | 398 | Strip suffix regex | 1, 2 |
| Gabungan | `"2,0 cups"` | 406 | Strip lalu parse | 2.0 |
| **Total** | | **2.035** | | 0 null tersisa |

**Penanganan:** tiga langkah berurutan — (1) strip unit suffix, (2) ganti koma desimal, (3) word-to-number lookup bilingual. Urutan penting karena beberapa baris memiliki lebih dari satu masalah.

---

### 3.6 `Quantity` — Nilai Suspicious (99 & 150)

1.379 baris memiliki Quantity 99 atau 150. Nilai ini muncul di **semua 25 menu** secara merata — termasuk makanan yang tidak mungkin dipesan 99 porsi sekaligus.

| Kategori menu | Qty = 99 | Qty = 150 | Catatan |
|---|---|---|---|
| Espresso-based | 138 | 140 | Merata, tidak ada menu dominan |
| Susu & non-kopi | 141 | 135 | Idem |
| Makanan ringan | 134 | 145 | Tidak masuk akal untuk croissant, dll. |
| Minuman dingin | 279 | 267 | |
| **Total** | **692** | **687** | Distribusi acak tanpa pola pemesanan |

Distribusi seragam tanpa dominansi menu tertentu dan tanpa korelasi waktu → artifact sistem POS, bukan transaksi nyata. Dampak terhadap deteksi anomali dibahas di §5.1.

> **[Gambar: Histogram Quantity skala log]** — distribusi normal di 1–4, dua puncak diskrit di 99 dan 150 yang bukan distribusi ekor alami.

---

### 3.7 `Menu_ID` — Null Recovery dan Ghost ID

#### Null dengan `Item_Name` valid (1.287 baris)

`Item_Name` yang valid digunakan sebagai fallback via mapping `Item_Name → Menu_ID` dari tabel BOM. Seluruh 1.287 baris berhasil di-recover (0 null tersisa).

#### Ghost `Menu_ID` (1.672 baris)

Empat nilai di luar rentang valid (`MENU-001` s.d. `MENU-025`) muncul bersama `Item_Name` yang tidak bermakna:

| Ghost `Menu_ID` | `Item_Name` penyerta | Jumlah | Penanganan |
|---|---|---|---|
| `MENU-000` | `"Unknown Item"`, `"??"` | 432 | Quarantine |
| `MENU-999` | `"Unknown Item"`, `"??"` | 418 | Quarantine |
| `TEST` | `"Test Transaction"` | 401 | Quarantine |
| `PROMO-01` | `"Promo Bundle"` | 421 | Quarantine |

Tidak ada `Menu_ID` atau `Item_Name` yang dapat dipetakan ke ingredient — keempat kelompok ini tidak bisa direkonsiliasi.

---

### 3.8 Duplicate `Transaction_ID`

5.042 baris (2,96%) memiliki `Transaction_ID` yang muncul lebih dari sekali. Dua tipe dibedakan:

| `Transaction_ID` | `Menu_ID` | `Quantity` | Tipe & Aksi |
|---|---|---|---|
| `TRX-20250115-0042` | MENU-003 | 2 | Identik → drop salah satu |
| `TRX-20250115-0042` | MENU-003 | 2 | *(duplikat identik)* |
| `TRX-20250302-0099` | MENU-007 | 1 | Keep (first) |
| `TRX-20250302-0099` | MENU-007 | 4 | Drop — Qty berbeda, penyebab tidak diketahui |

- **1.525 baris identik sempurna** → di-drop langsung.
- **3.517 baris dengan Quantity berbeda** → dievaluasi sebagai variabel strategi (drop first vs. sum).

---

### 3.9 Variabel Strategi — Penanganan Ambigu

Empat masalah yang tidak memiliki solusi deterministik dievaluasi secara exhaustive terhadap 8 kombinasi. Strategi terpilih adalah **S02**:

| Variabel | Pilihan S02 | Justifikasi |
|---|---|---|
| Negative Quantity | Quarantine | Tidak ada bukti negatif = retur; lebih aman dikecualikan |
| Duplicate non-identik | Drop (first) | Opsi paling netral tanpa asumsi tambahan |
| **Qty suspicious (99 & 150)** | **Invalid** | Terbukti menyebabkan 625 false positive jika dibiarkan (§5.1) |
| `Additional_Info` error string | Ignore | Filter justru menghilangkan 8 sinyal shrinkage nyata (§5.2) |

---

## 4. Metodologi Komputasi

```
[Data Bersih]  →  [BOM Calculation]  →  [Stock Reconciliation]  →  [Classification]
 168.080 baris      6.154 baris          gap / threshold             Action_Report
```

### 4.1 BOM Calculation

Setiap transaksi valid dikonversi dari satuan menu ke satuan ingredient menggunakan tabel resep:

$$\text{pos\_consumed}_{(d,\, i)} = \sum_{\text{transaksi pada hari } d} \text{Quantity}_{\text{menu}} \times \text{qty\_used}_{(\text{menu},\, i)}$$

Contoh: 3 cup Iced Latte pada hari $d$ → 3 × 18g = 54g kopi dan 3 × 150ml = 450ml susu dibebankan ke Item_ID masing-masing.

Hasil agregasi per (tanggal, item) menghasilkan **6.154 baris** konsumsi harian.

### 4.2 Threshold Restock

`Min_Stock_Threshold` di `Master_Inventory` menggunakan satuan supplier — bukan satuan warehouse. Konversi per item:

$$\text{restock\_threshold}_{i} = \begin{cases} \text{Min\_Stock\_Threshold} \times 1.000 & \text{jika Kilogram atau Liter} \\ \text{Min\_Stock\_Threshold} \times 1 & \text{jika Pcs} \\ \overline{\text{stock\_before\_delivery}} & \text{jika Karton} \end{cases}$$

Untuk item Karton, tidak ada tabel konversi. Threshold diderivasi **empiris** dari rata-rata level stok tepat sebelum delivery tiba:

$$\overline{\text{stock\_before\_delivery}}_{i} = \frac{1}{|D_i|} \sum_{d \in D_i} \left(\text{stock\_remaining}_{i,d} - \text{delivery\_in}_{i,d}\right)$$

**Mengapa `stock_before_delivery`, bukan `stock_remaining`?** Pada hari delivery, `stock_remaining` sudah mencakup kiriman baru — kondisi kritis yang memicu pemesanan tidak lagi terlihat:

$$\underbrace{\text{stock\_remaining} - \text{delivery\_in}}_{\text{stock\_before\_delivery}} = \text{prev\_stock} - \text{consumed}$$

**Validasi** terhadap 881 delivery events aktual sebagai ground truth:

| Metrik | Nilai |
|---|---|
| Precision | **100%** — setiap flag Restock bertepatan dengan hari ada delivery |
| Recall | **91,8%** — 809 dari 881 delivery events teridentifikasi |
| False Positive | **0** |
| False Negative | 72 (delivery preventif — stok di atas threshold saat delivery tiba) |

### 4.3 Anomaly Detection

#### Gap sebagai Sinyal Kehilangan

$$\text{expected\_consumption}_{(d,i)} = \text{prev\_stock} + \text{delivery\_in} - \text{stock\_remaining}$$

$$\text{gap}_{(d,i)} = |\text{pos\_consumed} - \text{expected\_consumption}|$$

`expected_consumption` hanya dihitung untuk hari berurutan — hari setelah gap tanggal menghasilkan NaN dan dilewati, mencegah akumulasi konsumsi 2 hari yang menghasilkan false anomaly.

#### Dua Tipe Anomali

| Tipe | Kondisi | Interpretasi |
|---|---|---|
| Type 1 | `pos_consumed > expected` | POS mencatat konsumsi lebih besar dari gudang — data POS *inflated* |
| **Type 2** | `expected > pos_consumed` | **Gudang kehilangan lebih banyak dari yang bisa dijelaskan POS — shrinkage nyata** |

#### Hybrid MAD Detection

$$\text{Anomaly} = \underbrace{(\text{gap} > 1.000)}_{\text{Layer 1: Hard Floor}} \;\wedge\; \underbrace{\left(\text{gap} > \text{median}(\mathbf{g}_i) + \frac{3{,}5 \times \text{MAD}(\mathbf{g}_i)}{0{,}6745}\right)}_{\text{Layer 2: Modified Z-score per item}}$$

**Layer 1** sesuai spec kompetisi. **Layer 2** menggunakan MAD karena:

- *Breakdown point* 50% — tidak terpengaruh meskipun hingga 50% data terkontaminasi outlier (vs. 25% IQR, 0% mean±σ).
- **Robust terhadap circular statistics problem** — anomali dalam data historis tidak menggelembungkan fence deteksi ke atas.
- **Per-item** — Fresh Milk ~100.000 ml/hari (fence ~14.600 ml); Croissant ~40 pcs/hari (fence ~7 pcs). Threshold flat tidak adil secara statistik.

Konstanta 0,6745 membuat MAD ekuivalen dengan standar deviasi untuk distribusi normal, sehingga threshold 3,5 diinterpretasikan sebagai 3,5σ — mencakup 99,95% variasi operasional normal.

#### Prioritas Klasifikasi

$$\text{Anomaly} \succ \text{Restock} \succ \text{Safe}$$

---

## 5. Analisis & Temuan

### 5.1 Dampak Quantity Suspicious terhadap Deteksi Anomali

Qty 99/150 yang masuk BOM Calculation menghasilkan `pos_consumed` sangat besar → gap melebar ke arah POS > Warehouse (Type 1) → 625 false positive.

| Strategi | Anomali Total | Type 1 (false positive) | Type 2 (shrinkage nyata) |
|---|---|---|---|
| Baseline (qty 99/150 dibiarkan) | 631 | **625 (99%)** | 6 (1%) |
| S02 (qty 99/150 dikarantina) | 29 | 6 (21%) | **23 (79%)** |

Dengan mengkarantina suspicious quantity, Type 2 naik dari 6 → 23 karena tanpa noise, gap yang tersisa murni mencerminkan kehilangan di gudang.

> **[Gambar: Scatter plot pos_consumed vs expected_consumption]** — diagonal y=x memisahkan Type 1 (atas) dan Type 2 (bawah). Baseline: 625 titik di atas diagonal. S02: mayoritas di bawah.

### 5.2 Dampak Additional_Info Filter

`Additional_Info` berisi 6.458 baris error string (`Err0r`, `#VALUE`, `#REF!`, dll.) yang **independen** dari validitas `Menu_ID` dan `Quantity` — artifact logging POS.

| Strategi | Anomali | Type 1 | Type 2 |
|---|---|---|---|
| S02 (filter = ignore) | 29 | 6 | **23** |
| S03 (filter = aktif) | 21 | 6 | **15** |

Filter membuang 6.458 transaksi valid → 8 sinyal shrinkage nyata hilang, tanpa mengurangi false positive satupun.

### 5.3 Perbandingan Metode Statistik Anomali

| Metode | Anomali | Type 2 (shrinkage) | Breakdown Point |
|---|---|---|---|
| Hard floor saja (`gap > 1.000`) | 1.265 | ~6 | 0% |
| Hybrid IQR (`Q3 + 1,5·IQR`) | 36 | 29 | 25% |
| **Hybrid MAD (Modified Z-score)** | **29** | **23** | **50%** |

IQR mendeteksi lebih banyak Type 2 (29 vs. 23) karena fence-nya lebih rendah untuk 35 dari 42 item. MAD dipilih karena robustness statistik yang superior.

### 5.4 Evaluasi 8 Strategi

| ID | dup | qty | addinfo | Anomaly | Restock | Safe | AvgFlips |
|---|---|---|---|---|---|---|---|
| Baseline | drop | keep | ignore | 631 | 730 | 5.989 | 39,48 |
| S01 | drop | keep | filter | 608 | 735 | 6.007 | 39,43 |
| **S02 ⭐** | **drop** | **invalid** | **ignore** | **29** | **797** | **6.524** | **25,10** |
| S03 | drop | invalid | filter | 21 | 801 | 6.528 | 25,02 |
| S04 | sum | keep | ignore | 631 | 730 | 5.989 | 39,48 |
| S05 | sum | keep | filter | 611 | 735 | 6.004 | 39,45 |
| S06 | sum | invalid | ignore | 32 | 794 | 6.524 | 25,02 |
| S07 | sum | invalid | filter | 21 | 801 | 6.528 | 25,02 |

**AvgFlips** = rata-rata perubahan status per item per 175 hari. Baseline ~39 flip (~setiap 4,5 hari) — terlalu volatile untuk sinyal bisnis. S02 menurunkannya ke ~25 flip (~setiap 7 hari).

**Mengapa S02, bukan S03?** S03 menghasilkan lebih sedikit anomali (21 vs. 29), namun 8 di antaranya adalah Type 2 yang hilang akibat filter Additional_Info. S02 mempertahankan 23 Type 2 — lebih banyak sinyal shrinkage nyata.

---

## 6. Hasil

### 6.1 Output `Action_Report.csv` (Strategi S02)

| Action_Status | Jumlah | Persentase |
|---|---|---|
| Safe | 6.524 | 88,76% |
| Restock | 797 | 10,84% |
| Anomaly | 29 | 0,39% |
| **Total** | **7.350** | **100%** |

### 6.2 Validasi Hasil

**Restock (797 baris):** Precision **100%**, Recall **91,8%** terhadap ground truth delivery events. 8,2% yang terlewat adalah delivery preventif — false negative yang dapat diterima secara operasional.

**Anomaly (29 baris):** 23 dari 29 (79,3%) adalah Type 2 — kandidat shrinkage nyata yang memerlukan investigasi lanjutan.

**Runtime:** ~0,38 detik per eksekusi pada 170.000+ baris — memenuhi kebutuhan operasional harian.

---

## 7. Keterbatasan

1. **Konversi Karton tidak tersedia secara eksplisit.** Threshold untuk item Karton diderivasi empiris dari perilaku restock historis. Tiga item Karton tanpa riwayat delivery (INV-0007, INV-0018, INV-0027) tidak mendapat sinyal Restock yang bermakna.

2. **Enam tanggal tanpa data gudang** tidak menghasilkan output Action_Report (6 Jan, 6 Feb, 9 Feb, 22 Mar, 27 Mei, 10 Jun 2025). Tidak ada interpolasi atau forward-fill yang dilakukan.

3. **Asumsi lag delivery = 0.** Pipeline mengasumsikan delivery dicatat di hari yang sama dengan kondisi kritis yang memicunya. Jika ada lag antara pemesanan dan penerimaan, akurasi formula Restock berkurang.

4. **MAD vs. IQR trade-off.** IQR mendeteksi 6 sinyal shrinkage nyata lebih banyak (29 vs. 23). Pilihan MAD didasarkan pada ketahanan terhadap kontaminasi historis, bukan semata sensitivitas deteksi.

---

## 8. Kesimpulan

Pipeline yang dibangun berhasil merekonsiliasi tiga sumber data terfragmentasi dengan kualitas rendah menjadi laporan status inventaris yang akurat dan dapat dieksekusi tanpa intervensi manusia.

**Temuan kunci:**

- **Quantity suspicious adalah sumber noise terbesar** pada data POS UMKM — nilai 99 dan 150 menyebabkan 625 false positive yang mendominasi 99% anomali Baseline dan menutupi 17 sinyal shrinkage nyata.
- **Threshold statistik per-item lebih unggul dari flat threshold** — perbedaan skala konsumsi 3–4 order of magnitude antar item membuat threshold flat tidak bermakna secara statistik.
- **`stock_before_delivery` adalah kondisi restock yang tepat** — bukan `stock_remaining` — karena delivery menutupi kondisi kritis yang sebenarnya.
- **Additional_Info sebagai filter merugikan** — kolom ini independen dari validitas transaksi, sehingga memfilternya membuang data valid dan menghilangkan sinyal shrinkage.
- **MAD lebih robust dari IQR** dalam konteks data historis yang mungkin terkontaminasi — breakdown point 50% mencegah threshold bergeser seiring akumulasi data anomalus.
