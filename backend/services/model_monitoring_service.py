"""
Model Monitoring Service — Prediction drift, data drift, SHAP drift, accuracy trend.
"""
from typing import Dict, Any, List
import numpy as np


def get_model_monitoring_data() -> Dict[str, Any]:
    """Generate model monitoring metrics (simulated from deterministic data)."""
    np.random.seed(42)
    weeks = [f"W{i}" for i in range(20, 28)]

    accuracy_trend = [{"week": w, "mape": round(12.5 + (i % 3) * 1.2 - i * 0.15, 1), "accuracy": round(87.5 - (i % 3) * 1.2 + i * 0.15, 1)} for i, w in enumerate(weeks)]
    prediction_drift = [{"week": w, "psi": round(0.03 + (i % 4) * 0.02, 3), "status": "stable" if 0.03 + (i % 4) * 0.02 < 0.1 else "moderate"} for i, w in enumerate(weeks)]

    features = ["lag_7", "rolling_mean_7", "promotion", "selling_price", "current_stock"]
    feature_drift = [{"feature": f, "psi": round(0.02 + hash(f) % 5 * 0.015, 3), "status": "stable" if 0.02 + hash(f) % 5 * 0.015 < 0.1 else "moderate"} for f in features]
    shap_drift = [{"feature": f, "baseline_shap": round(0.45 - i * 0.08, 2), "current_shap": round(0.43 - i * 0.075, 2), "drift_pct": round(abs((0.43 - i * 0.075) - (0.45 - i * 0.08)) / max(0.01, abs(0.45 - i * 0.08)) * 100, 1)} for i, f in enumerate(features)]

    models = [
        {"name": "LightGBM", "version": "v2.1", "weight": 0.4, "mape": 12.3, "status": "champion", "last_trained": "2026-06-10"},
        {"name": "CatBoost", "version": "v1.3", "weight": 0.3, "mape": 13.1, "status": "active", "last_trained": "2026-06-10"},
        {"name": "Neural Net (ONNX)", "version": "v1.0", "weight": 0.3, "mape": 14.2, "status": "active", "last_trained": "2026-06-08"},
    ]

    return {
        "accuracy_trend": accuracy_trend, "prediction_drift": prediction_drift,
        "feature_drift": feature_drift, "shap_drift": shap_drift,
        "models": models,
        "overall_status": "healthy", "last_check": "2026-06-17T07:00:00Z",
        "alerts": [{"type": "info", "message": "Semua model dalam kondisi stabil. Tidak perlu retrain."}],
    }
