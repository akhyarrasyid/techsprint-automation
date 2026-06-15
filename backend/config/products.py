PRODUCTS = {
    "PRD001": "Tepung Protein",
    "PRD002": "Gula Pasir",
    "PRD003": "Minyak Goreng",
    "PRD004": "Tepung Bumbu",
    "PRD005": "Santan Instan"
}

# Bill of Materials (BOM) mapping finished products to raw materials
BOM = {
    "PRD001": [
        {"material_id": "RAW001", "name": "Gandum", "qty_required": 1.0, "unit": "kg"},
        {"material_id": "RAW002", "name": "Kemasan Plastik", "qty_required": 1.0, "unit": "pcs"}
    ],
    "PRD002": [
        {"material_id": "RAW003", "name": "Tebu Raw", "qty_required": 1.2, "unit": "kg"},
        {"material_id": "RAW002", "name": "Kemasan Plastik", "qty_required": 1.0, "unit": "pcs"}
    ],
    "PRD003": [
        {"material_id": "RAW004", "name": "Minyak Sawit Mentah", "qty_required": 0.9, "unit": "liter"},
        {"material_id": "RAW005", "name": "Botol Plastik", "qty_required": 1.0, "unit": "pcs"}
    ],
    "PRD004": [
        {"material_id": "RAW001", "name": "Gandum", "qty_required": 0.8, "unit": "kg"},
        {"material_id": "RAW006", "name": "Bumbu Rempah", "qty_required": 0.2, "unit": "kg"},
        {"material_id": "RAW002", "name": "Kemasan Plastik", "qty_required": 1.0, "unit": "pcs"}
    ],
    "PRD005": [
        {"material_id": "RAW007", "name": "Kelapa", "qty_required": 2.0, "unit": "pcs"},
        {"material_id": "RAW008", "name": "Kemasan Kotak", "qty_required": 1.0, "unit": "pcs"}
    ]
}
