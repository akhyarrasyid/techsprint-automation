"""
Digital Twin Router — POST /digital-twin/simulate
Monte Carlo simulation for supply chain what-if analysis.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin"])


class SimulationRequest(BaseModel):
    supplier_delay: int = 0          # Additional days
    demand_change_pct: float = 0.0   # e.g. +20 or -10
    stock_reduction_pct: float = 0.0 # e.g. 10 = reduce stock by 10%
    num_runs: int = 1000             # Monte Carlo iterations


class ProductSimResult(BaseModel):
    product_id: str
    product_name: str
    p_stockout: float       # Probability of stockout [0-1]
    avg_days_of_coverage: float
    avg_service_level: float
    min_service_level: float
    stockout_runs: int


class SimulationResponse(BaseModel):
    products: List[ProductSimResult]
    overall_service_level: float
    overall_stockout_count: int
    profit_impact: float
    revenue_impact: float
    holding_cost_impact: float
    num_runs: int


@router.post("/simulate", response_model=SimulationResponse)
async def simulate(req: SimulationRequest):
    """
    Run Monte Carlo simulation to estimate stockout probability and KPI impacts.
    """
    try:
        from services.pipeline_store import PipelineStore
        results = PipelineStore.get_results("Base")

        forecast = results.get("forecast", [])
        inventory = results.get("inventory", [])
        profitability = results.get("profitability", [])

        if not forecast or not inventory:
            raise HTTPException(status_code=400, detail="Pipeline data not available.")

        # Build lookup maps
        inv_map = {i["product_id"]: i for i in inventory}
        prof_map = {p["product_id"]: p for p in profitability}

        product_results: List[ProductSimResult] = []
        total_profit_delta = 0.0
        total_revenue_delta = 0.0
        total_holding_delta = 0.0

        for fc in forecast:
            pid = fc["product_id"]
            pname = fc.get("product_name", pid)
            inv = inv_map.get(pid, {})
            prof = prof_map.get(pid, {})

            # Base parameters
            base_demand_daily = fc.get("forecast_next_week", 700) / 7.0
            base_stock = inv.get("current_stock", 1000)
            base_lead_time = 4  # default
            safety_stock = inv.get("safety_stock", 200)
            selling_price = prof.get("selling_price", 15000)
            unit_cost = prof.get("unit_cost", 10000)

            # Apply user adjustments
            demand_multiplier = 1.0 + (req.demand_change_pct / 100.0)
            adjusted_lead_time = base_lead_time + req.supplier_delay
            adjusted_stock = base_stock * (1.0 - req.stock_reduction_pct / 100.0)

            # Monte Carlo
            stockout_count = 0
            service_levels = []
            days_coverages = []

            for _ in range(req.num_runs):
                # Random daily demand ~ Normal(mean, std=15% of mean)
                sim_demand = np.random.normal(
                    base_demand_daily * demand_multiplier,
                    base_demand_daily * 0.15
                )
                sim_demand = max(10, sim_demand)

                # Random lead time ~ Uniform(lt-1, lt+2)
                sim_lt = np.random.uniform(
                    max(1, adjusted_lead_time - 1),
                    adjusted_lead_time + 2
                )

                # Days of coverage
                doc = adjusted_stock / sim_demand if sim_demand > 0 else 999
                days_coverages.append(doc)

                # Stockout if coverage < lead time
                if doc < sim_lt:
                    stockout_count += 1
                    # Service level = fraction fulfilled
                    fulfilled = adjusted_stock / (sim_demand * sim_lt) if sim_demand * sim_lt > 0 else 0
                    service_levels.append(min(1.0, max(0, fulfilled)))
                else:
                    service_levels.append(1.0)

            p_stockout = stockout_count / req.num_runs
            avg_sl = float(np.mean(service_levels)) * 100
            min_sl = float(np.min(service_levels)) * 100

            product_results.append(ProductSimResult(
                product_id=pid,
                product_name=pname,
                p_stockout=round(p_stockout, 4),
                avg_days_of_coverage=round(float(np.mean(days_coverages)), 1),
                avg_service_level=round(avg_sl, 1),
                min_service_level=round(min_sl, 1),
                stockout_runs=stockout_count,
            ))

            # Financial impact
            lost_sales_pct = p_stockout * 0.3  # Assume 30% of stockout = lost sales
            rev = prof.get("estimated_revenue", 0)
            prf = prof.get("estimated_profit", 0)
            total_revenue_delta -= rev * lost_sales_pct
            total_profit_delta -= prf * lost_sales_pct
            # Holding cost: higher stock for longer lead time
            if req.supplier_delay > 0:
                extra_holding = safety_stock * unit_cost * 0.15 / 365 * req.supplier_delay
                total_holding_delta += extra_holding

        overall_sl = float(np.mean([p.avg_service_level for p in product_results])) if product_results else 98.0
        overall_stockout = sum(1 for p in product_results if p.p_stockout > 0.05)

        return SimulationResponse(
            products=product_results,
            overall_service_level=round(overall_sl, 1),
            overall_stockout_count=overall_stockout,
            profit_impact=round(total_profit_delta),
            revenue_impact=round(total_revenue_delta),
            holding_cost_impact=round(total_holding_delta),
            num_runs=req.num_runs,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
