import {
  DashboardSummary,
  ProductForecast,
  ProductInventory,
  ProductMRP,
  ProductProfitability,
  ValidationReport,
  PipelineResults,
  ProfitabilityReport,
  AIInsight,
  ExplainabilityReport
} from './types';

import {
  fetchDashboardSummary,
  fetchForecast,
  fetchInventory,
  fetchMRP,
  fetchProfitability,
  fetchProfitabilityReport,
  fetchInsights,
  fetchExplainability,
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
    production_qty: 1215,
    materials: [
      {
        material_id: "RAW001",
        material_name: "Gandum",
        qty_required: 1215,
        current_stock: 900,
        shortage: 315,
        unit: "kg",
        unit_cost: 8500,
        order_cost: 2677500,
        supplier: "UD Makmur",
        lead_time: 4,
        expected_arrival: "19 June 2026"
      },
      {
        material_id: "RAW002",
        material_name: "Kemasan Plastik",
        qty_required: 1215,
        current_stock: 2000,
        shortage: 0,
        unit: "pcs",
        unit_cost: 500,
        order_cost: 0,
        supplier: "PT KemasIndo",
        lead_time: 2,
        expected_arrival: "17 June 2026"
      }
    ]
  },
  {
    product_id: "PRD002",
    product_name: "Tepung Protein Sedang",
    recommended_order: 1230,
    production_qty: 1230,
    materials: [
      {
        material_id: "RAW001",
        material_name: "Gandum",
        qty_required: 1230,
        current_stock: 900,
        shortage: 330,
        unit: "kg",
        unit_cost: 8500,
        order_cost: 2805000,
        supplier: "UD Makmur",
        lead_time: 4,
        expected_arrival: "19 June 2026"
      },
      {
        material_id: "RAW002",
        material_name: "Kemasan Plastik",
        qty_required: 1230,
        current_stock: 2000,
        shortage: 0,
        unit: "pcs",
        unit_cost: 500,
        order_cost: 0,
        supplier: "PT KemasIndo",
        lead_time: 2,
        expected_arrival: "17 June 2026"
      }
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

// ── MOCK PROFITABILITY REPORT (Scenario Engine) ──
export const MOCK_PROFITABILITY_REPORT: ProfitabilityReport = {
  by_product: [
    { product_id: 'PRD001', product_name: 'Tepung Protein Tinggi', revenue: 20850000, cogs: 13205000, gross_profit: 7645000, margin_pct: 36.7 },
    { product_id: 'PRD002', product_name: 'Tepung Protein Sedang', revenue: 21240000, cogs: 13570000, gross_profit: 7670000, margin_pct: 36.1 },
    { product_id: 'PRD003', product_name: 'Tepung Protein Rendah', revenue: 13720000, cogs: 8820000, gross_profit: 4900000, margin_pct: 35.7 },
    { product_id: 'PRD004', product_name: 'Premix Donat', revenue: 15480000, cogs: 10320000, gross_profit: 5160000, margin_pct: 33.3 },
    { product_id: 'PRD005', product_name: 'Premix Cake', revenue: 11380000, cogs: 7560000, gross_profit: 3820000, margin_pct: 33.6 },
  ],
  scenarios: [
    { name: 'Base', total_revenue: 82670000, total_cogs: 53475000, gross_profit: 29195000, margin_pct: 35.3, service_level: 98, holding_cost: 3200000 },
    { name: 'High Demand +20%', total_revenue: 99204000, total_cogs: 64170000, gross_profit: 35034000, margin_pct: 35.3, service_level: 80, holding_cost: 3200000 },
    { name: 'Supplier Delay +5 hari', total_revenue: 82670000, total_cogs: 53475000, gross_profit: 24100000, margin_pct: 29.2, service_level: 82, holding_cost: 4800000 },
    { name: 'Raw Material +10%', total_revenue: 82670000, total_cogs: 58822500, gross_profit: 23847500, margin_pct: 28.8, service_level: 98, holding_cost: 3520000 },
  ]
};

// ── MOCK AI INSIGHTS ──
export const MOCK_INSIGHTS: AIInsight[] = [
  { type: 'risk', title: 'Stockout Risk — Minyak Goreng', description: 'Minyak Goreng memiliki stok 550 unit, mendekati safety stock. Diperkirakan kehabisan stok dalam 4 hari.', severity: 'high', product_id: 'PRD003' },
  { type: 'action', title: 'PO Required — RAW001', description: 'Material shortage Gandum: 768 unit. Supplier UD Makmur lead time 4 hari. Rilis PO hari ini.', severity: 'high', material_id: 'RAW001' },
  { type: 'opportunity', title: 'Demand Growth — Tepung Protein Tinggi', description: 'Tepung Protein Tinggi mengalami tren kenaikan 8.3%. Pertimbangkan peningkatan kapasitas produksi.', severity: 'low', product_id: 'PRD001' },
  { type: 'warning', title: 'Supplier Delay Simulation', description: 'Delay +5 hari menurunkan service level dari 98% menjadi 82%. Disarankan meningkatkan safety stock.', severity: 'medium' },
];

export async function safeProfitabilityReport(scenario: string = 'Base'): Promise<ProfitabilityReport> {
  try {
    return await fetchProfitabilityReport(scenario);
  } catch (error) {
    console.warn('API fetch failed, falling back to mock profitability report:', error);
    return MOCK_PROFITABILITY_REPORT;
  }
}

export async function safeInsights(scenario: string = 'Base'): Promise<AIInsight[]> {
  try {
    return await fetchInsights(scenario);
  } catch (error) {
    console.warn('API fetch failed, falling back to mock insights:', error);
    return MOCK_INSIGHTS;
  }
}

export const MOCK_EXPLAINABILITY_REPORT: ExplainabilityReport = {
  feature_importance: [
    { feature: 'lag_7', importance: 35.4, description: 'Histori penjualan 7 hari ke belakang (Weekly seasonality)' },
    { feature: 'rolling_mean_7', importance: 24.8, description: 'Rata-rata bergerak tren penjualan 7 hari terakhir' },
    { feature: 'promotion', importance: 18.2, description: 'Status promo aktif pada hari/minggu berjalan' },
    { feature: 'selling_price', importance: 12.1, description: 'Harga jual produk jadi (Price elasticity)' },
    { feature: 'current_stock', importance: 9.5, description: 'Ketersediaan stok aktual di gudang' }
  ],
  shap_values: [
    { feature: 'lag_7', shap_value: 0.45, effect: 'Positive', description: 'Permintaan tinggi minggu lalu sangat berkorelasi dengan proyeksi kenaikan permintaan mendatang.' },
    { feature: 'rolling_mean_7', shap_value: 0.32, effect: 'Positive', description: 'Tren penjualan yang stabil meningkatkan baseline perkiraan masa depan.' },
    { feature: 'promotion', shap_value: 0.28, effect: 'Positive', description: 'Adanya kampanye promosi terbukti melipatgandakan peluang konversi penjualan.' },
    { feature: 'selling_price', shap_value: -0.15, effect: 'Negative', description: 'Kenaikan harga jual memiliki elastisitas negatif, menekan volume unit penjualan.' },
    { feature: 'current_stock', shap_value: -0.05, effect: 'Negative', description: 'Tingkat stok yang tipis cenderung sedikit menurunkan tingkat pemenuhan order riil.' }
  ],
  waterfall_data: [
    { name: 'Base Value', value: 1150, type: 'base' },
    { name: 'lag_7 effect', value: 120, type: 'positive' },
    { name: 'rolling_mean_7 effect', value: 60, type: 'positive' },
    { name: 'promotion effect', value: 95, type: 'positive' },
    { name: 'selling_price effect', value: -35, type: 'negative' },
    { name: 'current_stock effect', value: -10, type: 'negative' },
    { name: 'Final Prediction', value: 1380, type: 'total' }
  ]
};

export async function safeExplainability(): Promise<ExplainabilityReport> {
  try {
    return await fetchExplainability();
  } catch (error) {
    console.warn('API fetch failed, falling back to mock explainability:', error);
    return MOCK_EXPLAINABILITY_REPORT;
  }
}
