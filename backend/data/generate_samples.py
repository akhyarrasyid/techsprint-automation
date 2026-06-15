import os
import sys
import pandas as pd

# Add parent to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mock_data import get_mock_sales_data
from config.products import BOM

def generate():
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    
    # 1. Generate Sales CSV
    df_sales = get_mock_sales_data(num_days=30)
    sales_path = os.path.join(os.path.dirname(__file__), "sample_sales.csv")
    df_sales.to_csv(sales_path, index=False)
    print(f"Generated sample sales data at {sales_path} with {len(df_sales)} rows.")
    
    # 2. Generate BOM CSV
    bom_records = []
    for prod_id, items in BOM.items():
        for item in items:
            bom_records.append({
                "product_id": prod_id,
                "material_id": item["material_id"],
                "material_name": item["name"],
                "qty_required": item["qty_required"],
                "unit": item["unit"]
            })
    df_bom = pd.DataFrame(bom_records)
    bom_path = os.path.join(os.path.dirname(__file__), "sample_bom.csv")
    df_bom.to_csv(bom_path, index=False)
    print(f"Generated sample BOM data at {bom_path} with {len(df_bom)} rows.")

if __name__ == "__main__":
    generate()
