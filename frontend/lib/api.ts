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
  AIInsight
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
