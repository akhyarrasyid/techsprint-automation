import os
import sys
import pandas as pd
from typing import Dict, Any, List

# Add parent directory to path to support running scripts directly
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from data_loader.sales_loader import load_sales_data
from data_loader.inventory_loader import load_inventory_data
from data_loader.warehouse_loader import load_warehouse_data
from data_loader.bom_loader import load_bom_data, get_bom_mapping, get_menu_price_mapping, get_menu_name_mapping
from data_loader.employee_loader import load_employee_data

class FeatureStore:
    _sales_df: pd.DataFrame = None
    _inventory_df: pd.DataFrame = None
    _warehouse_df: pd.DataFrame = None
    _bom_raw: Dict[str, Any] = None
    _employee_raw: Dict[str, Any] = None
    
    @classmethod
    def get_sales_data(cls) -> pd.DataFrame:
        if cls._sales_df is None:
            cls._sales_df = load_sales_data()
        return cls._sales_df.copy()
        
    @classmethod
    def get_inventory_data(cls) -> pd.DataFrame:
        if cls._inventory_df is None:
            cls._inventory_df = load_inventory_data()
        return cls._inventory_df.copy()
        
    @classmethod
    def get_warehouse_data(cls) -> pd.DataFrame:
        if cls._warehouse_df is None:
            cls._warehouse_df = load_warehouse_data()
        return cls._warehouse_df.copy()
        
    @classmethod
    def get_bom_data(cls) -> Dict[str, Any]:
        if cls._bom_raw is None:
            cls._bom_raw = load_bom_data()
        return cls._bom_raw
        
    @classmethod
    def get_employee_data(cls) -> Dict[str, Any]:
        if cls._employee_raw is None:
            cls._employee_raw = load_employee_data()
        return cls._employee_raw
        
    @classmethod
    def get_bom_mapping(cls) -> Dict[str, List[Dict[str, Any]]]:
        return get_bom_mapping(cls.get_bom_data())
        
    @classmethod
    def get_menu_price_mapping(cls) -> Dict[str, float]:
        return get_menu_price_mapping(cls.get_bom_data())
        
    @classmethod
    def get_menu_name_mapping(cls) -> Dict[str, str]:
        return get_menu_name_mapping(cls.get_bom_data())
        
    @classmethod
    def reload_all(cls):
        cls._sales_df = None
        cls._inventory_df = None
        cls._warehouse_df = None
        cls._bom_raw = None
        cls._employee_raw = None

if __name__ == "__main__":
    print("Testing FeatureStore loading...")
    sales = FeatureStore.get_sales_data()
    inv = FeatureStore.get_inventory_data()
    wh = FeatureStore.get_warehouse_data()
    bom = FeatureStore.get_bom_data()
    emp = FeatureStore.get_employee_data()
    print(f"Sales size: {len(sales)}, Inventory items: {len(inv)}, Warehouse entries: {len(wh)}, BOM items: {len(bom.get('menu_items', []))}, Employees: {len(emp.get('employees', []))}")
