/**
 * manufacturingApi.ts - Module 19: Work Orders / MES API client
 */

import axiosClient from './axiosClient'

export interface WorkOrder {
  id: string
  wo_number: string
  sales_order_ref?: string
  part_number: string
  description: string
  quantity: number
  completed_qty?: number
  rejected_qty?: number
  status: 'planned' | 'released' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  planned_start_date: string
  planned_end_date: string
  actual_start_date?: string
  actual_end_date?: string
  customer_name?: string
  operations?: WorkOrderOperation[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface WorkOrderOperation {
  id: string
  sequence: number
  operation_code: string
  operation_name: string
  work_center: string
  planned_qty: number
  completed_qty?: number
  rejected_qty?: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  planned_start?: string
  planned_end?: string
  actual_start?: string
  actual_end?: string
  operator?: string
  setup_time_hrs?: number
  run_time_hrs?: number
  notes?: string
}

export interface WorkOrderListParams {
  page?: number
  page_size?: number
  status?: string
  priority?: string
  search?: string
  from_date?: string
  to_date?: string
  overdue?: boolean
}

export interface OperationCompletePayload {
  completed_qty: number
  rejected_qty?: number
  notes?: string
  actual_end?: string
}

export interface HoldPayload {
  reason: string
  notes?: string
}

/** GET /api/v1/work-orders */
export async function getWorkOrders(
  params?: WorkOrderListParams
): Promise<{ items: WorkOrder[]; total: number }> {
  const res = await axiosClient.get('/work-orders', { params })
  return res.data
}

/** GET /api/v1/work-orders/{id} */
export async function getWorkOrder(id: string): Promise<WorkOrder> {
  const res = await axiosClient.get(`/work-orders/${id}`)
  return res.data
}

/** POST /api/v1/work-orders/{id}/operations/{opId}/start */
export async function startOperation(woId: string, opId: string): Promise<WorkOrderOperation> {
  const res = await axiosClient.post(`/work-orders/${woId}/operations/${opId}/start`)
  return res.data
}

/** POST /api/v1/work-orders/{id}/operations/{opId}/complete */
export async function completeOperation(
  woId: string,
  opId: string,
  data: OperationCompletePayload
): Promise<WorkOrderOperation> {
  const res = await axiosClient.post(`/work-orders/${woId}/operations/${opId}/complete`, data)
  return res.data
}

/** POST /api/v1/work-orders/{id}/hold */
export async function holdWorkOrder(id: string, reason: string): Promise<WorkOrder> {
  const payload: HoldPayload = { reason }
  const res = await axiosClient.post(`/work-orders/${id}/hold`, payload)
  return res.data
}

/** POST /api/v1/work-orders/{id}/release */
export async function releaseWorkOrder(id: string): Promise<WorkOrder> {
  const res = await axiosClient.post(`/work-orders/${id}/release`)
  return res.data
}

/** POST /api/v1/work-orders/{id}/complete */
export async function completeWorkOrder(id: string): Promise<WorkOrder> {
  const res = await axiosClient.post(`/work-orders/${id}/complete`)
  return res.data
}

/** PATCH /api/v1/work-orders/{id} */
export async function updateWorkOrder(
  id: string,
  data: Partial<WorkOrder>
): Promise<WorkOrder> {
  const res = await axiosClient.patch(`/work-orders/${id}`, data)
  return res.data
}
