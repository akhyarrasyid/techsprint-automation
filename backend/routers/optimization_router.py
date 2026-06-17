"""
Optimization Router — GET /optimization
Linear programming to maximize profit under constraints.
Uses PuLP solver.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(tags=["Optimization"])


class RecommendedOrder(BaseModel):
    product_id: str
    product_name: str
    order_qty: float
    unit_cost: float
    total_cost: float
    expected_revenue: float
    expected_profit: float


class OptimizationResponse(BaseModel):
    status: str
    recommended_orders: List[RecommendedOrder]
    total_cost: float
    expected_profit: float
    expected_revenue: float
    warehouse_utilization_pct: float
    budget_utilization_pct: float


@router.get("/optimization", response_model=OptimizationResponse)
async def optimize(
    budget: float = 100_000_000,
    warehouse_capacity: int = 10000,
):
    """
    Optimize procurement orders to maximize profit under budget and warehouse constraints.
    """
    try:
        import pulp
        from services.pipeline_store import PipelineStore
        results = PipelineStore.get_results("Base")

        inventory = results.get("inventory", [])
        profitability = results.get("profitability", [])
        forecast = results.get("forecast", [])

        if not inventory or not profitability:
            raise HTTPException(status_code=400, detail="Pipeline data not available.")

        # Build maps
        inv_map = {i["product_id"]: i for i in inventory}
        prof_map = {p["product_id"]: p for p in profitability}
        fc_map = {f["product_id"]: f for f in forecast}

        product_ids = list(inv_map.keys())

        # Define LP problem
        prob = pulp.LpProblem("MaximizeProfit", pulp.LpMaximize)

        # Decision variables: order quantity per product
        order_vars = {}
        for pid in product_ids:
            inv = inv_map[pid]
            max_order = inv.get("recommended_order", 0) * 2  # Allow up to 2x recommended
            max_order = max(max_order, 500)  # At least 500 units
            order_vars[pid] = pulp.LpVariable(f"order_{pid}", lowBound=0, upBound=max_order, cat="Continuous")

        # Objective: maximize total profit
        profit_coeffs = {}
        cost_coeffs = {}
        for pid in product_ids:
            prof = prof_map.get(pid, {})
            inv = inv_map.get(pid, {})
            fc = fc_map.get(pid, {})

            selling_price = prof.get("selling_price", 15000)
            unit_cost = prof.get("unit_cost", 10000)
            profit_per_unit = selling_price - unit_cost

            profit_coeffs[pid] = profit_per_unit
            cost_coeffs[pid] = unit_cost

        prob += pulp.lpSum([profit_coeffs[pid] * order_vars[pid] for pid in product_ids]), "TotalProfit"

        # Constraint 1: Budget
        prob += pulp.lpSum([cost_coeffs[pid] * order_vars[pid] for pid in product_ids]) <= budget, "BudgetLimit"

        # Constraint 2: Warehouse capacity
        prob += pulp.lpSum([order_vars[pid] for pid in product_ids]) <= warehouse_capacity, "WarehouseCapacity"

        # Constraint 3: MOQ per product (minimum 50 units if ordering)
        # (Simplified: just set lower bound which is already 0)

        # Solve
        prob.solve(pulp.PULP_CBC_CMD(msg=0))

        if prob.status != pulp.constants.LpStatusOptimal:
            return OptimizationResponse(
                status="infeasible",
                recommended_orders=[],
                total_cost=0,
                expected_profit=0,
                expected_revenue=0,
                warehouse_utilization_pct=0,
                budget_utilization_pct=0,
            )

        # Extract results
        recommended_orders = []
        total_cost = 0
        total_revenue = 0
        total_profit = 0
        total_units = 0

        for pid in product_ids:
            qty = order_vars[pid].varValue or 0
            if qty > 0:
                uc = cost_coeffs[pid]
                sp = prof_map.get(pid, {}).get("selling_price", 15000)
                tc = qty * uc
                er = qty * sp
                ep = qty * (sp - uc)

                recommended_orders.append(RecommendedOrder(
                    product_id=pid,
                    product_name=inv_map[pid].get("product_name", pid),
                    order_qty=round(qty, 0),
                    unit_cost=uc,
                    total_cost=round(tc, 0),
                    expected_revenue=round(er, 0),
                    expected_profit=round(ep, 0),
                ))
                total_cost += tc
                total_revenue += er
                total_profit += ep
                total_units += qty

        return OptimizationResponse(
            status="optimal",
            recommended_orders=recommended_orders,
            total_cost=round(total_cost),
            expected_profit=round(total_profit),
            expected_revenue=round(total_revenue),
            warehouse_utilization_pct=round((total_units / warehouse_capacity) * 100, 1) if warehouse_capacity > 0 else 0,
            budget_utilization_pct=round((total_cost / budget) * 100, 1) if budget > 0 else 0,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
