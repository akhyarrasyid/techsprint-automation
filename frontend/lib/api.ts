import {
  HealthStatus,
  DashboardSummary,
  ProductForecast,
  ProductInventory,
  ProductMRP,
  ProductProfitability,
  PipelineResults,
  ValidationReport,
  ProfitabilityReport,
  AIInsight,
  ExplainabilityReport
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function fetchDashboardSummary(scenario: string = 'Base'): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/dashboard-summary?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchForecast(scenario: string = 'Base'): Promise<ProductForecast[]> {
  const res = await fetch(`${API_BASE_URL}/forecast?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch forecast data');
  return res.json();
}

export async function fetchInventory(scenario: string = 'Base'): Promise<ProductInventory[]> {
  const res = await fetch(`${API_BASE_URL}/inventory?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch inventory planning data');
  return res.json();
}

export async function fetchMRP(scenario: string = 'Base'): Promise<ProductMRP[]> {
  const res = await fetch(`${API_BASE_URL}/mrp?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch MRP raw materials');
  return res.json();
}

export async function fetchProfitability(scenario: string = 'Base'): Promise<ProductProfitability[]> {
  const res = await fetch(`${API_BASE_URL}/profitability?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch profitability analysis');
  return res.json();
}

export async function uploadSalesCSV(file: File): Promise<ValidationReport> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to upload CSV file');
  }
  return res.json();
}

export async function runPipeline(scenario: string = 'Base'): Promise<PipelineResults> {
  const res = await fetch(`${API_BASE_URL}/run-pipeline?scenario=${encodeURIComponent(scenario)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error('Failed to run pipeline execution');
  return res.json();
}

export async function fetchProfitabilityReport(scenario: string = 'Base'): Promise<ProfitabilityReport> {
  const res = await fetch(`${API_BASE_URL}/profitability?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch profitability report');
  return res.json();
}

export async function fetchInsights(scenario: string = 'Base'): Promise<AIInsight[]> {
  const res = await fetch(`${API_BASE_URL}/insights?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch AI insights');
  return res.json();
}

export async function fetchExplainability(): Promise<ExplainabilityReport> {
  const res = await fetch(`${API_BASE_URL}/explainability`);
  if (!res.ok) throw new Error('Failed to fetch explainability report');
  return res.json();
}

export interface CopilotResponse {
  answer: string;
  sources: string[];
  model: string;
  latency_ms: number;
  cached: boolean;
}

export async function askCopilot(question: string, scenario: string = 'Base'): Promise<CopilotResponse> {
  const res = await fetch(`${API_BASE_URL}/copilot/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, scenario }),
  });
  if (!res.ok) throw new Error('Failed to ask copilot');
  return res.json();
}

export async function simulateDigitalTwin(params: {
  supplier_delay?: number;
  demand_change_pct?: number;
  stock_reduction_pct?: number;
  num_runs?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/digital-twin/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to run simulation');
  return res.json();
}

export async function fetchOptimization(budget?: number, warehouseCapacity?: number) {
  const params = new URLSearchParams();
  if (budget) params.set('budget', budget.toString());
  if (warehouseCapacity) params.set('warehouse_capacity', warehouseCapacity.toString());
  const res = await fetch(`${API_BASE_URL}/optimization?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch optimization');
  return res.json();
}

// ── Phase 15: KPI ──
export async function fetchKPI(scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/kpi?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch KPI');
  return res.json();
}

// ── Phase 16: Anomalies ──
export async function fetchAnomalies(scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/anomalies?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch anomalies');
  return res.json();
}

// ── Phase 19: Command Center ──
export async function fetchCommandCenter(scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/command-center?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch command center');
  return res.json();
}

// ── Phase 20: Model Monitoring ──
export async function fetchModelMonitoring() {
  const res = await fetch(`${API_BASE_URL}/model-monitoring`);
  if (!res.ok) throw new Error('Failed to fetch model monitoring');
  return res.json();
}

// ── Phase 21: Observability ──
export async function fetchObservability() {
  const res = await fetch(`${API_BASE_URL}/observability`);
  if (!res.ok) throw new Error('Failed to fetch observability');
  return res.json();
}

// ── Phase 22: Export ──
export async function fetchExport(format: string, scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/export/${format}?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to export');
  return res;
}

// ── Phase 23: Audit Trail ──
export async function fetchAuditTrail(limit: number = 50) {
  const res = await fetch(`${API_BASE_URL}/audit-trail?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch audit trail');
  return res.json();
}

// ── Phase 24: Data Quality ──
export async function fetchDataQuality(scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/data-quality?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Failed to fetch data quality');
  return res.json();
}

// ── Phase 25: MLOps ──
export async function fetchMLOps() {
  const res = await fetch(`${API_BASE_URL}/mlops`);
  if (!res.ok) throw new Error('Failed to fetch MLOps');
  return res.json();
}
