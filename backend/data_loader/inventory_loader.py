import os
import pandas as pd

def load_inventory_data(filepath: str = None) -> pd.DataFrame:
    if filepath is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, "dataset", "Master_Inventory (Competitors).csv")
        
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Master inventory dataset not found at {filepath}")
        
    df = pd.read_csv(filepath)
    df['Min_Stock_Threshold'] = pd.to_numeric(df['Min_Stock_Threshold'], errors='coerce').fillna(0.0)
    df['Item_ID'] = df['Item_ID'].astype(str).str.strip()
    df['Item_Name'] = df['Item_Name'].astype(str).str.strip()
    df['Supplier_UoM'] = df['Supplier_UoM'].astype(str).str.strip()
    df['Category'] = df['Category'].astype(str).str.strip()
    return df

if __name__ == "__main__":
    df = load_inventory_data()
    print(f"Loaded {len(df)} inventory master items.")
    print(df.head())
