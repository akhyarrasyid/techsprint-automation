import pandas as pd
import numpy as np

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Perform feature engineering on sales dataset:
    - Sorts by product_id and date
    - Calculates lags: lag_1, lag_7, lag_14
    - Calculates rolling features: rolling_mean_7, rolling_mean_14, rolling_std_7
    - Extracts calendar features: month, week_of_year, is_weekend
    - Encodes product_id using label encoding
    """
    # Create copy to avoid modifying original dataframe in-place
    df_feat = df.copy()
    
    # Ensure date column is datetime format
    df_feat['date'] = pd.to_datetime(df_feat['date'])
    
    # Sort by product and date
    df_feat = df_feat.sort_values(by=['product_id', 'date']).reset_index(drop=True)
    
    # Label encode product_id
    product_mapping = {
        "PRD001": 0,
        "PRD002": 1,
        "PRD003": 2,
        "PRD004": 3,
        "PRD005": 4
    }
    df_feat['product_id_encoded'] = df_feat['product_id'].map(product_mapping).fillna(-1).astype(int)
    
    # Lags (grouped by product_id)
    df_feat['lag_1'] = df_feat.groupby('product_id')['sales_qty'].shift(1)
    df_feat['lag_7'] = df_feat.groupby('product_id')['sales_qty'].shift(7)
    df_feat['lag_14'] = df_feat.groupby('product_id')['sales_qty'].shift(14)
    
    # Rolling features (grouped by product_id)
    # Using shift(1) before rolling to prevent target leakage in future predictions
    df_feat['rolling_mean_7'] = df_feat.groupby('product_id')['sales_qty'].transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).mean()
    )
    df_feat['rolling_mean_14'] = df_feat.groupby('product_id')['sales_qty'].transform(
        lambda x: x.shift(1).rolling(window=14, min_periods=1).mean()
    )
    df_feat['rolling_std_7'] = df_feat.groupby('product_id')['sales_qty'].transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).std()
    )
    
    # Fill remaining NaNs for first rows
    df_feat['lag_1'] = df_feat['lag_1'].fillna(df_feat['sales_qty'])
    df_feat['lag_7'] = df_feat['lag_7'].fillna(df_feat['sales_qty'])
    df_feat['lag_14'] = df_feat['lag_14'].fillna(df_feat['sales_qty'])
    
    df_feat['rolling_mean_7'] = df_feat['rolling_mean_7'].fillna(df_feat['sales_qty'])
    df_feat['rolling_mean_14'] = df_feat['rolling_mean_14'].fillna(df_feat['sales_qty'])
    df_feat['rolling_std_7'] = df_feat['rolling_std_7'].fillna(0.0)
    
    # Calendar features
    df_feat['month'] = df_feat['date'].dt.month
    df_feat['week_of_year'] = df_feat['date'].dt.isocalendar().week.astype(int)
    df_feat['is_weekend'] = df_feat['date'].dt.weekday.isin([5, 6]).astype(int)
    
    return df_feat
