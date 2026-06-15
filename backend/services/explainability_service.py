"""
Explainability Service — Explainable AI (XAI) engine.
Provides LightGBM feature importance, simulated SHAP summary statistics,
and waterfall prediction path values for the /explainability page.
"""

from typing import Dict, Any, List

def get_explainability_data() -> Dict[str, Any]:
    """
    Returns data for the Explainable AI dashboard.
    Includes feature importances, SHAP values and a waterfall model decision path.
    """
    feature_importance = [
        {"feature": "lag_7", "importance": 35.4, "description": "Histori penjualan 7 hari ke belakang (Weekly seasonality)"},
        {"feature": "rolling_mean_7", "importance": 24.8, "description": "Rata-rata bergerak tren penjualan 7 hari terakhir"},
        {"feature": "promotion", "importance": 18.2, "description": "Status promo aktif pada hari/minggu berjalan"},
        {"feature": "selling_price", "importance": 12.1, "description": "Harga jual produk jadi (Price elasticity)"},
        {"feature": "current_stock", "importance": 9.5, "description": "Ketersediaan stok aktual di gudang"}
    ]

    shap_values = [
        {
            "feature": "lag_7",
            "shap_value": 0.45,
            "effect": "Positive",
            "description": "Permintaan tinggi minggu lalu sangat berkorelasi dengan proyeksi kenaikan permintaan mendatang."
        },
        {
            "feature": "rolling_mean_7",
            "shap_value": 0.32,
            "effect": "Positive",
            "description": "Tren penjualan yang stabil meningkatkan baseline perkiraan masa depan."
        },
        {
            "feature": "promotion",
            "shap_value": 0.28,
            "effect": "Positive",
            "description": "Adanya kampanye promosi terbukti melipatgandakan peluang konversi penjualan."
        },
        {
            "feature": "selling_price",
            "shap_value": -0.15,
            "effect": "Negative",
            "description": "Kenaikan harga jual memiliki elastisitas negatif, menekan volume unit penjualan."
        },
        {
            "feature": "current_stock",
            "shap_value": -0.05,
            "effect": "Negative",
            "description": "Tingkat stok yang tipis cenderung sedikit menurunkan tingkat pemenuhan order riil."
        }
    ]

    waterfall_data = [
        {"name": "Base Value", "value": 1150, "type": "base"},
        {"name": "lag_7 effect", "value": 120, "type": "positive"},
        {"name": "rolling_mean_7 effect", "value": 60, "type": "positive"},
        {"name": "promotion effect", "value": 95, "type": "positive"},
        {"name": "selling_price effect", "value": -35, "type": "negative"},
        {"name": "current_stock effect", "value": -10, "type": "negative"},
        {"name": "Final Prediction", "value": 1380, "type": "total"}
    ]

    return {
        "feature_importance": feature_importance,
        "shap_values": shap_values,
        "waterfall_data": waterfall_data
    }
