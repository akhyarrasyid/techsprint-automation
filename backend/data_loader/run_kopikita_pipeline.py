import os
import sys
import json
import re
import warnings
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings('ignore')

def run_pipeline():
    # ── Path Configuration ──
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_dir = os.path.join(base_dir, "dataset")
    os.makedirs(dataset_dir, exist_ok=True)
    
    # Raw source files
    SALES_PATH      = os.path.join(dataset_dir, 'sales_history (Competitors).csv')
    WAREHOUSE_PATH  = os.path.join(dataset_dir, 'warehouse_stock (Competitors).json')
    BOM_PATH        = os.path.join(dataset_dir, 'Recipe_BOM (Competitors).json')
    INVENTORY_PATH  = os.path.join(dataset_dir, 'Master_Inventory (Competitors).csv')
    EMPLOYEE_PATH   = os.path.join(dataset_dir, 'Employee (Competitors).json')
    
    # Processed output files
    SALES_FIXED_PATH     = os.path.join(dataset_dir, 'sales_history_fixed.csv')
    WAREHOUSE_CSV_PATH   = os.path.join(dataset_dir, 'warehouse_stock.csv')
    BOM_CSV_PATH         = os.path.join(dataset_dir, 'Recipe_BOM.csv')
    EMPLOYEE_CSV_PATH    = os.path.join(dataset_dir, 'Employee.csv')
    ACTION_REPORT_PATH   = os.path.join(dataset_dir, 'Action_Report.csv')
    
    print("Starting Kopikita Roastery Data Pipeline...")
    
    # Verify files
    for p in [SALES_PATH, WAREHOUSE_PATH, BOM_PATH, INVENTORY_PATH, EMPLOYEE_PATH]:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Source file not found: {p}")
            
    # ── 1. Load & Process Employee ──
    print("Processing Employee data...")
    with open(EMPLOYEE_PATH, 'r', encoding='utf-8') as f:
        emp = json.load(f)
    pd.DataFrame(emp['employees']).to_csv(EMPLOYEE_CSV_PATH, index=False)
    
    # ── 2. Load & Process BOM ──
    print("Processing Recipe BOM data...")
    with open(BOM_PATH, 'r', encoding='utf-8') as f:
        bom_raw = json.load(f)
    bom_rows = [
        {
            'Menu_ID': m['Menu_ID'], 'Menu_Name': m['Menu_Name'],
            'Selling_Price_IDR': m['Selling_Price_IDR'],
            'Item_ID': ing['Item_ID'], 'Item_Name': ing['Item_Name'],
            'qty_used': ing['qty_used'], 'UoM': ing['UoM'],
        }
        for m in bom_raw['menu_items'] for ing in m['ingredients']
    ]
    bom_df = pd.DataFrame(bom_rows)
    bom_df.to_csv(BOM_CSV_PATH, index=False)
    
    # ── 3. Load & Process Warehouse Stock ──
    print("Processing Warehouse Stock data (handling schema drift & UoM mismatch)...")
    with open(WAREHOUSE_PATH, 'r', encoding='utf-8') as f:
        wh_raw = json.load(f)
        
    wh_rows = []
    for rec in wh_raw['records']:
        for entry in rec['stock_entries']:
            # Handle Schema Drift
            stock = entry.get('stock_remaining', entry.get('sisa_stok_akhir'))
            wh_rows.append({
                'record_id': rec['record_id'], 'date': rec['date'],
                'recorded_by': rec['recorded_by'], 'Item_ID': entry['Item_ID'],
                'stock_remaining': stock, 'delivery_in': entry['delivery_in'],
                'UoM': entry['UoM'],
            })
            
    wh_df = pd.DataFrame(wh_rows)
    
    # UoM fix: normalisasi satuan supplier ke satuan warehouse
    for uom_from, uom_to in [('kilogram', 'gram'), ('liter', 'ml')]:
        mask = wh_df['UoM'] == uom_from
        wh_df.loc[mask, ['stock_remaining', 'delivery_in']] *= 1000
        wh_df.loc[mask, 'UoM'] = uom_to
        
    # Fix INV-0007 (Condensed Milk) karton entry error on 2025-01-17
    mask_karton = (wh_df['Item_ID'] == 'INV-0007') & (wh_df['UoM'] == 'karton')
    wh_df.loc[mask_karton, 'stock_remaining'] = 76800.0
    wh_df.loc[mask_karton, 'UoM'] = 'ml'
    
    wh_df.to_csv(WAREHOUSE_CSV_PATH, index=False)
    
    # ── 4. Clean Sales History ──
    print("Cleansing Sales History (fixing Transaction_ID, DateTime formats, Quantity parsing, and Menu_ID recovery)...")
    sales = pd.read_csv(SALES_PATH)
    
    # Clean Transaction_ID
    def fix_trx_id(val):
        val = str(val).strip()
        val = re.sub(r'^TRX_', 'TRX-', val)
        val = val.rstrip('X')
        val = re.sub(r'^TRX--', 'TRX-', val)
        return val
    sales['Transaction_ID'] = sales['Transaction_ID'].apply(fix_trx_id)
    
    # Parse DateTime
    DATETIME_FORMATS = [
        '%Y-%m-%d %H:%M:%S',
        '%d/%m/%Y %H:%M',
        '%b %d %Y %H:%M',
        '%Y%m%d%H%M',
        '%m-%d-%Y %I:%M %p',
        '%Y.%m.%d %H:%M',
    ]
    def parse_datetime(val):
        if pd.isna(val):
            return pd.NaT
        for fmt in DATETIME_FORMATS:
            try:
                return pd.to_datetime(str(val).strip(), format=fmt)
            except ValueError:
                continue
        return pd.NaT
    sales['DateTime'] = sales['DateTime'].apply(parse_datetime)
    sales = sales[sales['DateTime'].notna()].reset_index(drop=True)
    sales['DateTime'] = sales['DateTime'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # Recover Menu_ID from Item_Name
    name_to_menu = dict(zip(
        bom_df['Menu_Name'].str.lower().str.strip(),
        bom_df['Menu_ID']
    ))
    mask_menu = sales['Menu_ID'].isna() & sales['Item_Name'].notna()
    sales.loc[mask_menu, 'Menu_ID'] = (
        sales.loc[mask_menu, 'Item_Name'].str.lower().str.strip().map(name_to_menu)
    )
    
    # Parse Quantity
    WORD_TO_NUM = {'two': 2, 'dua': 2, 'one': 1, 'satu': 1, 'three': 3, 'tiga': 3}
    def fix_quantity(val):
        if pd.isna(val):
            return val
        s = str(val).strip().lower()
        if s in WORD_TO_NUM:
            return float(WORD_TO_NUM[s])
        s = re.sub(r'\s*(cups?|pcs?|porsi|unit)$', '', s).strip()
        s = s.replace(',', '.')
        try:
            return float(s)
        except ValueError:
            return val
            
    sales['Quantity'] = sales['Quantity'].apply(fix_quantity)
    sales['Quantity'] = pd.to_numeric(sales['Quantity'], errors='coerce')
    
    sales.to_csv(SALES_FIXED_PATH, index=False)
    
    # ── 5. Reconcile Stock and Detect Anomalies ──
    print("Running Stock Reconciliation & Hybrid MAD Anomaly Detection...")
    sales_clean = pd.read_csv(SALES_FIXED_PATH)
    sales_clean['DateTime'] = pd.to_datetime(sales_clean['DateTime'])
    sales_clean['Date']     = sales_clean['DateTime'].dt.date
    sales_clean['Quantity'] = pd.to_numeric(sales_clean['Quantity'], errors='coerce')
    
    bom_clean = pd.read_csv(BOM_CSV_PATH)[['Menu_ID', 'Item_ID', 'qty_used']]
    inv_df = pd.read_csv(INVENTORY_PATH)
    
    # Preprocess warehouse stock
    wh = pd.read_csv(WAREHOUSE_CSV_PATH)
    wh['date'] = pd.to_datetime(wh['date']).dt.date
    wh = wh.sort_values(['Item_ID', 'date']).reset_index(drop=True)
    
    wh['prev_date']  = wh.groupby('Item_ID')['date'].shift(1)
    wh['prev_stock'] = wh.groupby('Item_ID')['stock_remaining'].shift(1)
    wh['day_delta'] = (
        pd.to_datetime(wh['date'].astype(str)) -
        pd.to_datetime(wh['prev_date'].astype(str))
    ).dt.days
    
    wh['expected_consumption'] = np.where(
        wh['day_delta'] == 1,
        wh['prev_stock'] + wh['delivery_in'] - wh['stock_remaining'],
        np.nan
    )
    
    # Restock threshold calculation
    UOM_MULTIPLIER = {'Kilogram': 1000, 'Liter': 1000, 'Pcs': 1, 'Karton': 1}
    inv_df['restock_threshold'] = inv_df.apply(
        lambda r: float(r['Min_Stock_Threshold'] * UOM_MULTIPLIER[r['Supplier_UoM']]),
        axis=1
    )
    
    wh['stock_before_delivery'] = wh['stock_remaining'] - wh['delivery_in']
    karton_ids  = set(inv_df[inv_df['Supplier_UoM'] == 'Karton']['Item_ID'])
    deliveries  = wh[wh['Item_ID'].isin(karton_ids) & (wh['delivery_in'] > 0)]
    avg_before  = deliveries.groupby('Item_ID')['stock_before_delivery'].mean()
    for item_id, thr in avg_before.items():
        inv_df.loc[inv_df['Item_ID'] == item_id, 'restock_threshold'] = round(thr, 1)
        
    threshold_map = inv_df.set_index('Item_ID')['restock_threshold'].to_dict()
    
    # Ingest & filter sales for BOM calculation
    df_sales = sales_clean.copy()
    df_sales['_invalid'] = False
    
    # Quarantine conditions
    VALID_MENUS = {f'MENU-{str(i).zfill(3)}' for i in range(1, 26)}
    df_sales.loc[df_sales['Quantity'] < 0, '_invalid'] = True
    df_sales.loc[df_sales['Quantity'].isna() | (df_sales['Quantity'] == 0), '_invalid'] = True
    df_sales.loc[~df_sales['Menu_ID'].isin(VALID_MENUS), '_invalid'] = True
    df_sales.loc[df_sales['Quantity'].isin([99, 150]), '_invalid'] = True
    
    valid_sales = df_sales[~df_sales['_invalid']].copy()
    valid_sales = valid_sales.drop_duplicates(subset='Transaction_ID', keep='first')
    
    # Explode BOM
    exploded = valid_sales.merge(bom_clean, on='Menu_ID', how='inner')
    exploded['consumed'] = exploded['qty_used'] * exploded['Quantity']
    
    daily_consumption = (
        exploded.groupby(['Date', 'Item_ID'])['consumed']
        .sum()
        .reset_index()
        .rename(columns={'consumed': 'pos_consumed'})
    )
    
    # Merge POS consumption with Warehouse Stock
    recon = wh.rename(columns={'date': 'Date'}).merge(
        daily_consumption, on=['Date', 'Item_ID'], how='left'
    )
    recon['pos_consumed'] = recon['pos_consumed'].fillna(0)
    recon['gap']          = (recon['pos_consumed'] - recon['expected_consumption']).abs()
    
    recon['stock_before_delivery'] = recon['stock_remaining'] - recon['delivery_in']
    recon['restock_threshold']     = recon['Item_ID'].map(threshold_map)
    
    # Modified Z-score MAD calculation per item
    computable = recon[recon['gap'].notna()]
    item_stats = computable.groupby('Item_ID')['gap'].agg(
        _median='median',
        _mad=lambda x: (x - x.median()).abs().median(),
    ).reset_index()
    
    item_stats['mad_upper'] = np.where(
        item_stats['_mad'] > 0,
        item_stats['_median'] + 3.5 * item_stats['_mad'] / 0.6745,
        np.inf
    )
    
    recon = recon.merge(item_stats[['Item_ID', 'mad_upper']], on='Item_ID', how='left')
    
    ANOMALY_THRESHOLD = 1_000
    hard_floor   = recon['gap'].notna() & (recon['gap'] > ANOMALY_THRESHOLD)
    stat_outlier = recon['gap'] > recon['mad_upper']
    anomaly_cond = hard_floor & stat_outlier
    
    conditions = [
        anomaly_cond,
        recon['stock_before_delivery'] < recon['restock_threshold'],
    ]
    recon['Action_Status'] = np.select(conditions, ['Anomaly', 'Restock'], default='Safe')
    
    # Save Action_Report.csv
    action_report = (
        recon[['Date', 'Item_ID', 'Action_Status']]
        .assign(Date=lambda d: pd.to_datetime(d['Date']))
        .sort_values(['Date', 'Item_ID'])
        .reset_index(drop=True)
    )
    action_report.to_csv(ACTION_REPORT_PATH, index=False)
    
    # Copy Action_Report.csv to backend root directory for visibility if needed
    shutil_copied = False
    try:
        import shutil
        shutil.copy(ACTION_REPORT_PATH, os.path.join(base_dir, "Action_Report.csv"))
        shutil_copied = True
    except Exception as e:
        print(f"Copying Action_Report.csv to backend root failed: {e}")
        
    print("Action_Report.csv saved successfully!")
    print(f"Total rows in report: {len(action_report)}")
    print(recon['Action_Status'].value_counts())
    
if __name__ == "__main__":
    run_pipeline()
