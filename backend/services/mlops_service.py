"""
MLOps Service — Model registry, experiment tracking, versioning, champion vs challenger.
"""
from typing import Dict, Any, List
from datetime import datetime


def get_mlops_data() -> Dict[str, Any]:
    """Get MLOps dashboard data."""
    model_registry = [
        {
            "model_id": "lgbm-v2.1", "name": "LightGBM", "version": "2.1",
            "framework": "LightGBM", "status": "champion", "weight": 0.4,
            "metrics": {"mape": 12.3, "rmse": 145.2, "r2": 0.89},
            "created_at": "2026-06-10T08:00:00Z", "last_used": "2026-06-17T07:00:00Z",
            "training_samples": 4500, "features_count": 5,
        },
        {
            "model_id": "catboost-v1.3", "name": "CatBoost", "version": "1.3",
            "framework": "CatBoost", "status": "challenger", "weight": 0.3,
            "metrics": {"mape": 13.1, "rmse": 152.8, "r2": 0.87},
            "created_at": "2026-06-10T08:30:00Z", "last_used": "2026-06-17T07:00:00Z",
            "training_samples": 4500, "features_count": 5,
        },
        {
            "model_id": "nn-onnx-v1.0", "name": "Neural Network (ONNX)", "version": "1.0",
            "framework": "PyTorch → ONNX", "status": "challenger", "weight": 0.3,
            "metrics": {"mape": 14.2, "rmse": 161.5, "r2": 0.85},
            "created_at": "2026-06-08T10:00:00Z", "last_used": "2026-06-17T07:00:00Z",
            "training_samples": 4500, "features_count": 5,
        },
    ]

    experiments = [
        {"id": "exp-001", "name": "Baseline LightGBM", "date": "2026-05-20", "model": "LightGBM", "mape": 15.8, "status": "completed"},
        {"id": "exp-002", "name": "Feature Engineering v2", "date": "2026-05-25", "model": "LightGBM", "mape": 13.5, "status": "completed"},
        {"id": "exp-003", "name": "Ensemble (LGB+CB+NN)", "date": "2026-06-01", "model": "Ensemble", "mape": 12.3, "status": "completed"},
        {"id": "exp-004", "name": "CatBoost Hypertuning", "date": "2026-06-05", "model": "CatBoost", "mape": 13.1, "status": "completed"},
        {"id": "exp-005", "name": "ONNX Export Test", "date": "2026-06-08", "model": "Neural Net", "mape": 14.2, "status": "completed"},
    ]

    champion = next((m for m in model_registry if m["status"] == "champion"), model_registry[0])
    challengers = [m for m in model_registry if m["status"] == "challenger"]

    return {
        "model_registry": model_registry,
        "experiments": experiments,
        "champion": champion,
        "challengers": challengers,
        "ensemble_config": {"method": "weighted_average", "total_weight": 1.0, "models_count": 3},
        "summary": {
            "total_models": len(model_registry),
            "total_experiments": len(experiments),
            "best_mape": min(m["metrics"]["mape"] for m in model_registry),
            "last_training": "2026-06-10T08:00:00Z",
        },
    }
