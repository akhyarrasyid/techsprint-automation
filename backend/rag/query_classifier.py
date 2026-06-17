"""
Query Classifier — Rule-based classification of user questions into domain categories.
Used to focus RAG retrieval and prompt augmentation on relevant domains.
"""

from typing import List

# Category keywords mapping
CATEGORY_KEYWORDS = {
    "forecast": [
        "forecast", "demand", "ramalan", "permintaan", "produksi", "target",
        "tren", "trend", "moving average", "seasonality", "musiman",
        "prediksi", "proyeksi", "minggu depan", "confidence interval",
        "lag", "rolling mean", "time series",
    ],
    "inventory": [
        "inventory", "stok", "stock", "restock", "safety stock", "rop",
        "reorder", "stockout", "gudang", "eoq", "buffer", "persediaan",
        "kehabisan", "abc analysis", "holding cost", "warehouse",
    ],
    "mrp": [
        "mrp", "material", "bahan", "bahan baku", "shortage", "bom",
        "bill of material", "raw material", "kebutuhan material",
        "purchase order", "po", "komponen", "produksi",
    ],
    "profit": [
        "profit", "revenue", "margin", "cost", "keuangan", "laba",
        "rugi", "harga", "pendapatan", "untung", "cogs", "biaya",
        "profitabilitas", "contribution margin", "net profit",
    ],
    "supplier": [
        "supplier", "pemasok", "vendor", "procurement", "pengadaan",
        "lead time", "eta", "pengiriman", "delivery", "sourcing",
        "keterlambatan", "delay",
    ],
    "xai": [
        "xai", "explainable", "shap", "feature importance", "waterfall",
        "model", "confidence", "interpretasi", "penjelasan model",
        "faktor", "variabel", "prediktor",
    ],
    "digital_twin": [
        "digital twin", "simulasi", "simulation", "what if", "skenario",
        "scenario", "monte carlo", "dampak", "impact", "disruption",
        "inflasi", "delay", "surge",
    ],
    "general": [],
}


def classify_query(question: str) -> List[str]:
    """
    Classify a question into one or more domain categories.
    Returns list of matched category names, sorted by relevance (match count).
    Falls back to ['general'] if no specific match.
    """
    q = question.lower()
    scores: dict[str, int] = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        if category == "general":
            continue
        match_count = sum(1 for kw in keywords if kw in q)
        if match_count > 0:
            scores[category] = match_count

    if not scores:
        return ["general"]

    # Sort by match count descending, return top categories
    sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [cat for cat, _ in sorted_cats]
