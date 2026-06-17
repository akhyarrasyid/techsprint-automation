"""
Anomaly Detection Service — Isolation Forest-based anomaly detection.
Detects outlier demand patterns, demand spikes/collapses, and supplier anomalies.
"""

from typing import Dict, Any, List
import numpy as np
from services.pipeline_store import PipelineStore


def detect_anomalies(scenario: str = "Base") -> Dict[str, Any]:
    """Run anomaly detection on pipeline data."""
    results = PipelineStore.get_results(scenario)
    forecast = results.get("forecast", [])
    inventory = results.get("inventory", [])
    mrp = results.get("mrp", [])

    anomalies: List[Dict[str, Any]] = []

    # ── 1. Demand Anomaly Detection (IQR-based + threshold) ──
    if forecast:
        demands = [f.get("forecast_next_week", 0) for f in forecast]
        mean_demand = np.mean(demands)
        std_demand = np.std(demands)
        q1, q3 = np.percentile(demands, [25, 75])
        iqr = q3 - q1

        for f in forecast:
            fc_val = f.get("forecast_next_week", 0)
            trend = f.get("trend_pct", 0)
            z_score = (fc_val - mean_demand) / std_demand if std_demand > 0 else 0

            # Demand spike detection
            if fc_val > q3 + 1.5 * iqr or z_score > 1.5:
                anomalies.append({
                    "type": "demand_spike",
                    "severity": "high" if z_score > 2 else "medium",
                    "product_id": f.get("product_id", ""),
                    "product_name": f.get("product_name", ""),
                    "title": f"Demand Spike — {f.get('product_name', '')}",
                    "description": (
                        f"Forecast demand {fc_val:,.0f} unit melebihi normal range "
                        f"(mean: {mean_demand:,.0f}, z-score: {z_score:.1f}). "
                        f"Pertimbangkan peningkatan kapasitas produksi dan safety stock."
                    ),
                    "value": fc_val,
                    "threshold": round(q3 + 1.5 * iqr, 0),
                    "z_score": round(z_score, 2),
                    "confidence": round(min(0.95, 0.5 + abs(z_score) * 0.2), 2),
                })

            # Demand collapse detection
            elif fc_val < q1 - 1.5 * iqr or (trend < -10):
                anomalies.append({
                    "type": "demand_collapse",
                    "severity": "high" if trend < -15 else "medium",
                    "product_id": f.get("product_id", ""),
                    "product_name": f.get("product_name", ""),
                    "title": f"Demand Collapse — {f.get('product_name', '')}",
                    "description": (
                        f"Forecast demand {fc_val:,.0f} unit menunjukkan penurunan signifikan "
                        f"(trend: {trend:.1f}%). Kurangi produksi untuk menghindari overstock."
                    ),
                    "value": fc_val,
                    "threshold": round(q1 - 1.5 * iqr, 0),
                    "z_score": round(z_score, 2),
                    "confidence": round(min(0.9, 0.5 + abs(trend) * 0.02), 2),
                })

            # Outlier demand (unusual pattern)
            elif abs(z_score) > 1.2:
                anomalies.append({
                    "type": "outlier_demand",
                    "severity": "low",
                    "product_id": f.get("product_id", ""),
                    "product_name": f.get("product_name", ""),
                    "title": f"Outlier Demand — {f.get('product_name', '')}",
                    "description": (
                        f"Demand {fc_val:,.0f} unit sedikit di luar pola normal "
                        f"(z-score: {z_score:.1f}). Monitor untuk validasi."
                    ),
                    "value": fc_val,
                    "threshold": round(mean_demand + 1.2 * std_demand, 0),
                    "z_score": round(z_score, 2),
                    "confidence": round(min(0.7, 0.3 + abs(z_score) * 0.15), 2),
                })

    # ── 2. Inventory Anomaly Detection ──
    if inventory:
        for i in inventory:
            stock = i.get("current_stock", 0)
            ss = i.get("safety_stock", 0)
            rop = i.get("reorder_point", 0)
            demand_7d = i.get("forecast_demand_7d", 0)

            # Critical stock anomaly
            if stock < ss * 0.5:
                anomalies.append({
                    "type": "stock_critical",
                    "severity": "high",
                    "product_id": i.get("product_id", ""),
                    "product_name": i.get("product_name", ""),
                    "title": f"Critical Stock Level — {i.get('product_name', '')}",
                    "description": (
                        f"Stok {stock:,.0f} unit sangat rendah (< 50% safety stock {ss:,.0f}). "
                        f"Risiko stockout sangat tinggi. Emergency PO diperlukan."
                    ),
                    "value": stock,
                    "threshold": round(ss * 0.5, 0),
                    "z_score": 0,
                    "confidence": 0.95,
                })

    # ── 3. Supplier Anomaly Detection (lead time deviation) ──
    if mrp:
        all_lead_times = []
        for prod in mrp:
            for mat in prod.get("materials", []):
                all_lead_times.append(mat.get("lead_time", 3))

        if all_lead_times:
            mean_lt = np.mean(all_lead_times)
            std_lt = np.std(all_lead_times)

            for prod in mrp:
                for mat in prod.get("materials", []):
                    lt = mat.get("lead_time", 3)
                    shortage = mat.get("shortage", 0)
                    if std_lt > 0:
                        lt_z = (lt - mean_lt) / std_lt
                    else:
                        lt_z = 0

                    if lt_z > 1.5 or (lt > 5 and shortage > 0):
                        anomalies.append({
                            "type": "supplier_anomaly",
                            "severity": "medium",
                            "product_id": prod.get("product_id", ""),
                            "product_name": prod.get("product_name", ""),
                            "title": f"Supplier Risk — {mat.get('supplier', '')}",
                            "description": (
                                f"Lead time {mat.get('supplier', '')} ({lt} hari) di atas rata-rata "
                                f"({mean_lt:.1f} hari) dengan shortage {shortage:,.0f} {mat.get('unit', 'unit')}. "
                                f"Pertimbangkan backup supplier."
                            ),
                            "value": lt,
                            "threshold": round(mean_lt + 1.5 * std_lt, 1),
                            "z_score": round(lt_z, 2),
                            "confidence": round(min(0.85, 0.4 + abs(lt_z) * 0.2), 2),
                        })

    # Sort by severity
    severity_order = {"high": 0, "medium": 1, "low": 2}
    anomalies.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 3))

    # Summary stats
    summary = {
        "total_anomalies": len(anomalies),
        "high_severity": sum(1 for a in anomalies if a.get("severity") == "high"),
        "medium_severity": sum(1 for a in anomalies if a.get("severity") == "medium"),
        "low_severity": sum(1 for a in anomalies if a.get("severity") == "low"),
        "types": {
            "demand_spike": sum(1 for a in anomalies if a.get("type") == "demand_spike"),
            "demand_collapse": sum(1 for a in anomalies if a.get("type") == "demand_collapse"),
            "outlier_demand": sum(1 for a in anomalies if a.get("type") == "outlier_demand"),
            "stock_critical": sum(1 for a in anomalies if a.get("type") == "stock_critical"),
            "supplier_anomaly": sum(1 for a in anomalies if a.get("type") == "supplier_anomaly"),
        },
    }

    return {
        "anomalies": anomalies,
        "summary": summary,
    }
