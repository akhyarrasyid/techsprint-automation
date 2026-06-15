import {
  DashboardSummary,
  ProductForecast,
  ProductInventory,
  ProductMRP,
  ProductProfitability,
  ValidationReport,
  PipelineResults
} from './types';

import {
  fetchDashboardSummary,
  fetchForecast,
  fetchInventory,
  fetchMRP,
  fetchProfitability,
  uploadSalesCSV,
  runPipeline
} from './api';

// Realistic Fallback Datasets (SAP IBP / Power BI Inspired)
export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  total_forecast_demand: 5130,
  expected_revenue: 82670000,
  expected_profit: 27790000,
  profit_margin: 33.6,
  stockout_risk_count: 1,
  purchase_orders_needed: 2
};

export const MOCK_FORECAST: ProductForecast[] = [
  {
    product_id: "PRD001",
    product_name: "Tepung Protein Tinggi",
    forecast_next_week: 1390,
    forecast_w25: 1460,
    forecast_w26: 1503,
    forecast_w27: 1540,
    forecast_w28: 1580,
    trend_pct: 13.6,
    confidence_interval_low: 1280,
    confidence_interval_high: 1500
  },
  {
    product_id: "PRD002",
    product_name: "Tepung Protein Sedang",
    forecast_next_week: 1180,
    forecast_w25: 1239,
    forecast_w26: 1276,
    forecast_w27: 1308,
    forecast_w28: 1340,
    trend_pct: 13.6,
    confidence_interval_low: 1085,
    confidence_interval_high: 1275
  },
  {
    product_id: "PRD003",
    product_name: "Tepung Protein Rendah",
    forecast_next_week: 980,
    forecast_w25: 1029,
    forecast_w26: 1060,
    forecast_w27: 1086,
    forecast_w28: 1113,
    trend_pct: 13.6,
    confidence_interval_low: 900,
    confidence_interval_high: 1060
  },
  {
    product_id: "PRD004",
    product_name: "Premix Donat",
    forecast_next_week: 860,
    forecast_w25: 903,
    forecast_w26: 930,
    forecast_w27: 953,
    forecast_w28: 977,
    trend_pct: 13.6,
    confidence_interval_low: 790,
    confidence_interval_high: 930
  },
  {
    product_id: "PRD005",
    product_name: "Premix Cake",
    forecast_next_week: 720,
    forecast_w25: 756,
    forecast_w26: 779,
    forecast_w27: 798,
    forecast_w28: 818,
    trend_pct: 13.6,
    confidence_interval_low: 660,
    confidence_interval_high: 780
  }
];

export const MOCK_INVENTORY: ProductInventory[] = [
  {
    product_id: "PRD001",
    product_name: "Tepung Protein Tinggi",
    current_stock: 450,
    safety_stock: 125,
    reorder_point: 275,
    forecast_demand_7d: 1390,
    target_stock_level: 1665,
    recommended_order: 1215,
    status: "Healthy"
  },
  {
    product_id: "PRD002",
    product_name: "Tepung Protein Sedang",
    current_stock: 200,
    safety_stock: 110,
    reorder_point: 250,
    forecast_demand_7d: 1180,
    target_stock_level: 1430,
    recommended_order: 1230,
    status: "Below ROP"
  },
  {
    product_id: "PRD003",
    product_name: "Tepung Protein Rendah",
    current_stock: 550,
    safety_stock: 90,
    reorder_point: 210,
    forecast_demand_7d: 980,
    target_stock_level: 1190,
    recommended_order: 0,
    status: "Healthy"
  },
  {
    product_id: "PRD004",
    product_name: "Premix Donat",
    current_stock: 310,
    safety_stock: 80,
    reorder_point: 185,
    forecast_demand_7d: 860,
    target_stock_level: 1045,
    recommended_order: 0,
    status: "Healthy"
  },
  {
    product_id: "PRD005",
    product_name: "Premix Cake",
    current_stock: 180,
    safety_stock: 70,
    reorder_point: 160,
    forecast_demand_7d: 720,
    target_stock_level: 880,
    recommended_order: 0,
    status: "Healthy"
  }
];

