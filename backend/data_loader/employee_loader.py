import os
import json
from typing import Dict, Any, List

def load_employee_data(filepath: str = None) -> Dict[str, Any]:
    if filepath is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, "dataset", "Employee (Competitors).json")
        
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Employee dataset not found at {filepath}")
        
    with open(filepath, 'r') as f:
        data = json.load(f)
        
    return data

if __name__ == "__main__":
    data = load_employee_data()
    print(f"Loaded {len(data.get('employees', []))} employees.")
