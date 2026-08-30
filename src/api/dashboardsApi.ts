import { apiClient } from './axiosClient'

export interface Kpi { label: string; value: number | string; unit?: string; tone?: 'good' | 'warn' | 'bad' | 'info' }
export interface ChartSeries { type: 'bar' | 'donut'; title: string; data: { label: string; value: number }[] }
export interface DomainDashboard { domain: string; title: string; kpis: Kpi[]; charts: ChartSeries[] }

export const getDomainDashboard = (domain: string) =>
  apiClient.get<DomainDashboard>(`/api/v1/dashboards/${domain}`).then((r) => r.data)
