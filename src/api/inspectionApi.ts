/** Inspection (OP110-120) API client — ballooned plan from the characteristic set. */
import { apiClient } from './axiosClient'
const BASE = '/api/v1/inspection'

export interface InspectionItem {
  id: string
  balloon_no: number | null
  feature_ref: string | null
  char_type: string | null
  requirement: string | null
  nominal: number | null
  upper_tol: number | null
  lower_tol: number | null
  unit: string | null
  gdt_symbol: string | null
  datums: unknown[] | null
  is_key: boolean
  method: string | null
  instrument: string | null
  instrument_id: string | null
  resolution_ratio: number | null
  gauge_rr_pct: number | null
  capability_ok: boolean | null
  capability_note: string | null
  cpk: number | null
  measurement_count: number
  measured_value: number | null
  in_tolerance: boolean | null
  result_note: string | null
  inspected_by: string | null
  inspected_at: string | null
}
export interface InspectionPlan {
  id: string
  plan_no: string | null
  part_ref: string | null
  status: string
  rfq_id: string | null
  rfq_line_item_id: string | null
  item_count: number
  measured_count: number
  conforming_count: number
  nonconforming_count: number
  created_at: string | null
  items: InspectionItem[]
}

export const generatePlan = (rfqLineItemId: string) =>
  apiClient.post<InspectionPlan>(`${BASE}/plans/generate`, { rfq_line_item_id: rfqLineItemId }).then((r) => r.data)
export const getPlan = (rfqLineItemId: string) =>
  apiClient.get<{ plan: InspectionPlan | null }>(`${BASE}/plans`, { params: { rfq_line_item_id: rfqLineItemId } }).then((r) => r.data.plan)
export const recordMeasurement = (itemId: string, measured_value: number) =>
  apiClient.patch<InspectionPlan>(`${BASE}/items/${itemId}`, { measured_value }).then((r) => r.data)

// --- OP110/120 (Batch 4): measurements, capability and gauge selection ---

export interface Capability {
  n: number
  mean: number | null
  sigma: number | null
  usl: number | null
  lsl: number | null
  cpk: number | null
  capable: boolean | null
  verdict: 'capable' | 'marginal' | 'not capable' | null
  note: string
}

export interface Measurement {
  id: string
  serial_no: string | null
  measured_value: number
  in_tolerance: boolean | null
  measured_at: string | null
}

export interface GaugeOption {
  instrument_id: string
  instrument_code: string
  instrument_name: string | null
  resolution: number | null
  gauge_rr_pct: number | null
  resolution_ratio: number | null
  in_calibration: boolean
  calibration_note: string
  eligible: boolean
  marginal: boolean
  rejections: string[]
}

export interface GaugeSelection {
  selected: GaugeOption | null
  band: number | null
  note: string
  capability_ok: boolean
  evaluated: GaugeOption[]
}

export const addMeasurement = (itemId: string, measured_value: number, serial_no?: string) =>
  apiClient
    .post<{ measurement_id: string; in_tolerance: boolean; note: string; capability: Capability }>(
      `${BASE}/items/${itemId}/measurements`, { measured_value, serial_no })
    .then((r) => r.data)

export const listMeasurements = (itemId: string) =>
  apiClient
    .get<{ item_id: string; balloon_no: number | null; measurements: Measurement[]; capability: Capability }>(
      `${BASE}/items/${itemId}/measurements`)
    .then((r) => r.data)

export const getGaugeOptions = (itemId: string) =>
  apiClient.get<GaugeSelection>(`${BASE}/items/${itemId}/gauge-options`).then((r) => r.data)
