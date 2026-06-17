import os
import sys
import json
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import LabelEncoder

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from data_loader.sales_loader import load_sales_data

def train_and_save_models():
    models_dir = os.path.join(parent_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    print("Loading sales history...")
    df = load_sales_data()
    
    # Filter out UNKNOWN or invalid Menu_ID
    df = df[df['Menu_ID'] != 'UNKNOWN'].copy()
    
    # Aggregate daily sales per Menu_ID
    daily_sales = df.groupby(['Date_Str', 'Menu_ID'])['Quantity'].sum().reset_index()
    daily_sales.columns = ['date', 'Menu_ID', 'sales_qty']
    daily_sales['date'] = pd.to_datetime(daily_sales['date'])
    
    # Create a complete grid of date x Menu_ID to avoid missing days
    all_dates = pd.date_range(start=daily_sales['date'].min(), end=daily_sales['date'].max())
    all_menus = daily_sales['Menu_ID'].unique()
    grid = pd.MultiIndex.from_product([all_dates, all_menus], names=['date', 'Menu_ID']).to_frame().reset_index(drop=True)
    
    daily_sales = pd.merge(grid, daily_sales, on=['date', 'Menu_ID'], how='left').fillna(0.0)
    daily_sales = daily_sales.sort_values(by=['Menu_ID', 'date']).reset_index(drop=True)
    
    # Label encode Menu_ID
    le = LabelEncoder()
    daily_sales['Menu_ID_encoded'] = le.fit_transform(daily_sales['Menu_ID'])
    
    # Save Menu_ID mapping
    mapping = {menu: int(code) for menu, code in zip(le.classes_, range(len(le.classes_)))}
    with open(os.path.join(models_dir, "menu_mapping.json"), "w") as f:
        json.dump(mapping, f, indent=2)
    print("Saved Menu_ID mapping.")
    
    # Feature Engineering
    print("Engineering features...")
    # Lags
    daily_sales['lag_1'] = daily_sales.groupby('Menu_ID')['sales_qty'].shift(1)
    daily_sales['lag_7'] = daily_sales.groupby('Menu_ID')['sales_qty'].shift(7)
    
    # Rolling features
    daily_sales['rolling_mean_7'] = daily_sales.groupby('Menu_ID')['sales_qty'].transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).mean()
    )
    daily_sales['rolling_std_7'] = daily_sales.groupby('Menu_ID')['sales_qty'].transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).std()
    )
    
    # Calendar features
    daily_sales['day_of_week'] = daily_sales['date'].dt.weekday
    daily_sales['is_weekend'] = daily_sales['date'].dt.weekday.isin([5, 6]).astype(int)
    
    # Fill remaining NaNs
    daily_sales['lag_1'] = daily_sales.groupby('Menu_ID')['lag_1'].transform(lambda x: x.bfill().ffill())
    daily_sales['lag_7'] = daily_sales.groupby('Menu_ID')['lag_7'].transform(lambda x: x.bfill().ffill())
    daily_sales['rolling_mean_7'] = daily_sales.groupby('Menu_ID')['rolling_mean_7'].transform(lambda x: x.bfill().ffill())
    daily_sales['rolling_std_7'] = daily_sales.groupby('Menu_ID')['rolling_std_7'].transform(lambda x: x.bfill().ffill())
    
    daily_sales = daily_sales.fillna(0.0)
    
    # Features & Target
    feature_cols = ['lag_1', 'lag_7', 'rolling_mean_7', 'rolling_std_7', 'day_of_week', 'is_weekend', 'Menu_ID_encoded']
    X = daily_sales[feature_cols].values
    y = daily_sales['sales_qty'].values
    
    print(f"Features shape: {X.shape}, Target shape: {y.shape}")
    
    # --- 1. Train LightGBM ---
    print("Training LightGBM Regressor...")
    try:
        import lightgbm as lgb
        train_data = lgb.Dataset(X, label=y)
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'learning_rate': 0.05,
            'num_leaves': 31,
            'verbose': -1
        }
        booster = lgb.train(params, train_data, num_boost_round=100)
        booster.save_model(os.path.join(models_dir, "lightgbm_model.txt"))
        print("Successfully trained and saved LightGBM model.")
    except Exception as e:
        print(f"Failed to train LightGBM: {e}")
        
    # --- 2. Train CatBoost ---
    print("Training CatBoost Regressor...")
    try:
        from catboost import CatBoostRegressor
        cat_model = CatBoostRegressor(
            iterations=100,
            learning_rate=0.05,
            depth=6,
            loss_function='RMSE',
            verbose=0
        )
        cat_model.fit(X, y)
        cat_model.save_model(os.path.join(models_dir, "catboost_model.cbm"))
        print("Successfully trained and saved CatBoost model.")
    except Exception as e:
        print(f"Failed to train CatBoost: {e}")
        
    # --- 3. Train PyTorch NN & Export to ONNX ---
    print("Training PyTorch Neural Network...")
    try:
        class DemandNN(nn.Module):
            def __init__(self, input_dim):
                super(DemandNN, self).__init__()
                self.net = nn.Sequential(
                    nn.Linear(input_dim, 64),
                    nn.ReLU(),
                    nn.Linear(64, 32),
                    nn.ReLU(),
                    nn.Linear(32, 1)
                )
            def forward(self, x):
                return self.net(x)
                
        model = DemandNN(input_dim=len(feature_cols))
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.01)
        
        # Convert data to tensors
        X_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(1)
        
        # Train simple loop
        model.train()
        for epoch in range(100):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            
        print(f"Neural Network final training loss: {loss.item():.4f}")
        
        # Export to ONNX
        model.eval()
        dummy_input = torch.randn(1, len(feature_cols), dtype=torch.float32)
        onnx_path = os.path.join(models_dir, "demand_nn.onnx")
        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
        )
        print("Successfully exported Neural Network model to ONNX.")
    except Exception as e:
        print(f"Failed to train PyTorch/ONNX: {e}")
        
    # --- 4. Save Ensemble Weights ---
    weights = {"lgbm": 0.4, "catboost": 0.3, "nn": 0.3}
    with open(os.path.join(models_dir, "ensemble_weights.json"), "w") as f:
        json.dump(weights, f)
    print("Saved ensemble weights.")

if __name__ == "__main__":
    train_and_save_models()
