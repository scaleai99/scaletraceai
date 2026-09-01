/**
 * qualityApi.ts - Quality Management System API client.
 *
 * Covers:
 * - NCR (Non-Conformance Reports) at /api/v1/qms/ncrs
 * - CAPA (Corrective & Preventive Actions) at /api/v1/qms/capas
 * - Calibration stub at /api/v1/qms/calibration
 */

import axios from 'axios'

const NCR_BASE = '/api/v1/qms/ncrs'
const CAPA_BASE = '/api/v1/qms/capas'
const CALIBRATION_BASE = '/api/v1/qms/calibration'

// ---------------------------------------------------------------------------
// Types - NCR
// ---------------------------------------------------------------------------

export interface NCR {
  id: string
  ncr_number: string
  part_number: string | null
  drawing_number: string | null
  detection_stage: string
  description: string
  disposition: string | null
  concession_ref: string | null
  assigned_to_id: string | null
  status: string
  closed_at: string | null
  created_at: string
}

export interface NCRCreate {
  part_number?: string | null
  drawing_number?: string | null
  detection_stage: string
  description: string
  disposition?: string | null
}

export interface NCRUpdate {
  part_number?: string | null
  drawing_number?: string | null
  detection_stage?: string
  description?: string
  disposition?: string | null
  concession_ref?: string | null
  assigned_to_id?: string | null
}

// ---------------------------------------------------------------------------
// Types - CAPA
// ---------------------------------------------------------------------------

export interface CAPA {
  id: string
  capa_number: string
  ncr_id: string | null
  title: string
  root_cause_method: string | null
  root_cause_data: Record<string, unknown> | null
  actions: Record<string, unknown>[] | null
  effectiveness_evidence: string | null
  target_date: string | null
  status: string
  created_at: string
}

export interface CAPACreate {
  ncr_id?: string | null
  title: string
  root_cause_method?: string | null
  target_date?: string | null
}

export interface CAPAUpdate {
  title?: string
  root_cause_method?: string | null
  root_cause_data?: Record<string, unknown> | null
  actions?: Record<string, unknown>[] | null
  effectiveness_evidence?: string | null
  target_date?: string | null
}

// ---------------------------------------------------------------------------
// Types - Transition
// ---------------------------------------------------------------------------

export interface TransitionRequest {
  target_state: string
  comment?: string | null
}

// ---------------------------------------------------------------------------
// List filter params
// ---------------------------------------------------------------------------

export interface ListNCRsParams {
  status?: string
  detection_stage?: string
  part_number?: string
  skip?: number
  limit?: number
}

