"""
KPI Service — Real-Time Key Performance Indicator Engine.
Computes supply chain KPIs from live pipeline data.
"""

from typing import Dict, Any, List
from services.pipeline_store import PipelineStore


def compute_kpis(scenario: str = "Base") -> Dict[str, Any]:
    """Compute all business KPIs from pipeline results."""
    results = PipelineStore.get_results(scenario)

    forecast = results.get("forecast", [])
    inventory = results.get("inventory", [])
    profitability = results.get("profitability", [])
    mrp = results.get("mrp", [])
    summary = results.get("dashboard_summary", {})

    # ── Service Level ──
    total_items = len(inventory)
    healthy_items = sum(1 for i in inventory if i.get("status", "").lower() == "healthy")
    service_level = round((healthy_items / total_items) * 100, 1) if total_items > 0 else 98.0

    # ── Fill Rate ──
    total_demand = sum(i.get("forecast_demand_7d", 0) for i in inventory)
    total_fulfilled = sum(
        min(i.get("current_stock", 0), i.get("forecast_demand_7d", 0))
        for i in inventory
    )
    fill_rate = round((total_fulfilled / total_demand) * 100, 1) if total_demand > 0 else 95.0

    # ── Inventory Turnover ──
    total_cogs = sum(p.get("estimated_cost", 0) for p in profitability)
    avg_inventory_value = sum(
        i.get("current_stock", 0) * next(
            (p.get("unit_cost", 10000) for p in profitability if p.get("product_id") == i.get("product_id")),
            10000
        )
        for i in inventory
    )
    inventory_turnover = round(total_cogs / avg_inventory_value, 2) if avg_inventory_value > 0 else 0
    days_of_inventory = round(365 / inventory_turnover, 1) if inventory_turnover > 0 else 999

    # ── Forecast Accuracy (simulated based on confidence interval width) ──
    accuracies = []
    for f in forecast:
        fc = f.get("forecast_next_week", 0)
        ci_low = f.get("confidence_interval_low", 0)
        ci_high = f.get("confidence_interval_high", 0)
        if fc > 0:
            ci_width_pct = ((ci_high - ci_low) / fc) * 100
            accuracy = max(0, 100 - ci_width_pct)
            accuracies.append(accuracy)
    forecast_accuracy = round(sum(accuracies) / len(accuracies), 1) if accuracies else 85.0

    # ── Stockout Probability ──
    stockout_products = []
    for i in inventory:
        stock = i.get("current_stock", 0)
        demand_7d = i.get("forecast_demand_7d", 0)
        daily_demand = demand_7d / 7 if demand_7d > 0 else 1
        days_coverage = stock / daily_demand if daily_demand > 0 else 999
        # Simple heuristic probability
        if days_coverage < 3:
            prob = 0.85
        elif days_coverage < 7:
            prob = 0.45
        elif days_coverage < 14:
            prob = 0.15
        else:
            prob = 0.05
        stockout_products.append({
            "product_id": i.get("product_id", ""),
            "product_name": i.get("product_name", ""),
            "probability": round(prob, 2),
            "days_coverage": round(days_coverage, 1),
        })

    avg_stockout_prob = round(
        sum(p["probability"] for p in stockout_products) / len(stockout_products), 2
    ) if stockout_products else 0.05

    # ── Supplier Reliability (based on MRP lead times) ──
    lead_times = []
    for prod in mrp:
        for mat in prod.get("materials", []):
            lt = mat.get("lead_time", 3)
            lead_times.append(lt)
    avg_lead_time = round(sum(lead_times) / len(lead_times), 1) if lead_times else 4.0
    # Reliability inversely related to lead time variability
    supplier_reliability = round(max(75, 100 - (avg_lead_time * 2.5)), 1)

    # ── Gross Margin ──
    total_revenue = sum(p.get("estimated_revenue", 0) for p in profitability)
    gross_margin = round(
        ((total_revenue - total_cogs) / total_revenue) * 100, 1
    ) if total_revenue > 0 else 0

    # ── Net Margin (gross margin minus estimated operational costs ~5%) ──
    operational_cost_pct = 5.0
    net_margin = round(gross_margin - operational_cost_pct, 1)

    # ── Product-level KPIs ──
    product_kpis = []
    for i in inventory:
        pid = i.get("product_id", "")
        prof = next((p for p in profitability if p.get("product_id") == pid), {})
        fc = next((f for f in forecast if f.get("product_id") == pid), {})
        sp = next((s for s in stockout_products if s.get("product_id") == pid), {})

        rev = prof.get("estimated_revenue", 0)
        cost = prof.get("estimated_cost", 0)
        p_margin = round(((rev - cost) / rev) * 100, 1) if rev > 0 else 0

        product_kpis.append({
            "product_id": pid,
            "product_name": i.get("product_name", ""),
            "service_level": 100.0 if i.get("status", "").lower() == "healthy" else 75.0,
            "stockout_probability": sp.get("probability", 0.05),
            "days_coverage": sp.get("days_coverage", 30),
            "margin_pct": p_margin,
            "trend_pct": fc.get("trend_pct", 0),
        })

    return {
        "service_level": service_level,
        "fill_rate": fill_rate,
        "inventory_turnover": inventory_turnover,
        "days_of_inventory": days_of_inventory,
        "forecast_accuracy": forecast_accuracy,
        "stockout_probability": avg_stockout_prob,
        "supplier_reliability": supplier_reliability,
        "gross_margin": gross_margin,
        "net_margin": net_margin,
        "avg_lead_time": avg_lead_time,
        "total_revenue": total_revenue,
        "total_cogs": total_cogs,
        "product_kpis": product_kpis,
        "stockout_products": stockout_products,
    }
