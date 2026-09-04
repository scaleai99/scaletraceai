/**
 * rfqQueriesApi.ts - OP10 intake gate, OP20 cross-source reconciliation and the
 * customer query register.  -> /api/v1/rfq-queries
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/rfq-queries'

export interface IntakeGate {
  open: boolean
  blocked: boolean
  reasons: string[]
  rescreen_days: number
  screening: {
    id: string; party_name: string | null; result: string
    screened_date: string | null; lists: string | null; stale: boolean
  } | null
  classification: {
    id: string; jurisdiction: string; authority: string | null
    usml_category: string | null; eccn: string | null
    determined_by: string | null; determined_date: string | null; marking: string | null
  } | null
}

export interface ReconChar {
  id: string; seq: number | null; source: string; char_type: string
  raw_text: string | null; feature_ref: string | null
  nominal: number | null; upper_tol: number | null; lower_tol: number | null
  unit: string | null; gdt_symbol: string | null; datums: string[] | null
  is_key: boolean; confidence: number | null
}

export interface ReconFinding {
  verdict: 'agree' | 'disagree' | 'drawing_only' | 'model_only'
  key: string
  drawing: ReconChar | null
  model: ReconChar | null
  differences: string[]
  governing: string
}

export interface Reconciliation {
  characteristic_set_id: string
  governing_source: string
  drawing_count: number
  model_count: number
  not_reconciled_count: number
  not_reconciled_sources: string[]
  total_findings: number
  counts: { agree: number; disagree: number; drawing_only: number; model_only: number }
  agreement_pct: number
  queries_warranted: number
  findings: ReconFinding[]
}

export interface RFQQuery {
  id: string
  rfq_id: string | null
  rfq_line_item_id: string | null
  characteristic_id: string | null
  query_no: number | null
  source: 'reconciliation' | 'manual'
  category: string | null
  question: string
  detail: string | null
  answer: string | null
  answered_by: string | null
  answered_at: string | null
  status: 'open' | 'sent' | 'answered' | 'closed'
  raised_by: string | null
  created_at: string | null
}

export async function getIntakeGate(rfqId: string, lineItemId?: string): Promise<IntakeGate> {
  const { data } = await apiClient.get<IntakeGate>(`${BASE}/intake-gate`, {
    params: { rfq_id: rfqId, ...(lineItemId ? { rfq_line_item_id: lineItemId } : {}) },
  })
  return data
}

export async function getReconciliation(characteristicSetId: string): Promise<Reconciliation> {
  const { data } = await apiClient.get<Reconciliation>(`${BASE}/reconcile`, {
    params: { characteristic_set_id: characteristicSetId },
  })
  return data
}

export async function raiseQueriesFromReconciliation(characteristicSetId: string): Promise<{
  raised: number
  reconciliation: Reconciliation['counts']
  queries: RFQQuery[]
}> {
  const { data } = await apiClient.post(`${BASE}/reconcile/raise-queries`, {
    characteristic_set_id: characteristicSetId,
  })
  return data as { raised: number; reconciliation: Reconciliation['counts']; queries: RFQQuery[] }
}

export async function listQueries(rfqId: string): Promise<{
  rfq_id: string; total: number; open: number; queries: RFQQuery[]
}> {
  const { data } = await apiClient.get(`${BASE}`, { params: { rfq_id: rfqId } })
  return data as { rfq_id: string; total: number; open: number; queries: RFQQuery[] }
}

export async function createQuery(body: {
  rfq_id: string; rfq_line_item_id?: string | null
  category?: string | null; question: string; detail?: string | null
}): Promise<RFQQuery> {
  const { data } = await apiClient.post<RFQQuery>(`${BASE}`, body)
  return data
}

export async function updateQuery(id: string, body: {
  answer?: string; status?: string; category?: string; question?: string; detail?: string
}): Promise<RFQQuery> {
  const { data } = await apiClient.patch<RFQQuery>(`${BASE}/${id}`, body)
  return data
}

export async function deleteQuery(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}
