import pandas as pd
from typing import Dict, List, Any

def calculate_safety_stock(
    avg_demand: float,
    max_demand: float,
    avg_lead_time: float,
    max_lead_time: float
) -> float:
    """
    Safety Stock = (Max Demand * Max Lead Time) - (Avg Demand * Avg Lead Time)
    """
    safety_stock = (max_demand * max_lead_time) - (avg_demand * avg_lead_time)
    return max(0.0, float(safety_stock))

def calculate_reorder_point(
    avg_daily_demand: float,
    lead_time_days: float,
    safety_stock: float
) -> float:
    """
    Reorder Point (ROP) = (Avg Daily Demand * Lead Time) + Safety Stock
    """
    rop = (avg_daily_demand * lead_time_days) + safety_stock
    return max(0.0, float(rop))

def calculate_recommended_order(
    current_stock: float,
    reorder_point: float,
    target_stock_level: float
) -> float:
    """
    Recommended Order = Target Stock Level - Current Stock (if stock is below ROP, else 0)
    """
    if current_stock <= reorder_point:
        return max(0.0, float(target_stock_level - current_stock))
    return 0.0

def calculate_estimated_profit(
    sales_qty: float,
    selling_price: float,
    unit_cost: float,
    promotion_cost: float = 0.0
) -> float:
    """
    Profit = (Sales Qty * Selling Price) - (Sales Qty * Unit Cost) - Promotion Cost
    """
    revenue = sales_qty * selling_price
    cogs = sales_qty * unit_cost
    profit = revenue - cogs - promotion_cost
    return float(profit)

def run_mrp(recommended_orders: Dict[str, float], bom: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Dict[str, Any]]:
    """
    Material Requirements Planning (MRP)
    Translates finished goods recommended orders into raw materials requirement list based on Bill of Materials (BOM).
    
    recommended_orders: Dict[product_id, qty]
    bom: Dict[product_id, List[BOMItem]]
    
    Returns: Dict[material_id, MaterialRequirement]
    """
    raw_material_requirements = {}
    for prod_id, order_qty in recommended_orders.items():
        if order_qty <= 0.0:
            continue
        
        if prod_id in bom:
            for item in bom[prod_id]:
                mat_id = item["material_id"]
                mat_name = item["name"]
                unit = item["unit"]
                qty_per_unit = item["qty_required"]
                
                total_qty_needed = qty_per_unit * order_qty
                
                if mat_id not in raw_material_requirements:
                    raw_material_requirements[mat_id] = {
                        "material_id": mat_id,
                        "name": mat_name,
                        "qty_required": 0.0,
                        "unit": unit
                    }
                raw_material_requirements[mat_id]["qty_required"] += total_qty_needed
                
    # Round quantities for presentation
    for mat_id in raw_material_requirements:
        raw_material_requirements[mat_id]["qty_required"] = round(raw_material_requirements[mat_id]["qty_required"], 2)
        
    return raw_material_requirements

def calculate_scenario(df: pd.DataFrame, scenario_name: str) -> pd.DataFrame:
    """
    Applies business planning scenarios:
    - Base: No changes.
    - High Demand +20%: Increases sales_qty and forecasts by 20%
    - Supplier Delay +5 hari: Increases lead_time_days by 5
    - Raw Material +10%: Increases unit_cost by 10%
    """
    df_scen = df.copy()
    
    if scenario_name == "High Demand +20%":
        df_scen["sales_qty"] = df_scen["sales_qty"] * 1.2
        if "forecast_qty" in df_scen:
            df_scen["forecast_qty"] = df_scen["forecast_qty"] * 1.2
            
    elif scenario_name == "Supplier Delay +5 hari":
        df_scen["lead_time_days"] = df_scen["lead_time_days"] + 5
        
    elif scenario_name == "Raw Material +10%":
        df_scen["unit_cost"] = df_scen["unit_cost"] * 1.10
        
    return df_scen
