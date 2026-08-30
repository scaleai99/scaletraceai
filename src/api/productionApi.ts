/**
 * productionApi.ts - API calls for Production modules (15, 16, 19)
 * Engineering Releases, Production Planning / MPS, Work Orders
 */

import { apiClient } from './axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Machine {
  id: string
  machine_code: string
  machine_name: string
  machine_type: string | null
  mhr: number | null
  shift_hours: number
  is_available: boolean
}

export interface EngineeringRelease {
  id: string
  er_number: string
  so_id: string | null
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  bom: unknown[] | null
  process_route: unknown[] | null
  status: string
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface ProductionOrder {
  id: string
  so_id: string
  er_id: string | null
  part_number: string | null
  planned_qty: number
  planned_start: string | null
  planned_end: string | null
  status: string
  created_at: string
}

export interface MachineLoading {
  machine_id: string
  machine_code: string
  machine_name: string
  week_start: string
  planned_hours: number
  available_hours: number
  utilisation_pct: number
}

export interface WorkOrderOperation {
  id: string
  op_sequence: number
  op_name: string | null
  machine_id: string | null
  planned_cycle_min: number | null
  actual_start: string | null
  actual_end: string | null
  qty_completed: number
  qty_scrapped: number
  is_on_hold: boolean
  status: string
}

export interface WorkOrder {
  id: string
  jc_number: string
  so_id: string | null
  er_id: string | null
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  batch_quantity: number
  status: string
  total_actual_cost: number
  operations: WorkOrderOperation[]
  created_at: string
}

// ---------------------------------------------------------------------------
// Machine Master
// ---------------------------------------------------------------------------

export const listMachines = () =>
  apiClient.get<Machine[]>('/api/v1/engineering-releases/machines').then((r) => r.data)

export const createMachine = (data: Partial<Machine>) =>
  apiClient.post<Machine>('/api/v1/engineering-releases/machines', data).then((r) => r.data)

// ---------------------------------------------------------------------------
// Engineering Releases
// ---------------------------------------------------------------------------

export const listEngineeringReleases = (params?: Record<string, unknown>) =>
  apiClient.get<EngineeringRelease[]>('/api/v1/engineering-releases', { params }).then((r) => r.data)

export const getEngineeringRelease = (id: string) =>
  apiClient.get<EngineeringRelease>(`/api/v1/engineering-releases/${id}`).then((r) => r.data)

export const createEngineeringRelease = (data: Partial<EngineeringRelease>) =>
  apiClient.post<EngineeringRelease>('/api/v1/engineering-releases', data).then((r) => r.data)

export const updateEngineeringRelease = (id: string, data: Partial<EngineeringRelease>) =>
  apiClient.patch<EngineeringRelease>(`/api/v1/engineering-releases/${id}`, data).then((r) => r.data)

export const approveEngineeringRelease = (id: string) =>
  apiClient.post<EngineeringRelease>(`/api/v1/engineering-releases/${id}/approve`).then((r) => r.data)

// ---------------------------------------------------------------------------
// Production Orders / MPS
// ---------------------------------------------------------------------------

export const listProductionOrders = (params?: Record<string, unknown>) =>
  apiClient.get<ProductionOrder[]>('/api/v1/production-orders', { params }).then((r) => r.data)

export const getMachineLoading = () =>
  apiClient.get<MachineLoading[]>('/api/v1/production-orders/machine-loading').then((r) => r.data)

export const getMPS = () =>
  apiClient.get<ProductionOrder[]>('/api/v1/production-orders/mps').then((r) => r.data)

// ---------------------------------------------------------------------------
// Work Orders (MES)
// ---------------------------------------------------------------------------

export const listWorkOrders = (params?: Record<string, unknown>) =>
  apiClient.get<WorkOrder[]>('/api/v1/work-orders', { params }).then((r) => r.data)

export const getWorkOrder = (id: string) =>
  apiClient.get<WorkOrder>(`/api/v1/work-orders/${id}`).then((r) => r.data)

export const startOperation = (
  woId: string,
  opId: string,
  data: { machine_id?: string; operator_id?: string }
) => apiClient.post(`/api/v1/work-orders/${woId}/operations/${opId}/start`, data).then((r) => r.data)

export const completeOperation = (
  woId: string,
  opId: string,
  data: { qty_completed: number; qty_scrapped: number; scrap_reason?: string }
) =>
  apiClient.post(`/api/v1/work-orders/${woId}/operations/${opId}/complete`, data).then((r) => r.data)

export const holdWorkOrder = (id: string, reason: string) =>
  apiClient.post(`/api/v1/work-orders/${id}/hold`, { hold_reason: reason }).then((r) => r.data)

export const releaseHold = (id: string) =>
  apiClient.post(`/api/v1/work-orders/${id}/release-hold`).then((r) => r.data)

export const getJobCardPDF = (id: string) =>
  apiClient
    .get(`/api/v1/work-orders/${id}/job-card-pdf`, { responseType: 'blob' })
    .then((r) => r.data)
