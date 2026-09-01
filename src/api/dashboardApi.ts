import { apiClient } from './axiosClient'

export interface KPIData {
  sales_pipeline_inr: number
  otd_pct: number
  oee_pct: number
  copq_inr: number
  ncr_trend_12m: number
  supplier_avg_audit_score: number
  ebitda_estimate_inr: number
  date_from: string
  date_to: string
}

export const getDashboardKPIs = (range = 'current_fy', from?: string, to?: string) => {
  const params: Record<string, string> = { range }
  if (from) params['from'] = from
  if (to) params['to'] = to
  return apiClient.get<KPIData>('/api/v1/dashboard/kpis', { params }).then(r => r.data)
}
