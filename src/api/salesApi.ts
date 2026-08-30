/**
 * Sales API client - Modules 11 (Customer PO) & 14 (Sales Order).
 * All functions call the backend via apiClient.
 */

import { apiClient } from './axiosClient'

const CPO_BASE = '/api/v1/customer-pos'
const SO_BASE = '/api/v1/sales-orders'

// ---------------------------------------------------------------------------
// Customer PO Types
// ---------------------------------------------------------------------------

export interface DiffReportItem {
  line_number: number | null
  field: string
  quotation_value: string | null
  po_value: string | null
  severity: 'Critical' | 'Major' | 'Minor'
}

export interface CustomerPOLineItem {
  id: string
  customer_po_id: string
  line_number: number
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  quantity: number | null
  agreed_unit_price: number | null
  delivery_date: string | null
  created_at: string
}

export interface CustomerPO {
  id: string
  internal_ref: string
  po_number: string
  po_date: string
  customer_id: string
  customer_site_id: string | null
  quotation_id: string | null
  po_pdf_path: string | null
  payment_terms: number | null
  delivery_terms: string | null
  difference_report: DiffReportItem[] | null
  status: string
  created_at: string
  updated_at: string | null
  line_items: CustomerPOLineItem[]
}

export interface CustomerPOCreate {
  po_number: string
  po_date: string   // YYYY-MM-DD
  customer_id: string
  customer_site_id?: string | null
  quotation_id?: string | null
  payment_terms?: number | null
  delivery_terms?: string | null
  line_items?: Array<{
    part_number?: string | null
    drawing_number?: string | null
    drawing_revision?: string | null
    quantity?: number | null
    agreed_unit_price?: number | null
    delivery_date?: string | null
  }>
}

export interface ConvertToSOResponse {
  message: string
  sales_order_id: string
  so_number: string
}

// ---------------------------------------------------------------------------
// Sales Order Types
// ---------------------------------------------------------------------------

export interface SalesOrderLineItem {
  id: string
  so_id: string
  line_number: number
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  quantity: number | null
  agreed_unit_price: number | null
  delivery_date: string | null
  dispatched_qty: number
  status: string | null
  created_at: string
}

export interface SalesOrder {
  id: string
  so_number: string
  customer_po_id: string
  quotation_id: string | null
  customer_id: string
  config_baseline_id: string | null
  status: string
  cancellation_reason: string | null
  created_at: string
  updated_at: string | null
  line_items: SalesOrderLineItem[]
}

// ---------------------------------------------------------------------------
// Customer PO API
// ---------------------------------------------------------------------------

export async function listCustomerPOs(params: {
  customer_id?: string
  status?: string
  skip?: number
  limit?: number
} = {}): Promise<CustomerPO[]> {
  const { data } = await apiClient.get<CustomerPO[]>(CPO_BASE, { params })
  return Array.isArray(data) ? data : []
}

export async function getCustomerPO(id: string): Promise<CustomerPO> {
  const { data } = await apiClient.get<CustomerPO>(`${CPO_BASE}/${id}`)
  return data
}

export async function createCustomerPO(body: CustomerPOCreate): Promise<CustomerPO> {
  const { data } = await apiClient.post<CustomerPO>(CPO_BASE, body)
  return data
}

export async function transitionCustomerPO(
  id: string,
  target_state: string,
  comment?: string
): Promise<CustomerPO> {
  const { data } = await apiClient.post<CustomerPO>(`${CPO_BASE}/${id}/transition`, {
    target_state,
    comment: comment ?? null,
  })
  return data
}

export async function uploadPODocument(id: string, file: File): Promise<{
  customer_po_id: string
  po_pdf_path: string
  difference_report: DiffReportItem[] | null
  message: string
}> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post(`${CPO_BASE}/${id}/upload-po`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function convertCPOtoSO(id: string): Promise<ConvertToSOResponse> {
  const { data } = await apiClient.post<ConvertToSOResponse>(
    `${CPO_BASE}/${id}/convert-to-so`
  )
  return data
}

// ---------------------------------------------------------------------------
// Sales Order API
// ---------------------------------------------------------------------------

export async function listSalesOrders(params: {
  customer_id?: string
  status?: string
  customer_po_id?: string
  skip?: number
  limit?: number
} = {}): Promise<SalesOrder[]> {
  const { data } = await apiClient.get<SalesOrder[]>(SO_BASE, { params })
  return Array.isArray(data) ? data : []
}

export async function getSalesOrder(id: string): Promise<SalesOrder> {
  const { data } = await apiClient.get<SalesOrder>(`${SO_BASE}/${id}`)
  return data
}

export async function cancelSalesOrder(
  id: string,
  cancellation_reason: string
): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>(`${SO_BASE}/${id}/cancel`, {
    cancellation_reason,
  })
  return data
}

export async function transitionSalesOrder(
  id: string,
  target_state: string,
  comment?: string
): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>(`${SO_BASE}/${id}/transition`, {
    target_state,
    comment: comment ?? null,
  })
  return data
}
