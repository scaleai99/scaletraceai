/**
 * Customer 360 degrees  + Quotation loss analytics API client - Module 02/10 gap.
 */
import axios from 'axios'

const V1 = '/api/v1'

export interface Customer360 {
  customer_id: string
  sales_pipeline: Record<string, number | string>
  order_history: Record<string, number | string>
  quality: Record<string, number | string>
  financial: Record<string, number | string>
}

export interface CompetitiveAnalysis {
  win_loss_by_reason: Record<string, number>
  avg_price_gap_pct_on_price_loss: number | null
  top_competitors: { name: string; count: number }[]
}

export interface MarkLostRequest {
  loss_reason_code: string
  competitor_name?: string
  competitor_price?: number
  loss_notes?: string
}

export async function getCustomer360(customerId: string): Promise<Customer360> {
  const { data } = await axios.get<Customer360>(`${V1}/customers/${customerId}/dashboard-360`)
  return data
}

export async function markQuotationLost(quotationId: string, body: MarkLostRequest) {
  const { data } = await axios.patch(`${V1}/quotations/${quotationId}/mark-lost`, body)
  return data
}

export async function getCompetitiveAnalysis(): Promise<CompetitiveAnalysis> {
  const { data } = await axios.get<CompetitiveAnalysis>(`${V1}/quotations/dashboard/competitive-analysis`)
  return data
}
