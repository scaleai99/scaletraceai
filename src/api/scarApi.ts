/**
 * SCAR API client - Module 21 gap (Req 21.12/21.13).
 */
import axios from 'axios'

const BASE = '/api/v1/scars'

export interface SCAR {
  id: string
  scar_number: string
  ncr_id: string | null
  supplier_id: string | null
  part_number: string | null
  drawing_number: string | null
  lot_number: string | null
  qty_affected: number | null
  nonconformance_desc: string | null
  issued_date: string
  response_due_date: string
  supplier_response: string | null
  response_received_date: string | null
  review_notes: string | null
  status: string
  as9100d_clause: string
  created_at: string
}

export interface SCARCreate {
  supplier_id?: string
  ncr_id?: string
  part_number?: string
  drawing_number?: string
  lot_number?: string
  qty_affected?: number
  nonconformance_desc?: string
  response_period_days?: number
}

export async function listSCARs(params: { status?: string; overdue?: boolean } = {}): Promise<SCAR[]> {
  const { data } = await axios.get<SCAR[]>(BASE, { params })
  return data
}

export async function createSCAR(body: SCARCreate): Promise<SCAR> {
  const { data } = await axios.post<SCAR>(BASE, body)
  return data
}

export async function transitionSCAR(
  id: string,
  target_state: string,
  extra: { supplier_response?: string; review_notes?: string } = {},
): Promise<SCAR> {
  const { data } = await axios.post<SCAR>(`${BASE}/${id}/transition`, { target_state, ...extra })
  return data
}
