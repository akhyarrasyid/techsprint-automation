import pandas as pd
from typing import Dict, Any, List

REQUIRED_COLUMNS = [
    "Transaction_ID",
    "DateTime",
    "Menu_ID",
    "Quantity"
]

def validate_sales_data(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Validates the real sales history dataset.
    Checks for required columns, nulls, negative quantities, and suspicious entries.
    """
    # Check for required columns
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")
        
    row_count = len(df)
    
    # Convert date to datetime safely
    df_temp = df.copy()
    df_temp["Parsed_DateTime"] = pd.to_datetime(df_temp["DateTime"], errors='coerce')
    
    # Unique Menu items
    unique_menus = df_temp["Menu_ID"].dropna().unique().tolist()
    menu_count = len(unique_menus)
    
    # Date range
    min_date = df_temp["Parsed_DateTime"].min()
    max_date = df_temp["Parsed_DateTime"].max()
    
    start_str = min_date.strftime("%Y-%m-%d") if not pd.isnull(min_date) else "N/A"
    end_str = max_date.strftime("%Y-%m-%d") if not pd.isnull(max_date) else "N/A"
    
    # Missing values count in required columns
    missing_values = int(df_temp[REQUIRED_COLUMNS].isnull().sum().sum())
    
    # Warning checks
    warnings = []
    
    # Warning 1: Check history duration for each Menu Item (< 30 days)
    for menu_id in unique_menus:
        menu_df = df_temp[df_temp["Menu_ID"] == menu_id]
        if len(menu_df) > 0:
            valid_dates = menu_df["Parsed_DateTime"].dropna()
            if not valid_dates.empty:
                days_history = (valid_dates.max() - valid_dates.min()).days + 1
                if days_history < 30:
                    warnings.append(f"{menu_id} memiliki history kurang dari 30 hari ({days_history} hari)")
                
    # Warning 2: Check for negative/zero/suspicious values in Quantity
    negative_qty = int((df_temp["Quantity"] < 0).sum())
    if negative_qty > 0:
        warnings.append(f"Kolom 'Quantity' mengandung {negative_qty} nilai negatif")
        
    zero_qty = int((df_temp["Quantity"] == 0).sum())
    if zero_qty > 0:
        warnings.append(f"Kolom 'Quantity' mengandung {zero_qty} nilai nol")
        
    suspicious_qty = int(df_temp["Quantity"].isin([99, 150]).sum())
    if suspicious_qty > 0:
        warnings.append(f"Kolom 'Quantity' mengandung {suspicious_qty} baris kuantitas mencurigakan (99 atau 150)")
            
    return {
        "row_count": row_count,
        "product_count": menu_count,
        "date_range": {
            "start": start_str,
            "end": end_str
        },
        "missing_values": missing_values,
        "warnings": warnings
    }
