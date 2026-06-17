"""
Scenario Service — Multi-scenario comparison engine.

Runs the full pipeline across multiple business scenarios and returns
a consolidated view suitable for the Profitability & Scenario Engine page.

Scenarios:
  - Base (no adjustments)
  - High Demand +20% (demand_multiplier=1.2)
  - Supplier Delay +5 hari (lead_time +5, service level drop, holding cost increase)
  - Raw Material +10% (cost_multiplier=1.1)
"""

import os
import sys

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore
from typing import Dict, Any, List


SCENARIO_NAMES = [
    "Base",
    "High Demand +20%",
    "Supplier Delay +5 hari",
    "Raw Material +10%"
]


def _calculate_service_level(inventory: List[Dict]) -> float:
    """Estimate service level % based on inventory statuses."""
    if not inventory:
        return 98.0
    healthy_count = sum(1 for item in inventory if item.get("status", "").lower() == "healthy")
    return round((healthy_count / len(inventory)) * 100, 1)


def _calculate_holding_cost(inventory: List[Dict]) -> float:
    """Rough holding cost = sum(current_stock * 0.15 * unit_cost)."""
    total = 0.0
    from services.pipeline_service import INGREDIENT_DETAILS
    for item in inventory:
        pid = item.get("product_id", "")
        details = INGREDIENT_DETAILS.get(pid, {})
        cost = details.get("unit_cost", 100.0)
        stock = item.get("current_stock", 0)
        total += stock * 0.15 * cost  # 15% annual holding cost
    return round(total, 2)


def run_scenario_comparison() -> Dict[str, Any]:
    """
    Execute all 4 scenarios and return a consolidated profitability report.

    Returns:
    {
        "by_product": [...],   # Base scenario product breakdown
        "scenarios": [
            {
                "name": "Base",
                "total_revenue": ...,
                "total_cogs": ...,
                "gross_profit": ...,
                "margin_pct": ...,
                "service_level": ...,
                "holding_cost": ...
            },
            ...
        ]
    }
    """
    # -- by_product from Base scenario --
    base_results = PipelineStore.get_results("Base")
    base_profitability = base_results.get("profitability", [])

    by_product = []
    for item in base_profitability:
        revenue = item.get("estimated_revenue", 0)
        cogs = item.get("estimated_cost", 0)
        gross_profit = item.get("estimated_profit", 0)
        margin_pct = round((gross_profit / revenue) * 100, 1) if revenue > 0 else 0.0

        by_product.append({
            "product_id": item["product_id"],
            "product_name": item["product_name"],
            "revenue": round(revenue, 2),
            "cogs": round(cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "margin_pct": margin_pct
        })

    # -- Multi-scenario comparison --
    scenarios = []
    for scen_name in SCENARIO_NAMES:
        results = PipelineStore.get_results(scen_name)
        prof = results.get("profitability", [])
        inv = results.get("inventory", [])

        total_revenue = sum(p.get("estimated_revenue", 0) for p in prof)
        total_cogs = sum(p.get("estimated_cost", 0) for p in prof)
        gross_profit = total_revenue - total_cogs
        margin_pct = round((gross_profit / total_revenue) * 100, 1) if total_revenue > 0 else 0.0
        service_level = _calculate_service_level(inv)
        holding_cost = _calculate_holding_cost(inv)

        scenarios.append({
            "name": scen_name,
            "total_revenue": round(total_revenue, 2),
            "total_cogs": round(total_cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "margin_pct": margin_pct,
            "service_level": service_level,
            "holding_cost": holding_cost
        })

    return {
        "by_product": by_product,
        "scenarios": scenarios
    }
