/** Feasibility (OP50) API client — tolerance-vs-capability + AS9100D 8.2.3. */
import { apiClient } from './axiosClient'
const BASE = '/api/v1/feasibility'

export interface FeasCheck { area: string; verdict: 'ok' | 'watch' | 'risk' | string; note: string }
export interface As9100Item { clause: string; item: string; status: 'ok' | 'attention' | string }
export interface FeasibilityAssessment {
  id: string
  rfq_id: string
  overall_verdict: 'ok' | 'watch' | 'risk' | string
  summary: string | null
  check_count: number
  ok_count: number
  watch_count: number
  risk_count: number
  checks: FeasCheck[] | null
  as9100_checklist: As9100Item[] | null
  assessed_by: string | null
  assessed_at: string | null
}

export const runFeasibility = (rfqId: string) =>
  apiClient.post<FeasibilityAssessment>(`${BASE}/run`, { rfq_id: rfqId }).then((r) => r.data)
export const getFeasibility = (rfqId: string) =>
  apiClient.get<{ assessment: FeasibilityAssessment | null }>(BASE, { params: { rfq_id: rfqId } }).then((r) => r.data.assessment)
