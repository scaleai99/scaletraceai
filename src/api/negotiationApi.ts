/**
 * RFQ Negotiation API client - Module 04 gap (Req 4.11, 4.12, 4.13).
 */
import axios from 'axios'

const BASE = '/api/v1/rfqs'

export interface NegotiationRound {
  id: string
  rfq_id: string
  round_number: number
  round_date: string
  customer_price_inr: number | null
  counter_price_inr: number | null
  discount_pct: number | null
  notes: string | null
  outcome: 'Ongoing' | 'Agreed' | 'Rejected'
  created_by: string | null
  created_at: string
}

export interface NegotiationRoundCreate {
  round_date?: string
  customer_price_inr?: number
  counter_price_inr?: number
  discount_pct?: number
  notes?: string
}

export interface NegotiationMetrics {
  rfqs_in_negotiation: number
  avg_negotiation_duration_days: number
  avg_discount_pct: number
  negotiation_to_win_conversion_rate: number
}

export interface EstimatedVsActualRow {
  rfq_id: string
  rfq_number: string
  part_number: string | null
  estimated_unit_cost: number | null
  actual_unit_cost: number | null
  variance_pct: number | null
  variance_exceeds_threshold: boolean
}

export async function listRounds(rfqId: string): Promise<NegotiationRound[]> {
  const { data } = await axios.get<NegotiationRound[]>(`${BASE}/${rfqId}/negotiation-rounds`)
  return data
}

export async function createRound(
  rfqId: string,
  body: NegotiationRoundCreate,
): Promise<NegotiationRound> {
  const { data } = await axios.post<NegotiationRound>(`${BASE}/${rfqId}/negotiation-rounds`, body)
  return data
}

export async function updateOutcome(
  rfqId: string,
  roundId: string,
  outcome: 'Ongoing' | 'Agreed' | 'Rejected',
  notes?: string,
): Promise<NegotiationRound> {
  const { data } = await axios.patch<NegotiationRound>(
    `${BASE}/${rfqId}/negotiation-rounds/${roundId}`,
    { outcome, notes },
  )
  return data
}

export async function getMetrics(): Promise<NegotiationMetrics> {
  const { data } = await axios.get<NegotiationMetrics>(`${BASE}/dashboard/negotiation-metrics`)
  return data
}

export async function getEstimatedVsActual(): Promise<EstimatedVsActualRow[]> {
  const { data } = await axios.get<EstimatedVsActualRow[]>(`${BASE}/dashboard/estimated-vs-actual`)
  return data
}
