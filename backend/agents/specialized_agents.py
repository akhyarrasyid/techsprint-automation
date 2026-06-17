"""
Specialized Supply Chain Agents — Each agent handles a specific domain.
All agents follow the same interface: analyze(results, question) -> str
"""

from typing import Dict, Any


class ForecastAgent:
    """Analyzes demand forecasting data."""
    name = "Forecast Agent"

    def analyze(self, results: Dict[str, Any], question: str) -> str:
        forecast = results.get("forecast", [])
        if not forecast:
            return ""
        q = question.lower()
        if not any(w in q for w in ["forecast", "demand", "ramalan", "permintaan", "produksi", "target", "tren", "trend"]):
            return ""

        lines = [f"📊 **{self.name}**:"]
        total = sum(f.get("forecast_next_week", 0) for f in forecast)
        lines.append(f"- Total forecast demand minggu depan: **{total:,.0f} unit**")
        for f in forecast[:5]:
            trend_icon = "📈" if f.get("trend_pct", 0) > 0 else "📉"
            lines.append(
                f"- {f.get('product_name','?')}: **{f.get('forecast_next_week',0):,.0f}** unit "
                f"(trend {trend_icon} {f.get('trend_pct',0):.1f}%)"
            )
        return "\n".join(lines)


class InventoryAgent:
    """Analyzes inventory status and stockout risks."""
    name = "Inventory Agent"

    def analyze(self, results: Dict[str, Any], question: str) -> str:
        inventory = results.get("inventory", [])
        if not inventory:
            return ""
        q = question.lower()
        if not any(w in q for w in ["inventory", "stok", "stock", "restock", "safety", "rop", "reorder", "stockout", "gudang"]):
            return ""

        lines = [f"📦 **{self.name}**:"]
        critical = [i for i in inventory if i.get("status", "").lower() == "critical"]
        warning = [i for i in inventory if i.get("status", "").lower() in ("warning", "below rop")]

        if critical:
            lines.append(f"- ⚠️ **{len(critical)} produk CRITICAL** (stok di bawah safety stock):")
            for i in critical:
                lines.append(f"  - {i.get('product_name','?')}: stok={i.get('current_stock',0):,.0f}, SS={i.get('safety_stock',0):,.0f}, order **{i.get('recommended_order',0):,.0f}** unit")
        if warning:
            lines.append(f"- ⚡ **{len(warning)} produk WARNING** (di bawah ROP):")
            for i in warning:
                lines.append(f"  - {i.get('product_name','?')}: stok={i.get('current_stock',0):,.0f}, ROP={i.get('reorder_point',0):,.0f}")
        healthy = [i for i in inventory if i.get("status", "").lower() == "healthy"]
        if healthy:
            lines.append(f"- ✅ {len(healthy)} produk dalam status HEALTHY")
        return "\n".join(lines)


class MRPAgent:
    """Analyzes material requirements and shortages."""
    name = "MRP Agent"

    def analyze(self, results: Dict[str, Any], question: str) -> str:
        mrp = results.get("mrp", [])
        if not mrp:
            return ""
        q = question.lower()
        if not any(w in q for w in ["mrp", "material", "bahan", "shortage", "bom", "supplier", "po", "purchase", "order"]):
            return ""

        lines = [f"🏭 **{self.name}**:"]
        shortages = []
        for prod in mrp:
            for mat in prod.get("materials", []):
                if mat.get("shortage", 0) > 0:
                    shortages.append(mat)

        if shortages:
            lines.append(f"- 🔴 **{len(shortages)} material shortage** terdeteksi:")
            for mat in shortages[:5]:
                lines.append(
                    f"  - {mat.get('material_name','?')} ({mat.get('material_id','')}): "
                    f"shortage **{mat.get('shortage',0):,.0f} {mat.get('unit','')}**, "
                    f"supplier: {mat.get('supplier','?')}, lead time: {mat.get('lead_time',0)} hari"
                )
        else:
            lines.append("- ✅ Tidak ada material shortage saat ini")
        return "\n".join(lines)


class FinanceAgent:
    """Analyzes profitability and financial metrics."""
    name = "Finance Agent"

    def analyze(self, results: Dict[str, Any], question: str) -> str:
        profitability = results.get("profitability", [])
        summary = results.get("dashboard_summary", {})
        if not profitability and not summary:
            return ""
        q = question.lower()
        if not any(w in q for w in ["profit", "revenue", "margin", "cost", "keuangan", "laba", "rugi", "harga", "pendapatan", "untung"]):
            return ""

        lines = [f"💰 **{self.name}**:"]
        if summary:
            lines.append(f"- Revenue: **Rp {summary.get('expected_revenue',0):,.0f}**")
            lines.append(f"- Profit: **Rp {summary.get('expected_profit',0):,.0f}**")
            lines.append(f"- Margin: **{summary.get('profit_margin',0):.1f}%**")

        if profitability:
            sorted_p = sorted(profitability, key=lambda x: x.get("estimated_profit", 0), reverse=True)
            lines.append("- Top profitable products:")
            for p in sorted_p[:3]:
                rev = p.get("estimated_revenue", 0)
                prof = p.get("estimated_profit", 0)
                m = round((prof / rev) * 100, 1) if rev > 0 else 0
                lines.append(f"  - {p.get('product_name','?')}: profit **Rp {prof:,.0f}** (margin {m}%)")
        return "\n".join(lines)


class ExecutiveAgent:
    """Provides high-level executive summary."""
    name = "Executive Agent"

    def analyze(self, results: Dict[str, Any], question: str) -> str:
        q = question.lower()
        if not any(w in q for w in ["ringkasan", "summary", "overview", "eksekutif", "executive", "keseluruhan", "semua", "general"]):
            return ""

        summary = results.get("dashboard_summary", {})
        inventory = results.get("inventory", [])

        lines = [f"👔 **{self.name}**:"]
        if summary:
            lines.append(f"- Total demand minggu depan: **{summary.get('total_forecast_demand',0):,.0f}** unit")
            lines.append(f"- Revenue projection: **Rp {summary.get('expected_revenue',0):,.0f}**")
            lines.append(f"- Profit projection: **Rp {summary.get('expected_profit',0):,.0f}** (margin {summary.get('profit_margin',0):.1f}%)")
            lines.append(f"- Stockout risk: **{summary.get('stockout_risk_count',0)} produk**")
            lines.append(f"- PO needed: **{summary.get('purchase_orders_needed',0)}**")

        critical_count = sum(1 for i in inventory if i.get("status", "").lower() == "critical")
        if critical_count > 0:
            lines.append(f"- ⚠️ **{critical_count} produk dalam status kritis** — tindakan segera diperlukan")
        else:
            lines.append("- ✅ Semua stok dalam kondisi aman")
        return "\n".join(lines)
