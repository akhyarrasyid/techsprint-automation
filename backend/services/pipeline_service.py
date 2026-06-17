import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from data_loader.feature_store import FeatureStore
from services.validation_service import validate_sales_data
from services.model_loader import ModelLoader

# ── Detailed Raw Material Metadata (42 Ingredients) ──
# Realistic supplier details, unit costs (IDR per gram/ml/pcs), and default lead times.
INGREDIENT_DETAILS = {
    # Coffee Bean (gram)
    "INV-0001": {"name": "Espresso Bean Arabica", "unit": "gram", "unit_cost": 150.0, "supplier": "PT Gayo Kopi Utama", "lead_time": 4, "category": "Coffee Bean"},
    "INV-0002": {"name": "Robusta Bean", "unit": "gram", "unit_cost": 100.0, "supplier": "PT Gayo Kopi Utama", "lead_time": 4, "category": "Coffee Bean"},
    "INV-0003": {"name": "Decaf Bean", "unit": "gram", "unit_cost": 120.0, "supplier": "PT Gayo Kopi Utama", "lead_time": 4, "category": "Coffee Bean"},
    # Dairy & Alt (ml)
    "INV-0004": {"name": "Fresh Milk", "unit": "ml", "unit_cost": 15.0, "supplier": "PT Indomilk Industri", "lead_time": 2, "category": "Dairy"},
    "INV-0005": {"name": "Oat Milk", "unit": "ml", "unit_cost": 30.0, "supplier": "PT Indomilk Industri", "lead_time": 2, "category": "Dairy Alt"},
    "INV-0006": {"name": "Almond Milk", "unit": "ml", "unit_cost": 35.0, "supplier": "PT Indomilk Industri", "lead_time": 2, "category": "Dairy Alt"},
    "INV-0007": {"name": "Condensed Milk", "unit": "ml", "unit_cost": 12.0, "supplier": "PT Indomilk Industri", "lead_time": 2, "category": "Dairy"},
    "INV-0008": {"name": "Whipping Cream", "unit": "ml", "unit_cost": 25.0, "supplier": "PT Indomilk Industri", "lead_time": 2, "category": "Dairy"},
    # Syrup & Sauce (ml)
    "INV-0009": {"name": "Vanilla Syrup", "unit": "ml", "unit_cost": 40.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Syrup"},
    "INV-0010": {"name": "Caramel Syrup", "unit": "ml", "unit_cost": 40.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Syrup"},
    "INV-0011": {"name": "Hazelnut Syrup", "unit": "ml", "unit_cost": 40.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Syrup"},
    "INV-0012": {"name": "Gula Aren Syrup", "unit": "ml", "unit_cost": 20.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Syrup"},
    "INV-0013": {"name": "Chocolate Sauce", "unit": "ml", "unit_cost": 30.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Syrup"},
    "INV-0016": {"name": "Simple Syrup", "unit": "ml", "unit_cost": 10.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Syrup"},
    "INV-0020": {"name": "Honey", "unit": "ml", "unit_cost": 50.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Syrup"},
    "INV-0021": {"name": "Lemon Juice", "unit": "ml", "unit_cost": 15.0, "supplier": "PT Sweetener Indonesia", "lead_time": 3, "category": "Juice"},
    # Powders (gram)
    "INV-0014": {"name": "Matcha Powder", "unit": "gram", "unit_cost": 120.0, "supplier": "PT Powderindo Utama", "lead_time": 3, "category": "Powder"},
    "INV-0015": {"name": "Green Tea Powder", "unit": "gram", "unit_cost": 100.0, "supplier": "PT Powderindo Utama", "lead_time": 3, "category": "Powder"},
    "INV-0019": {"name": "Chocolate Powder", "unit": "gram", "unit_cost": 80.0, "supplier": "PT Powderindo Utama", "lead_time": 3, "category": "Powder"},
    # Packaging (pcs)
    "INV-0025": {"name": "Paper Cup 8oz", "unit": "pcs", "unit_cost": 800.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0026": {"name": "Paper Cup 12oz", "unit": "pcs", "unit_cost": 1000.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0027": {"name": "Paper Cup 16oz", "unit": "pcs", "unit_cost": 1200.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0028": {"name": "Plastic Cup 16oz", "unit": "pcs", "unit_cost": 600.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0029": {"name": "Lid 8oz", "unit": "pcs", "unit_cost": 200.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0030": {"name": "Lid 12-16oz", "unit": "pcs", "unit_cost": 250.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0031": {"name": "Dome Lid", "unit": "pcs", "unit_cost": 300.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0032": {"name": "Paper Straw", "unit": "pcs", "unit_cost": 150.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0033": {"name": "Wooden Stirrer", "unit": "pcs", "unit_cost": 100.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    "INV-0034": {"name": "Napkin", "unit": "pcs", "unit_cost": 50.0, "supplier": "PT Kemasindo Pack", "lead_time": 4, "category": "Packaging"},
    # Food & Bakery (pcs/gram)
    "INV-0035": {"name": "Croissant Plain Frozen", "unit": "pcs", "unit_cost": 12000.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    "INV-0036": {"name": "Almond Croissant Frozen", "unit": "pcs", "unit_cost": 15000.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    "INV-0037": {"name": "Banana Bread Slice", "unit": "pcs", "unit_cost": 10000.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    "INV-0038": {"name": "Chocolate Muffin", "unit": "pcs", "unit_cost": 9000.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    "INV-0039": {"name": "Cheese Slice", "unit": "pcs", "unit_cost": 1500.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    "INV-0040": {"name": "Bread Loaf", "unit": "pcs", "unit_cost": 15000.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    "INV-0041": {"name": "Butter", "unit": "gram", "unit_cost": 100.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    "INV-0042": {"name": "Vanilla Ice Cream", "unit": "ml", "unit_cost": 20.0, "supplier": "PT Bakery Mart", "lead_time": 2, "category": "Food"},
    # Others
    "INV-0017": {"name": "Black Tea Bag", "unit": "pcs", "unit_cost": 1000.0, "supplier": "PT Agro Boga", "lead_time": 3, "category": "Tea"},
    "INV-0018": {"name": "Green Tea Bag", "unit": "pcs", "unit_cost": 1200.0, "supplier": "PT Agro Boga", "lead_time": 3, "category": "Tea"},
    "INV-0022": {"name": "Sparkling Water", "unit": "pcs", "unit_cost": 5000.0, "supplier": "PT Agro Boga", "lead_time": 3, "category": "Beverage"},
    "INV-0023": {"name": "Sugar", "unit": "gram", "unit_cost": 15.0, "supplier": "PT Agro Boga", "lead_time": 3, "category": "Pantry"},
    "INV-0024": {"name": "Ice Cube", "unit": "gram", "unit_cost": 2.0, "supplier": "PT Agro Boga", "lead_time": 3, "category": "Pantry"}
}

def run_full_pipeline(df: pd.DataFrame = None, scenario_name: str = "Base") -> Dict[str, Any]:
    """
    Executes the dataset-driven enterprise business planning pipeline:
    1. Ingestion & Validation
    2. Autoregressive Ensemble Demand Forecasting (5 weeks projection)
    3. Ingredient Demand Explosion & Statistics
    4. Inventory Planning (Safety Stock, ROP, EOQ, Status)
    5. MRP (Material Requirements Planning)
    6. COGS explosion & Profitability Analysis
    7. Executive Dashboard Summary
    """
    print(f"Executing pipeline under scenario: {scenario_name}...")
    
    # ── 1. Ingestion & Validation ──
    if df is None:
        df = FeatureStore.get_sales_data()
        
    validation_report = validate_sales_data(df)
    
    # Load support datasets from FeatureStore
    inventory_df = FeatureStore.get_inventory_data()
    warehouse_df = FeatureStore.get_warehouse_data()
    bom_data = FeatureStore.get_bom_data()
    bom_mapping = FeatureStore.get_bom_mapping()
    menu_name_mapping = FeatureStore.get_menu_name_mapping()
    menu_price_mapping = FeatureStore.get_menu_price_mapping()
    
    # Clean transactions
    VALID_MENUS = set(menu_name_mapping.keys())
    clean_sales = df[
        (df['Menu_ID'].isin(VALID_MENUS)) &
        (df['Quantity'] > 0) &
        (~df['Quantity'].isin([99, 150]))
    ].copy()
    clean_sales = clean_sales.drop_duplicates(subset='Transaction_ID', keep='first')
    
    # Aggregate daily sales per menu item
    clean_sales['Parsed_DateTime'] = pd.to_datetime(clean_sales['DateTime'])
    clean_sales['Date'] = clean_sales['Parsed_DateTime'].dt.date
    daily_sales = clean_sales.groupby(['Date', 'Menu_ID'])['Quantity'].sum().reset_index()
    
    # Last date of historical records
    last_date = clean_sales['Date'].max()
    if pd.isnull(last_date):
        last_date = datetime(2025, 6, 30).date() # Default fallback
        
    # --- 2. Load Model Mappings for Ensemble ---
    models_dir = os.path.join(parent_dir, "models")
    mapping_path = os.path.join(models_dir, "menu_mapping.json")
    menu_codes = {}
    if os.path.exists(mapping_path):
        try:
            with open(mapping_path, "r") as f:
                menu_codes = json.load(f)
        except Exception:
            pass
    if not menu_codes:
        menu_codes = {menu: i for i, menu in enumerate(sorted(VALID_MENUS))}
        
    # ── 3. Autoregressive Multi-Week Forecasting ──
    forecast_report = []
    
    # Pre-calculate DOW baseline averages
    daily_sales['day_of_week'] = pd.to_datetime(daily_sales['Date']).dt.weekday
    dow_averages = daily_sales.groupby(['Menu_ID', 'day_of_week'])['Quantity'].mean().to_dict()
    menu_overall_mean = daily_sales.groupby('Menu_ID')['Quantity'].mean().to_dict()
    
    for menu_id in sorted(VALID_MENUS):
        menu_name = menu_name_mapping.get(menu_id, f"Product {menu_id}")
        price = menu_price_mapping.get(menu_id, 20000.0)
        
        # Historical series
        menu_history = daily_sales[daily_sales['Menu_ID'] == menu_id].sort_values('Date')
        
        # Roll window
        history_values = list(menu_history['Quantity'].values)
        if not history_values:
            history_values = [10.0] * 7
            
        # Standard deviation of sales (for CI)
        sales_std = np.std(history_values) if len(history_values) > 1 else 2.0
        if sales_std == 0:
            sales_std = 2.0
            
        # Autoregressive Loop for 35 days (5 weeks)
        predictions = []
        current_window = history_values[-7:] if len(history_values) >= 7 else (history_values + [np.mean(history_values)]*7)[:7]
        
        for day_idx in range(1, 36):
            pred_date = last_date + timedelta(days=day_idx)
            dow = pred_date.weekday()
            is_wknd = 1 if dow in [5, 6] else 0
            
            # Prepare features
            lag_1 = current_window[-1]
            lag_7 = current_window[0]
            roll_mean = np.mean(current_window)
            roll_std = np.std(current_window)
            code = menu_codes.get(menu_id, 0)
            
            features = np.array([lag_1, lag_7, roll_mean, roll_std, dow, is_wknd, code])
            
            # Baseline forecast (day-of-week average fallback)
            baseline = dow_averages.get((menu_id, dow), menu_overall_mean.get(menu_id, 15.0))
            
            # Predict
            pred_qty = ModelLoader.predict_ensemble(features, baseline)
            
            # Apply scenario adjustments on forecasts
            if scenario_name == "High Demand +20%":
                pred_qty *= 1.2
                
            predictions.append(pred_qty)
            
            # Slide window
            current_window.pop(0)
            current_window.append(pred_qty)
            
        # Calculate weekly sums
        f_w1 = round(sum(predictions[0:7]), 2)
        f_w2 = round(sum(predictions[7:14]), 2)
        f_w3 = round(sum(predictions[14:21]), 2)
        f_w4 = round(sum(predictions[21:28]), 2)
        f_w5 = round(sum(predictions[28:35]), 2)
        
        trend = round(((f_w5 - f_w1) / f_w1) * 100, 1) if f_w1 > 0 else 0.0
        
        # Confidence interval
        ci_spread = 1.96 * sales_std * np.sqrt(7)
        ci_low = max(0.0, round(f_w1 - ci_spread, 2))
        ci_high = round(f_w1 + ci_spread, 2)
        
        forecast_report.append({
            "product_id": menu_id,
            "product_name": menu_name,
            "forecast_next_week": f_w1,
            "forecast_w25": f_w2,
            "forecast_w26": f_w3,
            "forecast_w27": f_w4,
            "forecast_w28": f_w5,
            "trend_pct": trend,
            "confidence_interval_low": ci_low,
            "confidence_interval_high": ci_high
        })
        
    # ── 4. Explode Daily Historical Ingredient Consumption ──
    # Map menu sales transactions to ingredient level to compute variance and std dev
    exploded_history = clean_sales.merge(
        pd.DataFrame([
            {
                'Menu_ID': m_id,
                'Item_ID': ing['Item_ID'],
                'qty_used': ing['qty_used']
            }
            for m_id, ingredients in bom_mapping.items()
            for ing in ingredients
        ]),
        on='Menu_ID'
    )
    exploded_history['consumed'] = exploded_history['Quantity'] * exploded_history['qty_used']
    daily_ing_consumption = exploded_history.groupby(['Date', 'Item_ID'])['consumed'].sum().reset_index()
    
    ing_stats = daily_ing_consumption.groupby('Item_ID')['consumed'].agg(['mean', 'std']).fillna(0.0).to_dict('index')
    
    # ── 5. Inventory & Supply Chain Planning ──
    inventory_report = []
    recommended_orders_dict = {}
    
    # Get latest stock from warehouse stock
    latest_wh = warehouse_df.sort_values('date').groupby('Item_ID').last().reset_index()
    latest_stock_map = latest_wh.set_index('Item_ID')['stock_remaining'].to_dict()
    
    # Map raw material costs and details (apply Raw Material +10% scenario)
    cost_multiplier = 1.10 if scenario_name == "Raw Material +10%" else 1.0
    
    # Calculate ingredient forecasted demand (Week 1)
    week1_forecast_dict = {f["product_id"]: f["forecast_next_week"] for f in forecast_report}
    ingredient_forecast_w1 = {}
    for menu_id, f_val in week1_forecast_dict.items():
        for ing in bom_mapping.get(menu_id, []):
            item_id = ing['Item_ID']
            ingredient_forecast_w1[item_id] = ingredient_forecast_w1.get(item_id, 0.0) + (ing['qty_used'] * f_val)
            
    # Iterate through all 42 ingredients from Master_Inventory
    for _, row in inventory_df.iterrows():
        item_id = row['Item_ID']
        item_name = row['Item_Name']
        category = row['Category']
        uom = row['Supplier_UoM']
        
        # Details config fallback
        details = INGREDIENT_DETAILS.get(item_id, {
            "name": item_name, "unit": "pcs", "unit_cost": 500.0, "supplier": "Supplier General", "lead_time": 3, "category": category
        })
        
        # Scenario adjustments on lead times
        lead_time = float(details["lead_time"])
        if scenario_name == "Supplier Delay +5 hari":
            lead_time += 5
            
        unit_cost = float(details["unit_cost"]) * cost_multiplier
        supplier_name = details["supplier"]
        wh_unit = details["unit"]
        
        # Calculate stats
        stats = ing_stats.get(item_id, {"mean": 10.0, "std": 2.0})
        avg_demand = stats["mean"]
        std_demand = stats["std"]
        
        # Safety Stock & Reorder Point
        safety_stock = 1.65 * std_demand * np.sqrt(lead_time)
        reorder_point = (avg_demand * lead_time) + safety_stock
        
        # Current stock in warehouse
        current_stock = float(latest_stock_map.get(item_id, 0.0))
        
        # Forecast demand
        forecast_demand_7d = float(ingredient_forecast_w1.get(item_id, avg_demand * 7))
        
        # Target stock & EOQ
        target_stock = reorder_point + forecast_demand_7d
        
        # EOQ calculation (annual demand, setup cost, holding cost)
        annual_demand = avg_demand * 365
        setup_cost = 50000.0  # Default ordering cost
        holding_cost = max(10.0, 0.1 * unit_cost) # 10% holding cost per year, min 10 IDR
        
        eoq = np.sqrt((2 * annual_demand * setup_cost) / holding_cost) if holding_cost > 0 else 100.0
        
        # Ordering decision
        if current_stock <= reorder_point:
            recommended_order = max(eoq, target_stock - current_stock)
        else:
            recommended_order = 0.0
            
        estimated_cost = round(recommended_order * unit_cost, 2)
        
        # Status determination
        if current_stock <= safety_stock:
            status = "critical"
        elif current_stock <= reorder_point:
            status = "warning"
        else:
            status = "healthy"
            
        recommended_orders_dict[item_id] = recommended_order
        
        inventory_report.append({
            "product_id": item_id,
            "product_name": item_name,
            "current_stock": round(current_stock, 2),
            "safety_stock": round(safety_stock, 2),
            "reorder_point": round(reorder_point, 2),
            "forecast_demand_7d": round(forecast_demand_7d, 2),
            "target_stock_level": round(target_stock, 2),
            "recommended_order": round(recommended_order, 2),
            "recommended_order_qty": round(recommended_order, 2),
            "estimated_cost": estimated_cost,
            "status": status,
            "uom": wh_unit,
            "supplier_uom": uom,
            "supplier": supplier_name,
            "category": category
        })
        
    # ── 6. MRP (Material Requirements Planning) ──
    # Nested Accordion structure mapping Menu Items -> required ingredients.
    mrp_report = []
    base_date = last_date + timedelta(days=1)
    
    # We use Week 1 Forecasted demand as the target production quantity
    for f_item in forecast_report:
        prod_id = f_item["product_id"]
        prod_name = f_item["product_name"]
        production_qty = f_item["forecast_next_week"]
        
        materials = []
        for ing in bom_mapping.get(prod_id, []):
            mat_id = ing['Item_ID']
            mat_name = ing['Item_Name']
            qty_per_unit = ing['qty_used']
            wh_unit = ing['UoM']
            
            # Needed quantity
            needed = qty_per_unit * production_qty
            
            # Details config
            details = INGREDIENT_DETAILS.get(mat_id, {
                "unit_cost": 500.0, "supplier": "Supplier General", "lead_time": 3
            })
            
            lead_time_days = int(details["lead_time"])
            if scenario_name == "Supplier Delay +5 hari":
                lead_time_days += 5
                
            unit_cost = float(details["unit_cost"]) * cost_multiplier
            supplier_name = details["supplier"]
            
            # Stock & shortage
            stock = float(latest_stock_map.get(mat_id, 0.0))
            shortage = max(0.0, needed - stock)
            order_cost = shortage * unit_cost
            
            arrival_date = base_date + timedelta(days=lead_time_days)
            arrival_str = arrival_date.strftime("%d %B %Y")
            
            materials.append({
                "material_id": mat_id,
                "material_name": mat_name,
                "qty_required": round(needed, 2),
                "current_stock": round(stock, 2),
                "shortage": round(shortage, 2),
                "unit": wh_unit,
                "unit_cost": round(unit_cost, 2),
                "order_cost": round(order_cost, 2),
                "supplier": supplier_name,
                "lead_time": lead_time_days,
                "expected_arrival": arrival_str
            })
            
        mrp_report.append({
            "product_id": prod_id,
            "product_name": prod_name,
            "recommended_order": round(production_qty, 2),
            "production_qty": round(production_qty, 2),
            "materials": materials
        })
        
    # ── 7. Profitability Analysis ──
    profitability_report = []
    total_estimated_revenue = 0.0
    total_estimated_cost = 0.0
    total_estimated_profit = 0.0
    
    for f_item in forecast_report:
        prod_id = f_item["product_id"]
        prod_name = f_item["product_name"]
        forecast_qty = f_item["forecast_next_week"]
        
        selling_price = float(menu_price_mapping.get(prod_id, 20000.0))
        
        # Calculate COGS dynamically by exploding ingredients
        cogs = 0.0
        for ing in bom_mapping.get(prod_id, []):
            mat_id = ing['Item_ID']
            qty_used = ing['qty_used']
            
            details = INGREDIENT_DETAILS.get(mat_id, {"unit_cost": 500.0})
            mat_unit_cost = float(details["unit_cost"]) * cost_multiplier
            cogs += (qty_used * mat_unit_cost)
            
        profit = (selling_price - cogs) * forecast_qty
        revenue = selling_price * forecast_qty
        cost = cogs * forecast_qty
        
        total_estimated_revenue += revenue
        total_estimated_cost += cost
        total_estimated_profit += profit
        
        profitability_report.append({
            "product_id": prod_id,
            "product_name": prod_name,
            "forecast_qty": round(forecast_qty, 2),
            "selling_price": selling_price,
            "unit_cost": round(cogs, 2),
            "margin_per_unit": round(selling_price - cogs, 2),
            "estimated_revenue": round(revenue, 2),
            "estimated_cost": round(cost, 2),
            "estimated_profit": round(profit, 2)
        })
        
    # ── 8. Executive Dashboard Summary ──
    total_forecast_demand = int(sum(item["forecast_next_week"] for item in forecast_report))
    profit_margin = round((total_estimated_profit / total_estimated_revenue) * 100, 1) if total_estimated_revenue > 0 else 0.0
    stockout_risk_count = sum(1 for item in inventory_report if item["status"] in ["critical", "warning"])
    purchase_orders_needed = sum(1 for item in inventory_report if item["recommended_order"] > 0)
    
    dashboard_summary = {
        "total_forecast_demand": total_forecast_demand,
        "expected_revenue": int(total_estimated_revenue),
        "expected_profit": int(total_estimated_profit),
        "profit_margin": profit_margin,
        "stockout_risk_count": stockout_risk_count,
        "purchase_orders_needed": purchase_orders_needed
    }
    
    return {
        "validation": validation_report,
        "dashboard_summary": dashboard_summary,
        "forecast": forecast_report,
        "inventory": inventory_report,
        "mrp": mrp_report,
        "profitability": profitability_report
    }

if __name__ == "__main__":
    print("Testing pipeline service...")
    res = run_full_pipeline()
    print("Dashboard Summary:")
    print(res["dashboard_summary"])
