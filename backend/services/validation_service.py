import pandas as pd
from typing import Dict, Any, List

REQUIRED_COLUMNS = [
    "date",
    "product_id",
    "sales_qty",
    "current_stock",
    "selling_price",
    "unit_cost",
    "lead_time_days",
    "promotion"
]

def validate_sales_data(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Validates the input sales DataFrame and returns a comprehensive report.
    Raises ValueError if critical columns are missing.
    """
    # Check for required columns
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")
        
    row_count = len(df)
    
    # Convert date to datetime safely
    df_temp = df.copy()
    df_temp["date"] = pd.to_datetime(df_temp["date"])
    
    # Unique products
    unique_products = df_temp["product_id"].unique().tolist()
    product_count = len(unique_products)
    
    # Date range
    min_date = df_temp["date"].min()
    max_date = df_temp["date"].max()
    
    start_str = min_date.strftime("%Y-%m-%d") if not pd.isnull(min_date) else "N/A"
    end_str = max_date.strftime("%Y-%m-%d") if not pd.isnull(max_date) else "N/A"
    
    # Missing values count in required columns
    missing_values = int(df_temp[REQUIRED_COLUMNS].isnull().sum().sum())
    
    # Warning checks
    warnings = []
    
    # Warning 1: Check history duration for each product (< 30 days)
    for prod_id in unique_products:
        prod_df = df_temp[df_temp["product_id"] == prod_id]
        if len(prod_df) > 0:
            days_history = (prod_df["date"].max() - prod_df["date"].min()).days + 1
            if days_history < 30:
                warnings.append(f"{prod_id} memiliki history kurang dari 30 hari ({days_history} hari)")
                
    # Warning 2: Check for negative values in quantity, stock, price, etc.
    numeric_cols = ["sales_qty", "current_stock", "selling_price", "unit_cost"]
    for col in numeric_cols:
        negative_count = int((df_temp[col] < 0).sum())
        if negative_count > 0:
            warnings.append(f"Kolom '{col}' mengandung {negative_count} nilai negatif")
            
    return {
        "row_count": row_count,
        "product_count": product_count,
        "date_range": {
            "start": start_str,
            "end": end_str
        },
        "missing_values": missing_values,
        "warnings": warnings
    }
