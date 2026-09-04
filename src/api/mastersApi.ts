/**
 * mastersApi.ts - Nine-master data API client -> /api/v1/masters/*
 *
 * Covers the five reference masters that live under the Masters module:
 *   machines     Machine master     (capability drives feasibility 4:1)
 *   methods      Process & method    (std setup + cutting params + tooling)
 *   materials    Material master     (stock, lead time, export control ECCN)
 *   instruments  Measurement master  (resolution, gauge R&R, calibration)
 *   rates        Rates & overheads   (single active record)
 *
 * Each list filters out soft-deleted rows server-side; every write is RBAC'd
 * and audited by the backend. Real data only - no demo fallback.
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/masters'

// ---------------------------------------------------------------- Machines
export interface Machine {
  id: string
  machine_code: string
  machine_name: string | null
  machine_type: string | null
  department: string | null
  axes: string | null
  envelope: string | null
  mhr: number | null
  positional_capability: number | null
  oee: number | null
  is_available: boolean | null
  status?: string | null
}
export type MachineInput = Partial<Omit<Machine, 'id' | 'status'>>

export async function listMachines(): Promise<Machine[]> {
  const { data } = await apiClient.get<Machine[]>(`${BASE}/machines`)
  return data
}
export async function createMachine(body: MachineInput): Promise<Machine> {
  const { data } = await apiClient.post<Machine>(`${BASE}/machines`, body)
  return data
}
export async function updateMachine(id: string, body: MachineInput): Promise<Machine> {
  const { data } = await apiClient.patch<Machine>(`${BASE}/machines/${id}`, body)
  return data
}
export async function deleteMachine(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/machines/${id}`)
}

// ---------------------------------------------------------------- Methods
export interface ProcessMethod {
  id: string
  rate_code: string
  method_name: string | null
  department: string | null
  description: string | null
  std_setup_min: number | null
  cutting_params: string | null
  tooling: string | null
  rate_inr_per_hour: number | null
  status?: string | null
}
export type ProcessMethodInput = Partial<Omit<ProcessMethod, 'id' | 'status'>>

export async function listMethods(): Promise<ProcessMethod[]> {
  const { data } = await apiClient.get<ProcessMethod[]>(`${BASE}/methods`)
  return data
}
export async function createMethod(body: ProcessMethodInput): Promise<ProcessMethod> {
  const { data } = await apiClient.post<ProcessMethod>(`${BASE}/methods`, body)
  return data
}
export async function updateMethod(id: string, body: ProcessMethodInput): Promise<ProcessMethod> {
  const { data } = await apiClient.patch<ProcessMethod>(`${BASE}/methods/${id}`, body)
  return data
}
export async function deleteMethod(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/methods/${id}`)
}

// ---------------------------------------------------------------- Materials
export interface Material {
  id: string
  material_code: string
  material_spec: string | null
  description: string | null
  density_g_cm3: number | null
  unit_price_inr: number | null
  uom: string | null
  on_hand_qty: number | null
  on_order_qty: number | null
  lead_days: number | null
  eccn: string | null
  hsn_code: string | null
  status?: string | null
}
export type MaterialInput = Partial<Omit<Material, 'id' | 'status'>>

export async function listMaterials(): Promise<Material[]> {
  const { data } = await apiClient.get<Material[]>(`${BASE}/materials`)
  return data
}
export async function createMaterial(body: MaterialInput): Promise<Material> {
  const { data } = await apiClient.post<Material>(`${BASE}/materials`, body)
  return data
}
export async function updateMaterial(id: string, body: MaterialInput): Promise<Material> {
  const { data } = await apiClient.patch<Material>(`${BASE}/materials/${id}`, body)
  return data
}
export async function deleteMaterial(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/materials/${id}`)
}

// ---------------------------------------------------------------- Instruments
export interface Instrument {
  id: string
  instrument_code: string
  instrument_name: string | null
  instrument_type: string | null
  resolution: number | null
  gauge_rr_pct: number | null
  next_due_date: string | null
  last_calibrated_date: string | null
  calibration_interval_days: number | null
  location: string | null
  status?: string | null
  computed_overdue?: boolean
  in_cal?: boolean
}
export type InstrumentInput = Partial<Omit<Instrument, 'id' | 'computed_overdue' | 'in_cal'>>

export async function listInstruments(): Promise<Instrument[]> {
  const { data } = await apiClient.get<Instrument[]>(`${BASE}/instruments`)
  return data
}
export async function createInstrument(body: InstrumentInput): Promise<Instrument> {
  const { data } = await apiClient.post<Instrument>(`${BASE}/instruments`, body)
  return data
}
export async function updateInstrument(id: string, body: InstrumentInput): Promise<Instrument> {
  const { data } = await apiClient.patch<Instrument>(`${BASE}/instruments/${id}`, body)
  return data
}
export async function deleteInstrument(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/instruments/${id}`)
}

// ---------------------------------------------------------------- Rates
export interface OverheadRates {
  id: string
  factory_overhead_pct: number | null
  admin_overhead_pct: number | null
  margin_pct: number | null
  freight_packing_pct: number | null
  rejection_allowance_pct: number | null
  bench_labour_rate: number | null
  currency: string | null
  effective_from: string | null
  updated_by: string | null
  updated_at: string | null
}
export type OverheadRatesInput = Partial<
  Omit<OverheadRates, 'id' | 'updated_by' | 'updated_at'>
>

export async function getRates(): Promise<OverheadRates | null> {
  const { data } = await apiClient.get<{ rates: OverheadRates | null }>(`${BASE}/rates`)
  return data.rates
}
export async function putRates(body: OverheadRatesInput): Promise<OverheadRates> {
  const { data } = await apiClient.put<OverheadRates>(`${BASE}/rates`, body)
  return data
}
