import {
  HealthStatus,
  DashboardSummary,
  ProductForecast,
  ProductInventory,
  ProductMRP,
  ProductProfitability,
  AIInsight,
  ExplainabilityReport,
  UploadResponse,
  PipelineStatus,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Server tidak dapat dihubungi');
  return res.json();
}

export async function fetchDashboardSummary(scenario: string = 'Base'): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/dashboard-summary?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat ringkasan dashboard');
  return res.json();
}

export async function fetchForecast(scenario: string = 'Base'): Promise<ProductForecast[]> {
  const res = await fetch(`${API_BASE_URL}/forecast?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat data forecast');
  return res.json();
}

export async function fetchInventory(scenario: string = 'Base'): Promise<ProductInventory[]> {
  const res = await fetch(`${API_BASE_URL}/inventory?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat data inventaris');
  return res.json();
}

export async function fetchMRP(scenario: string = 'Base'): Promise<ProductMRP[]> {
  const res = await fetch(`${API_BASE_URL}/mrp?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat data MRP');
  return res.json();
}

export async function fetchProfitability(scenario: string = 'Base'): Promise<ProductProfitability[]> {
  const res = await fetch(`${API_BASE_URL}/profitability?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat analisis profitabilitas');
  return res.json();
}

export async function fetchInsights(scenario: string = 'Base'): Promise<AIInsight[]> {
  const res = await fetch(`${API_BASE_URL}/insights?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat insights');
  return res.json();
}

export async function fetchExplainability(): Promise<ExplainabilityReport> {
  const res = await fetch(`${API_BASE_URL}/explainability`);
  if (!res.ok) throw new Error('Gagal memuat data explainability');
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
  if (!res.ok) throw new Error('Gagal terhubung ke AI Copilot');
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
  if (!res.ok) throw new Error('Gagal menjalankan simulasi Digital Twin');
  return res.json();
}

export async function fetchKPI(scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/kpi?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat KPI');
  return res.json();
}

export async function fetchAnomalies(scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/anomalies?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat data anomali');
  return res.json();
}

export async function fetchCommandCenter(scenario: string = 'Base') {
  const res = await fetch(`${API_BASE_URL}/command-center?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error('Gagal memuat Command Center');
  return res.json();
}

export async function uploadDataFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    let detail = 'Upload gagal';
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchPipelineStatus(): Promise<PipelineStatus> {
  const res = await fetch(`${API_BASE_URL}/pipeline-status`);
  if (!res.ok) throw new Error('Gagal memuat status pipeline');
  return res.json();
}