export interface ListCAPAsParams {
  ncr_id?: string
  status?: string
  skip?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// NCR API functions
// ---------------------------------------------------------------------------

/** List NCRs with optional filters */
export async function listNCRs(params: ListNCRsParams = {}): Promise<NCR[]> {
  const { data } = await axios.get<NCR[]>(NCR_BASE, { params })
  return data
}

/** Get a single NCR by ID */
export async function getNCR(id: string): Promise<NCR> {
  const { data } = await axios.get<NCR>(`${NCR_BASE}/${id}`)
  return data
}

/** Create a new NCR */
export async function createNCR(body: NCRCreate): Promise<NCR> {
  const { data } = await axios.post<NCR>(NCR_BASE, body)
  return data
}

/** Update NCR fields */
export async function updateNCR(id: string, body: NCRUpdate): Promise<NCR> {
  const { data } = await axios.patch<NCR>(`${NCR_BASE}/${id}`, body)
  return data
}

/** Transition NCR state */
export async function transitionNCR(id: string, body: TransitionRequest): Promise<NCR> {
  const { data } = await axios.post<NCR>(`${NCR_BASE}/${id}/transition`, body)
  return data
}

// ---------------------------------------------------------------------------
// CAPA API functions
// ---------------------------------------------------------------------------

/** List CAPAs with optional filters */
export async function listCAPAs(params: ListCAPAsParams = {}): Promise<CAPA[]> {
  const { data } = await axios.get<CAPA[]>(CAPA_BASE, { params })
  return data
}

/** Get a single CAPA by ID */
export async function getCAPADetail(id: string): Promise<CAPA> {
  const { data } = await axios.get<CAPA>(`${CAPA_BASE}/${id}`)
  return data
}

/** Create a new CAPA */
export async function createCAPA(body: CAPACreate): Promise<CAPA> {
  const { data } = await axios.post<CAPA>(CAPA_BASE, body)
  return data
}

/** Update CAPA fields */
export async function updateCAPA(id: string, body: CAPAUpdate): Promise<CAPA> {
  const { data } = await axios.patch<CAPA>(`${CAPA_BASE}/${id}`, body)
  return data
}

/** Transition CAPA state */
export async function transitionCAPA(id: string, body: TransitionRequest): Promise<CAPA> {
  const { data } = await axios.post<CAPA>(`${CAPA_BASE}/${id}/transition`, body)
  return data
}

// ---------------------------------------------------------------------------
// Types - Calibration
// ---------------------------------------------------------------------------

export interface CalibrationRecord {
  id: string
  instrument_code: string
  instrument_name: string
  instrument_type: string | null
  serial_number: string | null
  make_model: string | null
  location: string | null
  range_spec: string | null
  calibration_interval_days: number
  last_calibrated_date: string | null
  next_due_date: string | null
  calibration_cert_number: string | null
  calibrated_by: string | null
  status: string
  is_overdue: boolean | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CalibrationCreate {
  instrument_name: string
  instrument_type?: string | null
  serial_number?: string | null
  make_model?: string | null
  location?: string | null
  range_spec?: string | null
  calibration_interval_days?: number
  last_calibrated_date?: string | null
  calibration_cert_number?: string | null
  calibrated_by?: string | null
  notes?: string | null
}

export interface CalibrationUpdate {
  instrument_name?: string | null
  instrument_type?: string | null
  location?: string | null
  calibration_interval_days?: number | null
  notes?: string | null
}

export interface CalibrateRequest {
  calibration_date: string
  cert_number: string
  calibrated_by: string
  notes?: string | null
}

export interface CalibrationStats {
  total: number
  overdue_count: number
  due_within_30_days: number
  active: number
}

export interface ListCalibrationParams {
  overdue?: boolean
  status?: string
}

// ---------------------------------------------------------------------------
// Calibration API functions
// ---------------------------------------------------------------------------

/** List calibration records with optional filters */
export async function listCalibrationRecords(params: ListCalibrationParams = {}): Promise<CalibrationRecord[]> {
  const { data } = await axios.get<CalibrationRecord[]>(CALIBRATION_BASE, { params })
  return data
}

/** Create a new calibration record */
export async function createCalibrationRecord(body: CalibrationCreate): Promise<CalibrationRecord> {
  const { data } = await axios.post<CalibrationRecord>(CALIBRATION_BASE, body)
  return data
}

/** Get a single calibration record by ID */
export async function getCalibrationRecord(id: string): Promise<CalibrationRecord> {
  const { data } = await axios.get<CalibrationRecord>(`${CALIBRATION_BASE}/${id}`)
  return data
}

/** Update calibration record fields */
export async function updateCalibrationRecord(id: string, body: CalibrationUpdate): Promise<CalibrationRecord> {
  const { data } = await axios.patch<CalibrationRecord>(`${CALIBRATION_BASE}/${id}`, body)
  return data
}

/** Record a calibration event */
export async function recordCalibration(id: string, body: CalibrateRequest): Promise<CalibrationRecord> {
  const { data } = await axios.post<CalibrationRecord>(`${CALIBRATION_BASE}/${id}/calibrate`, body)
  return data
}

/** Get calibration dashboard statistics */
export async function getCalibrationStats(): Promise<CalibrationStats> {
  const { data } = await axios.get<CalibrationStats>(`${CALIBRATION_BASE}/stats`)
  return data
}

// ---------------------------------------------------------------------------
// Calibration (legacy stub - kept for backwards compatibility)
// ---------------------------------------------------------------------------

export interface CalibrationStub {
  instruments: unknown[]
  upcoming_calibrations: unknown[]
}

/** @deprecated Use listCalibrationRecords() instead */
export async function getCalibration(): Promise<CalibrationStub> {
  const { data } = await axios.get<CalibrationStub>(CALIBRATION_BASE)
  return data
}
