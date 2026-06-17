"""
Upload Router — POST /upload, GET /pipeline-status

Accepts a CSV file, saves it to the dataset directory, runs the Kopikita
pipeline (generate_results.py via pipeline_runner.py), clears the pipeline
cache, and returns a real summary of what was generated.
"""

import os
import sys
import time
import subprocess
import json
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from services.pipeline_store import PipelineStore

router = APIRouter(tags=["Upload"])

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BACKEND_DIR, "dataset")
RUNNER_PATH = os.path.join(BACKEND_DIR, "notebooks", "pipeline_runner.py")

RESULT_FILES = [
    "forecast_result.csv",
    "inventory_result.csv",
    "mrp_result.csv",
    "profitability_result.csv",
    "kpi_result.csv",
    "insights.json",
]


@router.get("/pipeline-status")
async def get_pipeline_status():
    """Returns pipeline readiness and file presence for each output."""
    files_status = {}
    for fname in RESULT_FILES:
        path = os.path.join(DATASET_DIR, fname)
        if os.path.exists(path):
            mtime = os.path.getmtime(path)
            files_status[fname] = {
                "exists": True,
                "last_modified": datetime.fromtimestamp(mtime).isoformat(),
            }
        else:
            files_status[fname] = {"exists": False, "last_modified": None}

    ready = all(v["exists"] for v in files_status.values())
    last_run = None
    if ready:
        mtimes = [v["last_modified"] for v in files_status.values() if v["last_modified"]]
        last_run = max(mtimes) if mtimes else None

    return {"ready": ready, "last_run": last_run, "files": files_status}


@router.post("/upload")
async def upload_and_run_pipeline(file: UploadFile = File(...)):
    """
    Accept a CSV sales history file, save it, run the pipeline, return summary.
    """
    # Validate file type
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=422, detail="Only .csv files are accepted.")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50 MB limit
        raise HTTPException(status_code=422, detail="File exceeds 50 MB limit.")

    # Save file with canonical dataset name if it looks like sales history
    fname = file.filename
    if "sales" in fname.lower() or "history" in fname.lower():
        save_name = "sales_history (Competitors).csv"
    else:
        save_name = fname

    save_path = os.path.join(DATASET_DIR, save_name)
    with open(save_path, "wb") as f:
        f.write(content)

    # Read basic stats from uploaded CSV
    try:
        df_uploaded = pd.read_csv(save_path)
        row_count = len(df_uploaded)
        date_col = next((c for c in df_uploaded.columns if "date" in c.lower() or "time" in c.lower()), None)
        date_range = None
        if date_col:
            dates = pd.to_datetime(df_uploaded[date_col], errors="coerce").dropna()
            if len(dates):
                date_range = f"{dates.min().date()} — {dates.max().date()}"
    except Exception:
        row_count = 0
        date_range = None

    # Run pipeline as subprocess (synchronous — waits for completion)
    t0 = time.time()
    result = subprocess.run(
        [sys.executable, RUNNER_PATH],
        capture_output=True,
        text=True,
        cwd=BACKEND_DIR,
    )
    elapsed = round(time.time() - t0, 2)

    if result.returncode != 0:
        raise HTTPException(
            status_code=422,
            detail=f"Pipeline failed after {elapsed}s:\n{result.stderr or result.stdout}",
        )

    # Clear pipeline cache so next API call loads fresh data
    PipelineStore.clear_cache()

    # Build pipeline summary from regenerated files
    pipeline_summary = {"action_report_rows": 0, "forecast_menus": 0, "inventory_items": 0, "mrp_rows": 0}
    try:
        action_path = os.path.join(DATASET_DIR, "Action_Report.csv")
        if os.path.exists(action_path):
            pipeline_summary["action_report_rows"] = len(pd.read_csv(action_path))
        pipeline_summary["forecast_menus"] = len(pd.read_csv(os.path.join(DATASET_DIR, "forecast_result.csv")))
        pipeline_summary["inventory_items"] = len(pd.read_csv(os.path.join(DATASET_DIR, "inventory_result.csv")))
        pipeline_summary["mrp_rows"] = len(pd.read_csv(os.path.join(DATASET_DIR, "mrp_result.csv")))
    except Exception:
        pass

    return JSONResponse({
        "status": "success",
        "message": "Pipeline selesai. Semua modul analitik telah diperbarui.",
        "file_saved": save_name,
        "files_generated": RESULT_FILES,
        "duration_seconds": elapsed,
        "row_count": row_count,
        "date_range": date_range,
        "pipeline_summary": pipeline_summary,
        "stdout": result.stdout[-1000:] if result.stdout else "",
    })
