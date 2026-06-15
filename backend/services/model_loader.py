"""
Model Loader Service — Multi-model ensemble engine.
Loads LightGBM, CatBoost, and ONNX neural network model binaries.
Computes weighted ensemble projections:
Prediction = 0.4 * LightGBM + 0.3 * CatBoost + 0.3 * Neural Network
"""

import os
import json
import numpy as np
from typing import Dict, Any, Optional

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

class ModelLoader:
    _lightgbm = None
    _catboost = None
    _onnx_session = None
    _weights = {"lgbm": 0.4, "catboost": 0.3, "nn": 0.3}

    @classmethod
    def load_models(cls):
        """Attempts to load models. Falls back gracefully if files are missing or incompatible."""
        # 1. Load weights if defined
        weights_path = os.path.join(MODELS_DIR, "ensemble_weights.json")
        if os.path.exists(weights_path):
            try:
                with open(weights_path, "r") as f:
                    cls._weights = json.load(f)
            except Exception as e:
                print(f"Error loading ensemble weights: {e}. Using defaults.")

        # 2. LightGBM Loading
        lgbm_path = os.path.join(MODELS_DIR, "lightgbm_model.txt")
        if os.path.exists(lgbm_path):
            try:
                # Mock load library only if needed to avoid hard dependencies crashing startup
                import lightgbm as lgb
                cls._lightgbm = lgb.Booster(model_file=lgbm_path)
                print("LightGBM model loaded successfully.")
            except Exception as e:
                print(f"LightGBM failed to load: {e}. Using baseline fallback.")

        # 3. CatBoost Loading
        catboost_path = os.path.join(MODELS_DIR, "catboost_model.cbm")
        if os.path.exists(catboost_path):
            try:
                from catboost import CatBoostRegressor
                cls._catboost = CatBoostRegressor()
                cls._catboost.load_model(catboost_path)
                print("CatBoost model loaded successfully.")
            except Exception as e:
                print(f"CatBoost failed to load: {e}. Using baseline fallback.")

        # 4. ONNX NN Loading
        onnx_path = os.path.join(MODELS_DIR, "demand_nn.onnx")
        if os.path.exists(onnx_path):
            try:
                import onnxruntime as ort
                cls._onnx_session = ort.InferenceSession(onnx_path)
                print("FastAI ONNX model loaded successfully.")
            except Exception as e:
                print(f"ONNX session failed to load: {e}. Using baseline fallback.")

    @classmethod
    def predict_ensemble(cls, features: np.ndarray, baseline_forecast: float) -> float:
        """
        Calculates ensemble prediction:
        0.4 * lgbm + 0.3 * catboost + 0.3 * nn
        Falls back to baseline_forecast if models are not fully loaded.
        """
        predictions = []
        weights = []

        # LightGBM Prediction
        if cls._lightgbm is not None:
            try:
                pred = cls._lightgbm.predict(features.reshape(1, -1))[0]
                predictions.append(pred)
                weights.append(cls._weights.get("lgbm", 0.4))
            except Exception:
                pass

        # CatBoost Prediction
        if cls._catboost is not None:
            try:
                pred = cls._catboost.predict(features.reshape(1, -1))[0]
                predictions.append(pred)
                weights.append(cls._weights.get("catboost", 0.3))
            except Exception:
                pass

        # ONNX Prediction
        if cls._onnx_session is not None:
            try:
                # Assuming standard float32 inputs
                inputs = {cls._onnx_session.get_inputs()[0].name: features.astype(np.float32).reshape(1, -1)}
                pred = cls._onnx_session.run(None, inputs)[0][0][0]
                predictions.append(pred)
                weights.append(cls._weights.get("nn", 0.3))
            except Exception:
                pass

        # If we have successful model predictions, calculate weighted average
        if len(predictions) > 0:
            total_weight = sum(weights)
            weighted_sum = sum(p * w for p, w in zip(predictions, weights))
            final_pred = weighted_sum / total_weight if total_weight > 0 else baseline_forecast
            # Sanity bound check (avoid zero or negative predictions)
            return max(10.0, float(final_pred))

        # Default fallback to baseline forecast
        return float(baseline_forecast)

# Trigger initialization on import
ModelLoader.load_models()
