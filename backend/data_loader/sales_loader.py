import os
import pandas as pd
import numpy as np

def load_sales_data(filepath: str = None) -> pd.DataFrame:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixed_path = os.path.join(base_dir, "dataset", "sales_history_fixed.csv")
    
    if filepath is None and os.path.exists(fixed_path):
        # Extremely fast path using pre-cleansed data
        df = pd.read_csv(fixed_path)
        df['Parsed_DateTime'] = pd.to_datetime(df['DateTime'])
        df['Date'] = df['Parsed_DateTime'].dt.date
        df['Date_Str'] = df['Parsed_DateTime'].dt.strftime('%Y-%m-%d')
        if 'Hour' not in df.columns:
            df['Hour'] = df['Parsed_DateTime'].dt.hour
        if 'DayOfWeek' not in df.columns:
            df['DayOfWeek'] = df['Parsed_DateTime'].dt.dayofweek
        return df

    if filepath is None:
        filepath = os.path.join(base_dir, "dataset", "sales_history (Competitors).csv")
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Sales history dataset not found at {filepath}")
        
    df = pd.read_csv(filepath)
    
    # Clean Quantity
    def clean_qty(val):
        if pd.isna(val):
            return 1.0
        val_str = str(val).strip().lower()
        val_str = val_str.replace('pcs', '').strip()
        val_str = val_str.replace(',', '.')
        try:
            return float(val_str)
        except ValueError:
            text_map = {'one': 1.0, 'two': 2.0, 'three': 3.0, 'four': 4.0, 'five': 5.0}
            for k, v in text_map.items():
                if k in val_str:
                    return v
            return 1.0

    df['Quantity'] = df['Quantity'].apply(clean_qty)
    
    # Parse DateTime column
    df['Parsed_DateTime'] = pd.to_datetime(df['DateTime'], errors='coerce', format='mixed')
    
    # Handle numeric style dates e.g. 202503270913
    missing_dates = df['Parsed_DateTime'].isna() & df['DateTime'].notna()
    if missing_dates.any():
        def parse_numeric_datetime(val):
            val_str = str(val).strip()
            if len(val_str) == 12 and val_str.isdigit():
                try:
                    return pd.to_datetime(val_str, format='%Y%m%d%H%M')
                except:
                    pass
            elif len(val_str) == 8 and val_str.isdigit():
                try:
                    return pd.to_datetime(val_str, format='%Y%m%d')
                except:
                    pass
            return pd.NaT
        df.loc[missing_dates, 'Parsed_DateTime'] = df.loc[missing_dates, 'DateTime'].apply(parse_numeric_datetime)
    
    df = df.dropna(subset=['Parsed_DateTime']).copy()
    df['Date'] = df['Parsed_DateTime'].dt.date
    df['Date_Str'] = df['Parsed_DateTime'].dt.strftime('%Y-%m-%d')
    df['Hour'] = df['Parsed_DateTime'].dt.hour
    df['DayOfWeek'] = df['Parsed_DateTime'].dt.dayofweek
    df['Employee_ID'] = df['Employee_ID'].fillna('UNKNOWN')
    df['Menu_ID'] = df['Menu_ID'].fillna('UNKNOWN')
    df['Item_Name'] = df['Item_Name'].fillna('Unknown Item')
    return df

if __name__ == "__main__":
    df = load_sales_data()
    print(f"Loaded {len(df)} sales transactions.")
    print(df.head())
