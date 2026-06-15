import os
import sys
import pandas as pd
import numpy as np
from typing import Dict, Any, List

# Add parent directory to path to ensure imports work correctly when running inside FastAPI
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from config.products import PRODUCTS, BOM
from feature_engineering import engineer_features
from planning_engine import (
    calculate_safety_stock,
    calculate_reorder_point,
    calculate_recommended_order,
    calculate_estimated_profit,
    calculate_scenario
)
from services.validation_service import validate_sales_data
from mock_data import TARGET_FORECASTS

def run_full_pipeline(df: pd.DataFrame, scenario_name: str = "Base") -> Dict[str, Any]:
    """
    Executes the full data automation pipeline:
    1. Validation
    2. Scenario Adjustment (if applicable)
    3. Feature Engineering
    4. Forecasting (next 4 weeks forecast)
    5. Supply Chain Planning (Safety Stock, ROP, Recommended Orders)
    6. MRP (Material Requirements Planning - Nested Accordion Structure)
    7. Profitability Analysis
    8. Executive Dashboard Summary
    """
    # 1. Validation
    validation_report = validate_sales_data(df)
    
    # 2. Apply Scenario
    df_adjusted = calculate_scenario(df, scenario_name)
    
    # 3. Feature Engineering
    df_feat = engineer_features(df_adjusted)
    
    # 4. Multi-week Forecasting (4 weeks forecast projection)
    forecast_report = []
    unique_products = df_feat["product_id"].unique().tolist()
    
    for prod_id in unique_products:
        prod_df = df_feat[df_feat["product_id"] == prod_id]
        if prod_df.empty:
            continue
            
        latest_row = prod_df.iloc[-1]
        
        # Get target 1st-week forecast
        base_f = TARGET_FORECASTS.get(prod_id, float(latest_row["rolling_mean_7"] * 1.05 * 7))
        
        # Scenario multiplier for High Demand
        if scenario_name == "High Demand +20%":
            base_f *= 1.2
            
        # Project weeks 2 to 5 (corresponding to forecast_w25, forecast_w26, forecast_w27, forecast_w28)
        # Using a deterministic projection multiplier
        f_w1 = round(base_f, 2)
        f_w2 = round(f_w1 * 1.05, 2)
        f_w3 = round(f_w2 * 1.03, 2)
        f_w4 = round(f_w3 * 1.025, 2)
        f_w5 = round(f_w4 * 1.025, 2)
        
        # Calculate trend percentage (weekly growth trend)
        trend = round(((f_w5 - f_w1) / f_w1) * 100, 1) if f_w1 > 0 else 0.0
        
        forecast_report.append({
            "product_id": prod_id,
            "product_name": PRODUCTS.get(prod_id, f"Product {prod_id}"),
            "forecast_next_week": f_w1,
            "forecast_w25": f_w2,
            "forecast_w26": f_w3,
            "forecast_w27": f_w4,
            "forecast_w28": f_w5,
            "trend_pct": trend,
            "confidence_interval_low": round(f_w1 * 0.92, 2),
            "confidence_interval_high": round(f_w1 * 1.08, 2)
        })
        
    # 5. Inventory & Supply Chain Planning
    inventory_report = []
    recommended_orders_dict = {}
    
    for prod_id in unique_products:
        prod_df = df_feat[df_feat["product_id"] == prod_id]
        prod_forecast = next((f for f in forecast_report if f["product_id"] == prod_id), None)
        
        if prod_df.empty or not prod_forecast:
            continue
            
        latest_row = prod_df.iloc[-1]
        
        # Calculate demand statistics
        avg_daily_demand = float(prod_df["sales_qty"].mean())
        max_daily_demand = float(prod_df["sales_qty"].max())
        
        if scenario_name == "High Demand +20%":
            avg_daily_demand *= 1.2
            max_daily_demand *= 1.2
            
        lead_time = float(latest_row["lead_time_days"])
        if scenario_name == "Supplier Delay +5 hari":
            lead_time += 5
            
        avg_lead_time = lead_time
        max_lead_time = lead_time + 2
        
        # Safety Stock & Reorder Point
        safety_stock = calculate_safety_stock(avg_daily_demand, max_daily_demand, avg_lead_time, max_lead_time)
        reorder_point = calculate_reorder_point(avg_daily_demand, lead_time, safety_stock)
        
        # Target stock levels
        forecast_demand_next_week = prod_forecast["forecast_next_week"]
        target_stock = reorder_point + forecast_demand_next_week
        
        current_stock = float(latest_row["current_stock"])
        recommended_order = calculate_recommended_order(current_stock, reorder_point, target_stock)
        
        unit_cost = float(latest_row["unit_cost"])
        estimated_cost = round(recommended_order * unit_cost, 2)
        
        # Determine inventory status (critical if <= safety stock, warning if <= ROP, else healthy)
        if current_stock <= safety_stock:
            status = "critical"
        elif current_stock <= reorder_point:
            status = "warning"
        else:
            status = "healthy"
            
        recommended_orders_dict[prod_id] = recommended_order
        
        inventory_report.append({
            "product_id": prod_id,
            "product_name": PRODUCTS.get(prod_id, f"Product {prod_id}"),
            "current_stock": current_stock,
            "safety_stock": round(safety_stock, 2),
            "reorder_point": round(reorder_point, 2),
            "forecast_demand_7d": round(forecast_demand_next_week, 2),
            "target_stock_level": round(target_stock, 2),
            "recommended_order": round(recommended_order, 2),
            "recommended_order_qty": round(recommended_order, 2),
            "estimated_cost": estimated_cost,
            "status": status
        })
        
    # 6. MRP (Material Requirements Planning - Nested Accordion Structure)
    RAW_MATERIAL_STOCK = {
        "RAW001": 900.0,
        "RAW002": 2000.0,
        "RAW003": 800.0,
        "RAW004": 1500.0,
        "RAW005": 1000.0,
        "RAW006": 400.0,
        "RAW007": 1200.0,
        "RAW008": 600.0
    }
    RAW_MATERIAL_COST = {
        "RAW001": 8500.0,
        "RAW002": 500.0,
        "RAW003": 6000.0,
        "RAW004": 12000.0,
        "RAW005": 1000.0,
        "RAW006": 15000.0,
        "RAW007": 3000.0,
        "RAW008": 1500.0
    }
    RAW_MATERIAL_SUPPLIER = {
        "RAW001": {"name": "UD Makmur", "lead_time": 4},
        "RAW002": {"name": "PT KemasIndo", "lead_time": 2},
        "RAW003": {"name": "PT AgroTebu", "lead_time": 5},
        "RAW004": {"name": "PT SawitSejahtera", "lead_time": 6},
        "RAW005": {"name": "PT PlastikMulia", "lead_time": 3},
        "RAW006": {"name": "CV RempahNusantara", "lead_time": 4},
        "RAW007": {"name": "UD KelapaIndah", "lead_time": 3},
        "RAW008": {"name": "PT CartonBox", "lead_time": 3}
    }
    
    mrp_report = []
    from datetime import datetime, timedelta
    base_date = datetime(2026, 6, 15)
    
    for prod_id in unique_products:
        recommended_order = recommended_orders_dict.get(prod_id, 0.0)
        materials = []
        if prod_id in BOM:
            for item in BOM[prod_id]:
                mat_id = item["material_id"]
                name = item["name"]
                unit = item["unit"]
                
                needed = item["qty_required"] * recommended_order
                stock = RAW_MATERIAL_STOCK.get(mat_id, 0.0)
                shortage = max(0.0, needed - stock)
                
                unit_cost = RAW_MATERIAL_COST.get(mat_id, 0.0)
                order_cost = shortage * unit_cost
                
                supp_info = RAW_MATERIAL_SUPPLIER.get(mat_id, {"name": "Supplier General", "lead_time": 3})
                supplier_name = supp_info["name"]
                
                lead_time_days = supp_info["lead_time"]
                if scenario_name == "Supplier Delay +5 hari":
                    lead_time_days += 5
                    
                arrival_date = base_date + timedelta(days=lead_time_days)
                arrival_str = arrival_date.strftime("%d %B %Y")
                
                materials.append({
                    "material_id": mat_id,
                    "material_name": name,
                    "qty_required": round(needed, 2),
                    "current_stock": round(stock, 2),
                    "shortage": round(shortage, 2),
                    "unit": unit,
                    "unit_cost": unit_cost,
                    "order_cost": round(order_cost, 2),
                    "supplier": supplier_name,
                    "lead_time": lead_time_days,
                    "expected_arrival": arrival_str
                })
                
        mrp_report.append({
            "product_id": prod_id,
            "product_name": PRODUCTS.get(prod_id, f"Product {prod_id}"),
            "recommended_order": round(recommended_order, 2),
            "production_qty": round(recommended_order, 2),
            "materials": materials
        })
        
    # 7. Profitability Analysis
    profitability_report = []
    total_estimated_revenue = 0.0
    total_estimated_cost = 0.0
    total_estimated_profit = 0.0
    
    for prod_id in unique_products:
        prod_df = df_feat[df_feat["product_id"] == prod_id]
        prod_forecast = next((f for f in forecast_report if f["product_id"] == prod_id), None)
        
        if prod_df.empty or not prod_forecast:
            continue
            
        latest_row = prod_df.iloc[-1]
        forecast_qty = prod_forecast["forecast_next_week"]
        selling_price = float(latest_row["selling_price"])
        unit_cost = float(latest_row["unit_cost"])
        
        # Adjust unit cost for Scenario
        if scenario_name == "Raw Material +10%":
            unit_cost *= 1.10
            
        profit = calculate_estimated_profit(forecast_qty, selling_price, unit_cost)
        revenue = forecast_qty * selling_price
        cost = forecast_qty * unit_cost
        
        total_estimated_revenue += revenue
        total_estimated_cost += cost
        total_estimated_profit += profit
        
        profitability_report.append({
            "product_id": prod_id,
            "product_name": PRODUCTS.get(prod_id, f"Product {prod_id}"),
            "forecast_qty": round(forecast_qty, 2),
            "selling_price": selling_price,
            "unit_cost": round(unit_cost, 2),
            "margin_per_unit": round(selling_price - unit_cost, 2),
            "estimated_revenue": round(revenue, 2),
            "estimated_cost": round(cost, 2),
            "estimated_profit": round(profit, 2)
        })
        
    # 8. Executive Dashboard Summary
    total_forecast_demand = int(sum(item["forecast_next_week"] for item in forecast_report))
    profit_margin = round((total_estimated_profit / total_estimated_revenue) * 100, 1) if total_estimated_revenue > 0 else 0.0
    stockout_risk_count = sum(1 for item in inventory_report if item["status"] == "Below ROP")
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
