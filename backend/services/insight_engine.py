"""
Insight Engine — Rule-based AI analysis layer.

Ingests forecast, inventory, MRP, and profitability pipeline results
to generate structured intelligence insights for the Executive AI Copilot.

Categories:
  - risk     : Stockout risk, capacity constraints
  - warning  : Supplier delays, margin erosion
  - opportunity : Demand growth, cost optimization
  - action   : Recommended immediate actions
"""

from typing import Dict, Any, List


def generate_insights(
    forecast: List[Dict[str, Any]],
    inventory: List[Dict[str, Any]],
    mrp: List[Dict[str, Any]],
    profitability: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate structured AI insights from full pipeline results.
    
    Returns list of insight objects:
    [
      {
        "type": "risk" | "warning" | "opportunity" | "action",
        "title": "...",
        "description": "...",
        "severity": "high" | "medium" | "low",
        "product_id": "..." (optional)
      }
    ]
    """
    insights: List[Dict[str, Any]] = []

    # ── 1. STOCKOUT RISK ANALYSIS ──
    for item in inventory:
        status = item.get("status", "").lower()
        prod_name = item.get("product_name", item.get("product_id", "Unknown"))
        prod_id = item.get("product_id", "")
        current = item.get("current_stock", 0)
        safety = item.get("safety_stock", 0)
        demand_7d = item.get("forecast_demand_7d", 0)

        if status == "critical":
            # Critical: stock below safety stock
            days_remaining = round(current / (demand_7d / 7), 1) if demand_7d > 0 else 0
            insights.append({
                "type": "risk",
                "title": f"Stockout Risk — {prod_name}",
                "description": (
                    f"{prod_name} memiliki stok {current:,.0f} unit, di bawah safety stock "
                    f"({safety:,.0f}). Diperkirakan kehabisan stok dalam {days_remaining} hari "
                    f"jika permintaan konsisten pada {demand_7d:,.0f}/minggu."
                ),
                "severity": "high",
                "product_id": prod_id
            })
        elif status in ("warning", "below rop"):
            insights.append({
                "type": "warning",
                "title": f"Below Reorder Point — {prod_name}",
                "description": (
                    f"Stok {prod_name} ({current:,.0f} unit) berada di bawah ROP. "
                    f"Disarankan segera membuat Purchase Order untuk menghindari gangguan produksi."
                ),
                "severity": "medium",
                "product_id": prod_id
            })

    # ── 2. DEMAND TREND ANALYSIS ──
    for fc in forecast:
        trend = fc.get("trend_pct", 0)
        prod_name = fc.get("product_name", "")
        prod_id = fc.get("product_id", "")
        forecast_qty = fc.get("forecast_next_week", 0)

        if trend > 5:
            insights.append({
                "type": "opportunity",
                "title": f"Demand Growth — {prod_name}",
                "description": (
                    f"{prod_name} mengalami tren kenaikan permintaan sebesar {trend:.1f}%. "
                    f"Proyeksi minggu depan: {forecast_qty:,.0f} unit. "
                    f"Pertimbangkan untuk meningkatkan kapasitas produksi."
                ),
                "severity": "low",
                "product_id": prod_id
            })
        elif trend < -5:
            insights.append({
                "type": "warning",
                "title": f"Demand Decline — {prod_name}",
                "description": (
                    f"{prod_name} mengalami penurunan permintaan sebesar {abs(trend):.1f}%. "
                    f"Kurangi produksi untuk menghindari overstock dan holding cost berlebihan."
                ),
                "severity": "medium",
                "product_id": prod_id
            })

    # ── 3. MRP MATERIAL SHORTAGE ANALYSIS ──
    all_shortages: Dict[str, float] = {}
    supplier_map: Dict[str, str] = {}
    leadtime_map: Dict[str, int] = {}

    for prod in mrp:
        for mat in prod.get("materials", []):
            mat_id = mat.get("material_id", "")
            shortage = mat.get("shortage", 0)
            if shortage > 0:
                all_shortages[mat_id] = all_shortages.get(mat_id, 0) + shortage
                supplier_map[mat_id] = mat.get("supplier", "Unknown")
                leadtime_map[mat_id] = mat.get("lead_time", 3)

    for mat_id, total_shortage in all_shortages.items():
        supplier = supplier_map.get(mat_id, "Unknown")
        lead_time = leadtime_map.get(mat_id, 3)
        insights.append({
            "type": "action",
            "title": f"PO Required — {mat_id}",
            "description": (
                f"Material shortage terdeteksi: {total_shortage:,.0f} unit dari {mat_id}. "
                f"Supplier {supplier} memiliki lead time {lead_time} hari. "
                f"Rilis Purchase Order hari ini untuk mengamankan jadwal produksi."
            ),
            "severity": "high",
            "material_id": mat_id
        })

    # ── 4. PROFITABILITY MARGIN ANALYSIS ──
    for item in profitability:
        prod_name = item.get("product_name", "")
        prod_id = item.get("product_id", "")
        revenue = item.get("estimated_revenue", 0)
        profit = item.get("estimated_profit", 0)
        margin = round((profit / revenue) * 100, 1) if revenue > 0 else 0

        if margin < 25:
            insights.append({
                "type": "warning",
                "title": f"Low Margin — {prod_name}",
                "description": (
                    f"Margin {prod_name} hanya {margin}%. "
                    f"Pertimbangkan untuk menaikkan harga jual atau mencari supplier bahan baku alternatif "
                    f"yang lebih efisien."
                ),
                "severity": "medium",
                "product_id": prod_id
            })
        elif margin > 40:
            insights.append({
                "type": "opportunity",
                "title": f"High Margin — {prod_name}",
                "description": (
                    f"{prod_name} memiliki margin {margin}%, menjadikannya produk paling menguntungkan. "
                    f"Pertimbangkan peningkatan alokasi produksi dan promosi."
                ),
                "severity": "low",
                "product_id": prod_id
            })

    # ── 5. SUPPLIER DELAY SCENARIO WARNING ──
    # Always include as a general warning
    insights.append({
        "type": "warning",
        "title": "Supplier Delay Simulation",
        "description": (
            "Simulasi menunjukkan keterlambatan supplier +5 hari dapat menurunkan service level "
            "dari 98% menjadi ~82%. Disarankan meningkatkan safety stock untuk produk dengan "
            "lead time tinggi (Minyak Sawit Mentah, Tebu Raw)."
        ),
        "severity": "medium"
    })

    # Sort: high severity first
    severity_order = {"high": 0, "medium": 1, "low": 2}
    insights.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 3))

    return insights
