export interface ValidationReport {
  row_count: number;
  product_count: number;
  date_range: {
    start: string;
    end: string;
  };
  missing_values: number;
  warnings: string[];
}

export interface DashboardSummary {
  total_forecast_demand: number;
  expected_revenue: number;
  expected_profit: number;
  profit_margin: number;
  stockout_risk_count: number;
  purchase_orders_needed: number;
}

export interface ProductForecast {
  product_id: string;
  product_name: string;
  forecast_next_week: number;
  forecast_w25: number;
  forecast_w26: number;
  forecast_w27: number;
  forecast_w28: number;
  trend_pct: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
}

export interface ProductInventory {
  product_id: string;
  product_name: string;
  current_stock: number;
  safety_stock: number;
  reorder_point: number;
  forecast_demand_7d: number;
  target_stock_level: number;
  recommended_order: number;
  recommended_order_qty?: number;
  estimated_cost?: number;
  status: string;
}

export interface RawMaterialRequirement {
  material_id: string;
  material_name: string;
  qty_required: number;
  unit: string;
}

export interface ProductMRP {
  product_id: string;
  product_name: string;
  recommended_order: number;
  materials: RawMaterialRequirement[];
}

export interface ProductProfitability {
  product_id: string;
  product_name: string;
  forecast_qty: number;
  selling_price: number;
  unit_cost: number;
  margin_per_unit: number;
  estimated_revenue: number;
  estimated_cost: number;
  estimated_profit: number;
}

export interface PipelineResults {
  validation: ValidationReport;
  dashboard_summary: DashboardSummary;
  forecast: ProductForecast[];
  inventory: ProductInventory[];
  mrp: ProductMRP[];
  profitability: ProductProfitability[];
}

export interface HealthStatus {
  status: string;
  pipeline: string;
  environment: string;
  model: string;
}
