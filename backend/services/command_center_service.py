"""
Command Center Service — Executive intelligence aggregation.
Combines KPIs, insights, anomalies, and recommendations.
"""

from typing import Dict, Any, List


def get_command_center_data(scenario: str = "Base") -> Dict[str, Any]:
    """Aggregate all executive intelligence for the command center."""
    from services.pipeline_store import PipelineStore
    from services.kpi_service import compute_kpis
    from services.insight_engine import generate_insights
    from services.anomaly_service import detect_anomalies

    results = PipelineStore.get_results(scenario)
    kpis = compute_kpis(scenario)
    anomaly_data = detect_anomalies(scenario)
    insights = generate_insights(
        results.get("forecast", []), results.get("inventory", []),
        results.get("mrp", []), results.get("profitability", []),
    )

    def _kpi_status(val, target):
        if val >= target: return "good"
        if val >= target * 0.85: return "warning"
        return "critical"

    global_kpis = [
        {"id": "service_level", "label": "Service Level", "value": kpis["service_level"], "unit": "%", "target": 95.0, "status": _kpi_status(kpis["service_level"], 95)},
        {"id": "fill_rate", "label": "Fill Rate", "value": kpis["fill_rate"], "unit": "%", "target": 97.0, "status": _kpi_status(kpis["fill_rate"], 97)},
        {"id": "gross_margin", "label": "Gross Margin", "value": kpis["gross_margin"], "unit": "%", "target": 30.0, "status": _kpi_status(kpis["gross_margin"], 30)},
        {"id": "forecast_accuracy", "label": "Forecast Accuracy", "value": kpis["forecast_accuracy"], "unit": "%", "target": 85.0, "status": _kpi_status(kpis["forecast_accuracy"], 85)},
        {"id": "inventory_turnover", "label": "Inventory Turnover", "value": kpis["inventory_turnover"], "unit": "x", "target": 8.0, "status": _kpi_status(kpis["inventory_turnover"], 8)},
        {"id": "supplier_reliability", "label": "Supplier Reliability", "value": kpis["supplier_reliability"], "unit": "%", "target": 90.0, "status": _kpi_status(kpis["supplier_reliability"], 90)},
    ]

    risk_items = [{"title": i["title"], "description": i["description"], "severity": i.get("severity", "medium"), "category": i.get("type", "warning")} for i in insights if i.get("type") in ("risk", "warning")]
    priority_actions = sorted([{"title": i["title"], "description": i["description"], "severity": i.get("severity", "medium"), "priority": 1 if i.get("severity") == "high" else 2} for i in insights if i.get("type") == "action"], key=lambda x: x["priority"])[:5]

    recs = []
    if kpis["service_level"] < 95:
        recs.append({"title": "Tingkatkan Service Level", "description": f"Service level {kpis['service_level']}% di bawah target 95%.", "impact": "high", "effort": "medium"})
    if kpis["gross_margin"] < 30:
        recs.append({"title": "Optimalkan Margin", "description": f"Gross margin {kpis['gross_margin']}% di bawah 30%.", "impact": "high", "effort": "high"})
    recs.append({"title": "Maintain Excellence", "description": "Lanjutkan monitoring KPI harian.", "impact": "medium", "effort": "low"})

    return {
        "global_kpis": global_kpis, "risk_map": risk_items, "priority_actions": priority_actions,
        "recommendations": recs, "anomaly_summary": anomaly_data["summary"],
        "financial_summary": {"total_revenue": kpis["total_revenue"], "total_cogs": kpis["total_cogs"], "gross_margin": kpis["gross_margin"], "net_margin": kpis["net_margin"]},
        "insights_count": len(insights), "anomalies_count": anomaly_data["summary"]["total_anomalies"],
    }
