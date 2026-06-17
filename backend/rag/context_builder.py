"""
Context Builder — Constructs rich augmented context from live pipeline data.
Extracted from copilot_service._build_live_context for modularity & reuse.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger("copilot")


def build_live_context(scenario: str = "Base") -> str:
    """Build live business data context from PipelineStore."""
    try:
        from services.pipeline_store import PipelineStore
        results = PipelineStore.get_results(scenario)
        return _format_pipeline_results(results)
    except Exception as e:
        logger.warning(f"Failed to build live context: {e}")
        return "Data bisnis belum tersedia (pipeline error)."


def _format_pipeline_results(results: Dict[str, Any]) -> str:
    """Format pipeline results into structured text context."""
    parts: List[str] = []

    # Forecast summary
    forecast = results.get("forecast", [])
    if forecast:
        fc_lines = []
        for f in forecast[:5]:
            fc_lines.append(
                f"  - {f.get('product_name','?')}: forecast={f.get('forecast_next_week',0):,.0f} unit, "
                f"trend={f.get('trend_pct',0):.1f}%, "
                f"CI=[{f.get('confidence_interval_low',0):,.0f}-{f.get('confidence_interval_high',0):,.0f}]"
            )
        parts.append("Forecast:\n" + "\n".join(fc_lines))

    # Inventory summary
    inventory = results.get("inventory", [])
    if inventory:
        inv_lines = []
        for i in inventory[:5]:
            inv_lines.append(
                f"  - {i.get('product_name','?')}: stock={i.get('current_stock',0):,.0f}, "
                f"SS={i.get('safety_stock',0):,.0f}, ROP={i.get('reorder_point',0):,.0f}, "
                f"status={i.get('status','?')}, recommended_order={i.get('recommended_order',0):,.0f}"
            )
        parts.append("Inventory:\n" + "\n".join(inv_lines))

    # MRP summary
    mrp = results.get("mrp", [])
    if mrp:
        shortages = []
        for prod in mrp[:5]:
            for mat in prod.get("materials", []):
                if mat.get("shortage", 0) > 0:
                    shortages.append(
                        f"  - {mat.get('material_name','?')} ({mat.get('material_id','')}): "
                        f"shortage={mat.get('shortage',0):,.0f} {mat.get('unit','')}, "
                        f"supplier={mat.get('supplier','?')}, lead_time={mat.get('lead_time',0)} hari"
                    )
        if shortages:
            parts.append("MRP Shortages:\n" + "\n".join(shortages))

    # Profitability summary
    profitability = results.get("profitability", [])
    if profitability:
        prof_lines = []
        total_rev = sum(p.get("estimated_revenue", 0) for p in profitability)
        total_prof = sum(p.get("estimated_profit", 0) for p in profitability)
        margin = round((total_prof / total_rev) * 100, 1) if total_rev > 0 else 0
        prof_lines.append(f"  - Total Revenue: Rp {total_rev:,.0f}")
        prof_lines.append(f"  - Total Profit: Rp {total_prof:,.0f}")
        prof_lines.append(f"  - Overall Margin: {margin}%")
        for p in profitability[:5]:
            rev = p.get("estimated_revenue", 0)
            prof = p.get("estimated_profit", 0)
            m = round((prof / rev) * 100, 1) if rev > 0 else 0
            prof_lines.append(
                f"  - {p.get('product_name','?')}: revenue=Rp {rev:,.0f}, profit=Rp {prof:,.0f}, margin={m}%"
            )
        parts.append("Profitability:\n" + "\n".join(prof_lines))

    # Dashboard summary
    summary = results.get("dashboard_summary", {})
    if summary:
        parts.append(
            f"Dashboard Summary:\n"
            f"  - Total Forecast Demand: {summary.get('total_forecast_demand',0):,.0f} unit\n"
            f"  - Expected Revenue: Rp {summary.get('expected_revenue',0):,.0f}\n"
            f"  - Expected Profit: Rp {summary.get('expected_profit',0):,.0f}\n"
            f"  - Profit Margin: {summary.get('profit_margin',0):.1f}%\n"
            f"  - Stockout Risk Count: {summary.get('stockout_risk_count',0)}\n"
            f"  - Purchase Orders Needed: {summary.get('purchase_orders_needed',0)}"
        )

    return "\n\n".join(parts) if parts else "Data bisnis belum tersedia."
