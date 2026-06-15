import os
import sys
import pandas as pd
from typing import Dict, Any, Optional

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from mock_data import get_mock_sales_data
from services.pipeline_service import run_full_pipeline

class PipelineStore:
    _uploaded_df: Optional[pd.DataFrame] = None
    # Cached results per scenario (e.g. "Base", "High Demand +20%", etc.)
    _cached_results: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def set_uploaded_df(cls, df: pd.DataFrame):
        cls._uploaded_df = df
        cls.clear_cache()

    @classmethod
    def get_df(cls) -> pd.DataFrame:
        if cls._uploaded_df is not None:
            return cls._uploaded_df.copy()
        return get_mock_sales_data()

    @classmethod
    def get_results(cls, scenario_name: str = "Base") -> Dict[str, Any]:
        if scenario_name not in cls._cached_results:
            df = cls.get_df()
            cls._cached_results[scenario_name] = run_full_pipeline(df, scenario_name)
        return cls._cached_results[scenario_name]

    @classmethod
    def clear_cache(cls):
        cls._cached_results.clear()

    @classmethod
    def reset_to_mock(cls):
        cls._uploaded_df = None
        cls.clear_cache()
