from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routers import (
    dashboard_router,
    forecast_router,
    inventory_router,
    mrp_router,
    profitability_router,
    insights_router,
    explainability_router,
    copilot_router,
    digital_twin_router,
    optimization_router,
    kpi_router,
    anomaly_router,
    command_center_router,
)
from services.pipeline_store import PipelineStore

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up store cache with mock/deterministic data on startup
    try:
        PipelineStore.get_results("Base")
        print("Pipeline store initialized successfully with base mock data.")
    except Exception as e:
        print(f"Failed to initialize pipeline store on startup: {e}")
    yield
    # Shutdown actions
    PipelineStore.clear_cache()
    print("Pipeline cache cleared.")

app = FastAPI(
    title="Business Planning Automation System API",
    description="TechSprint Data Automation Track backend.",
    version="3.0.0",
    lifespan=lifespan
)

# CORS middleware config
# Using wildcard allow_origins to ensure Vercel and Hugging Face space connection is seamless
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint (as specified in architectural decisions)
@app.get("/health", tags=["Health"])
async def get_health():
    active_model = os.getenv("MODEL_NAME", "mock")
    env = os.getenv("ENVIRONMENT", "development")
    return {
        "status": "ok",
        "pipeline": "ready",
        "environment": env,
        "model": active_model
    }

# Register routers at root level for flat endpoint layout
app.include_router(dashboard_router.router)
app.include_router(forecast_router.router)
app.include_router(inventory_router.router)
app.include_router(mrp_router.router)
app.include_router(profitability_router.router)
app.include_router(insights_router.router)
app.include_router(explainability_router.router)
app.include_router(copilot_router.router)
app.include_router(digital_twin_router.router)
app.include_router(optimization_router.router)
# Phase 13-25 routers
app.include_router(kpi_router.router)
app.include_router(anomaly_router.router)
app.include_router(command_center_router.router)

if __name__ == "__main__":
    import uvicorn
    # Port 7860 for Hugging Face Spaces compatibility
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