export const MOCK_MRP: ProductMRP[] = [
  {
    product_id: "PRD001",
    product_name: "Tepung Protein Tinggi",
    recommended_order: 1215,
    materials: [
      { material_id: "RAW001", material_name: "Gandum", qty_required: 1215, unit: "kg" },
      { material_id: "RAW002", material_name: "Kemasan Plastik", qty_required: 1215, unit: "pcs" }
    ]
  },
  {
    product_id: "PRD002",
    product_name: "Tepung Protein Sedang",
    recommended_order: 1230,
    materials: [
      { material_id: "RAW001", material_name: "Gandum", qty_required: 1230, unit: "kg" },
      { material_id: "RAW002", material_name: "Kemasan Plastik", qty_required: 1230, unit: "pcs" }
    ]
  }
];

export const MOCK_PROFITABILITY: ProductProfitability[] = [
  {
    product_id: "PRD001",
    product_name: "Tepung Protein Tinggi",
    forecast_qty: 1390,
    selling_price: 15000,
    unit_cost: 9500,
    margin_per_unit: 5500,
    estimated_revenue: 20850000,
    estimated_cost: 13205000,
    estimated_profit: 7645000
  },
  {
    product_id: "PRD002",
    product_name: "Tepung Protein Sedang",
    forecast_qty: 1180,
    selling_price: 18000,
    unit_cost: 11500,
    margin_per_unit: 6500,
    estimated_revenue: 21240000,
    estimated_cost: 13570000,
    estimated_profit: 7670000
  }
];

export const MOCK_VALIDATION_REPORT: ValidationReport = {
  row_count: 150,
  product_count: 5,
  date_range: { start: '2026-05-17', end: '2026-06-15' },
  missing_values: 0,
  warnings: []
};

// Network Error Handlers (Wrappers for UI stability)
export async function safeDashboardSummary(scenario: string = 'Base'): Promise<DashboardSummary> {
  try {
    return await fetchDashboardSummary(scenario);
  } catch (error) {
    console.warn('API fetch failed, falling back to mock dashboard summary:', error);
    return MOCK_DASHBOARD_SUMMARY;
  }
}

export async function safeForecast(scenario: string = 'Base'): Promise<ProductForecast[]> {
  try {
    return await fetchForecast(scenario);
  } catch (error) {
    console.warn('API fetch failed, falling back to mock forecast:', error);
    return MOCK_FORECAST;
  }
}

export async function safeInventory(scenario: string = 'Base'): Promise<ProductInventory[]> {
  try {
    return await fetchInventory(scenario);
  } catch (error) {
    console.warn('API fetch failed, falling back to mock inventory:', error);
    return MOCK_INVENTORY;
  }
}

export async function safeMRP(scenario: string = 'Base'): Promise<ProductMRP[]> {
  try {
    return await fetchMRP(scenario);
  } catch (error) {
    console.warn('API fetch failed, falling back to mock MRP:', error);
    return MOCK_MRP;
  }
}

export async function safeProfitability(scenario: string = 'Base'): Promise<ProductProfitability[]> {
  try {
    return await fetchProfitability(scenario);
  } catch (error) {
    console.warn('API fetch failed, falling back to mock profitability:', error);
    return MOCK_PROFITABILITY;
  }
}

export async function safeUploadCSV(file: File): Promise<ValidationReport> {
  try {
    return await uploadSalesCSV(file);
  } catch (error) {
    console.warn('API upload failed, falling back to mock validation report:', error);
    return MOCK_VALIDATION_REPORT;
  }
}

export async function safeRunPipeline(scenario: string = 'Base'): Promise<PipelineResults> {
  try {
    return await runPipeline(scenario);
  } catch (error) {
    console.warn('API run-pipeline failed, falling back to mock pipeline results:', error);
    return {
      validation: MOCK_VALIDATION_REPORT,
      dashboard_summary: MOCK_DASHBOARD_SUMMARY,
      forecast: MOCK_FORECAST,
      inventory: MOCK_INVENTORY,
      mrp: MOCK_MRP,
      profitability: MOCK_PROFITABILITY
    };
  }
}
