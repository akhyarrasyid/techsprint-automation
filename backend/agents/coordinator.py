"""
Supply Chain Coordinator — Multi-Agent Orchestrator.

Flow:
  Question → Coordinator → dispatch to relevant agents → merge results → final answer
"""

from typing import Dict, Any, List
from agents.specialized_agents import (
    ForecastAgent,
    InventoryAgent,
    MRPAgent,
    FinanceAgent,
    ExecutiveAgent,
)


class SupplyChainCoordinator:
    """Orchestrates specialized agents based on question context."""

    def __init__(self):
        self.agents = [
            ExecutiveAgent(),
            ForecastAgent(),
            InventoryAgent(),
            MRPAgent(),
            FinanceAgent(),
        ]

    def coordinate(self, results: Dict[str, Any], question: str) -> str:
        """
        Dispatch question to all agents, collect non-empty responses, merge.
        """
        agent_outputs: List[str] = []

        for agent in self.agents:
            try:
                output = agent.analyze(results, question)
                if output and output.strip():
                    agent_outputs.append(output)
            except Exception:
                continue

        if not agent_outputs:
            # If no agent matched, run all with forced output
            return self._force_all(results)

        return "\n\n".join(agent_outputs)

    def _force_all(self, results: Dict[str, Any]) -> str:
        """Force all agents to provide a brief summary when no keyword match."""
        summary = results.get("dashboard_summary", {})
        if summary:
            return (
                f"📋 **Ringkasan Bisnis:**\n"
                f"- Demand: {summary.get('total_forecast_demand',0):,.0f} unit\n"
                f"- Revenue: Rp {summary.get('expected_revenue',0):,.0f}\n"
                f"- Profit: Rp {summary.get('expected_profit',0):,.0f}\n"
                f"- Margin: {summary.get('profit_margin',0):.1f}%\n"
                f"- Stockout Risk: {summary.get('stockout_risk_count',0)} produk\n\n"
                f"_Tanyakan lebih spesifik tentang forecast, inventory, MRP, profitability, atau supplier._"
            )
        return "Data belum tersedia. Silakan upload CSV terlebih dahulu."

    def get_agent_context(self, results: Dict[str, Any], question: str) -> str:
        """
        Get multi-agent analysis as additional context for the RAG copilot.
        Used to augment the LLM prompt with structured agent analysis.
        """
        output = self.coordinate(results, question)
        if output:
            return f"\n\nMulti-Agent Analysis:\n{output}"
        return ""


# Singleton coordinator
coordinator = SupplyChainCoordinator()
