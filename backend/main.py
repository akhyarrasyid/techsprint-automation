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
    upload_router,
    kpi_router,
    anomaly_router,
    command_center_router,
)
from services.pipeline_store import PipelineStore

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Check if pre-computed result files are present; warn if not
    import os as _os
    dataset_dir = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "dataset")
    required = ["forecast_result.csv", "inventory_result.csv", "mrp_result.csv",
                "profitability_result.csv", "kpi_result.csv", "insights.json"]
    missing = [f for f in required if not _os.path.exists(_os.path.join(dataset_dir, f))]
    if missing:
        print(f"[WARN] Pipeline not yet run. Missing: {missing}. Upload data to generate.")
    else:
        try:
            PipelineStore.get_results("Base")
            print("[OK] Pipeline store initialized with dataset-driven results.")
        except Exception as e:
            print(f"[WARN] Pipeline store init failed: {e}")
    yield
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

# Health endpoint
@app.get("/health", tags=["Health"])
async def get_health():
    env = os.getenv("ENVIRONMENT", "development")
    return {
        "status": "ok",
        "pipeline": "ready",
        "environment": env,
        "model": "kopikita-pipeline-v1"
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
app.include_router(upload_router.router)
app.include_router(kpi_router.router)
app.include_router(anomaly_router.router)
app.include_router(command_center_router.router)

if __name__ == "__main__":
    import uvicorn
    # Port 7860 for Hugging Face Spaces compatibility
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
