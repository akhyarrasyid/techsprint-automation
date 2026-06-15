import pandas as pd
import datetime
from typing import Dict, Any

# Target forecast for next week (7 days sum)
TARGET_FORECASTS = {
    "PRD001": 1390,  # Avg ~198.57 per day
    "PRD002": 1180,  # Avg ~168.57 per day
    "PRD003": 980,   # Avg ~140.00 per day
    "PRD004": 860,   # Avg ~122.86 per day
    "PRD005": 720    # Avg ~102.86 per day
}

PRODUCT_METADATA = {
    "PRD001": {"name": "Tepung Protein", "base_sales": 180, "current_stock": 1200, "price": 15000, "cost": 10000, "lead_time": 3},
    "PRD002": {"name": "Gula Pasir", "base_sales": 150, "current_stock": 900, "price": 18000, "cost": 13000, "lead_time": 4},
    "PRD003": {"name": "Minyak Goreng", "base_sales": 120, "current_stock": 700, "price": 25000, "cost": 19000, "lead_time": 5},
    "PRD004": {"name": "Tepung Bumbu", "base_sales": 110, "current_stock": 500, "price": 12000, "cost": 8000, "lead_time": 2},
    "PRD005": {"name": "Santan Instan", "base_sales": 90, "current_stock": 450, "price": 8000, "cost": 5000, "lead_time": 3}
}

def get_mock_sales_data(num_days: int = 30) -> pd.DataFrame:
    """
    Generates a deterministic historical sales dataframe for the 5 key products.
    Returns: pd.DataFrame with columns:
      - date (string, YYYY-MM-DD)
      - product_id (string)
      - sales_qty (float)
      - current_stock (float)
      - selling_price (float)
      - unit_cost (float)
      - lead_time_days (float)
      - promotion (float)
    """
    records = []
    # Start date is fixed so that the data is completely deterministic
    start_date = datetime.date(2026, 5, 17)
    
    for day_idx in range(num_days):
        current_date = start_date + datetime.timedelta(days=day_idx)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Day of week pattern
        day_of_week = current_date.weekday()
        # Weekends have higher sales for groceries
        weekend_multiplier = 1.25 if day_of_week >= 5 else 1.0
        
        for prod_id, meta in PRODUCT_METADATA.items():
            # Deterministic variation
            # Use day_idx to vary sales deterministically
            cycle_var = (day_idx % 5) * 4 - (day_idx % 3) * 6
            sales = round((meta["base_sales"] + cycle_var) * weekend_multiplier)
            
            # Stock decreases as sales happen (simulate stock reduction)
            # Let's keep it simple and stable
            stock = max(50, meta["current_stock"] - (day_idx * 10) % 300)
            
            # Promotions occur on some days deterministically (every 6th day)
            promo = 1.0 if (day_idx + list(PRODUCT_METADATA.keys()).index(prod_id)) % 6 == 0 else 0.0
            
            records.append({
                "date": date_str,
                "product_id": prod_id,
                "sales_qty": float(sales),
                "current_stock": float(stock),
                "selling_price": float(meta["price"]),
                "unit_cost": float(meta["cost"]),
                "lead_time_days": float(meta["lead_time"]),
                "promotion": promo
            })
            
    return pd.DataFrame(records)
