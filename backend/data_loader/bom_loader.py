import os
import json
from typing import Dict, Any, List

def load_bom_data(filepath: str = None) -> Dict[str, Any]:
    if filepath is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, "dataset", "Recipe_BOM (Competitors).json")
        
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Recipe BOM dataset not found at {filepath}")
        
    with open(filepath, 'r') as f:
        data = json.load(f)
        
    return data

def get_bom_mapping(bom_data: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Returns a dictionary mapping Menu_ID -> list of ingredient dictionaries.
    """
    mapping = {}
    for item in bom_data.get("menu_items", []):
        menu_id = item.get("Menu_ID")
        mapping[menu_id] = item.get("ingredients", [])
    return mapping

def get_menu_price_mapping(bom_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Returns a dictionary mapping Menu_ID -> Selling_Price_IDR.
    """
    mapping = {}
    for item in bom_data.get("menu_items", []):
        menu_id = item.get("Menu_ID")
        mapping[menu_id] = float(item.get("Selling_Price_IDR", 0.0))
    return mapping

def get_menu_name_mapping(bom_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Returns a dictionary mapping Menu_ID -> Menu_Name.
    """
    mapping = {}
    for item in bom_data.get("menu_items", []):
        menu_id = item.get("Menu_ID")
        mapping[menu_id] = item.get("Menu_Name", "")
    return mapping

if __name__ == "__main__":
    data = load_bom_data()
    print(f"Loaded Recipe BOM with {len(data.get('menu_items', []))} menu items.")
