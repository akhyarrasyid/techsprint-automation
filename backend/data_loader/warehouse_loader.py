import os
import json
import pandas as pd

def load_warehouse_data(filepath: str = None) -> pd.DataFrame:
    if filepath is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, "dataset", "warehouse_stock (Competitors).json")
        
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Warehouse stock dataset not found at {filepath}")
        
    with open(filepath, 'r') as f:
        data = json.load(f)
        
    records = data.get("records", [])
    flat_records = []
    
    for r in records:
        record_id = r.get("record_id")
        date_str = r.get("date")
        recorded_by = r.get("recorded_by")
        stock_entries = r.get("stock_entries", [])
        
        for entry in stock_entries:
            flat_records.append({
                "record_id": record_id,
                "date": date_str,
                "recorded_by": recorded_by,
                "Item_ID": entry.get("Item_ID"),
                "stock_remaining": float(entry.get("stock_remaining", 0.0)),
                "delivery_in": float(entry.get("delivery_in", 0.0)),
                "UoM": entry.get("UoM")
            })
            
    df = pd.DataFrame(flat_records)
    # Ensure date is parsed
    df['Parsed_Date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['Parsed_Date']).copy()
    df['Date_Str'] = df['Parsed_Date'].dt.strftime('%Y-%m-%d')
    return df

if __name__ == "__main__":
    df = load_warehouse_data()
    print(f"Loaded {len(df)} warehouse stock records.")
    print(df.head())
