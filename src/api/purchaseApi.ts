/**
 * purchaseApi.ts - API calls for Purchase (Module 17) and Inventory/Stores (Module 18)
 */

import { apiClient } from './axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PurchaseRequisition {
  id: string
  pr_number: string
  pr_date: string
  item_code: string | null
  description: string | null
  quantity: number | null
  uom: string | null
  required_date: string | null
  priority: string
  status: string
  created_at: string
}

export interface POLineItem {
  id: string
  line_number: number
  item_code: string | null
  description: string | null
  quantity: number | null
  unit_price: number | null
  gst_rate: number | null
  hsn_code: string | null
  delivery_date: string | null
  received_qty: number
}

export interface PurchaseOrder {
  id: string
  po_number: string
  po_date: string
  supplier_id: string
  total_value: number | null
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  status: string
  line_items: POLineItem[]
  created_at: string
}

export interface GRN {
  id: string
  grn_number: string
  po_id: string
  receipt_date: string
  inspection_status: string
  heat_cert_number: string | null
  created_at: string
}

export interface InventoryItem {
  id: string
  item_code: string
  description: string | null
  category: string | null
  qty_on_hand: number
  reorder_level: number | null
  bin_location: string | null
  valuation_method: string
  at_reorder?: boolean
}

export interface StockLot {
  id: string
  item_code: string
  lot_number: string
  quantity: number
  qty_remaining: number
  receipt_date: string
  expiry_date: string | null
  status: string
}

// ---------------------------------------------------------------------------
// Purchase Requisitions
// ---------------------------------------------------------------------------

export const listPRs = (params?: Record<string, unknown>) =>
  apiClient.get<PurchaseRequisition[]>('/api/v1/purchase/requisitions', { params }).then((r) => Array.isArray(r.data) ? r.data : [])

export const createPR = (data: Partial<PurchaseRequisition>) =>
  apiClient.post<PurchaseRequisition>('/api/v1/purchase/requisitions', data).then((r) => r.data)

// ---------------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------------

export const listPOs = (params?: Record<string, unknown>) =>
  apiClient.get<PurchaseOrder[]>('/api/v1/purchase/orders', { params }).then((r) => Array.isArray(r.data) ? r.data : [])

export const getPO = (id: string) =>
  apiClient.get<PurchaseOrder>(`/api/v1/purchase/orders/${id}`).then((r) => r.data)

export const createPO = (data: Partial<PurchaseOrder>) =>
  apiClient.post<PurchaseOrder>('/api/v1/purchase/orders', data).then((r) => r.data)

export const receivePO = (id: string, data: { receipt_date: string; heat_cert_number?: string }) =>
  apiClient.post<GRN>(`/api/v1/purchase/orders/${id}/receive`, data).then((r) => r.data)

// ---------------------------------------------------------------------------
// GRNs
// ---------------------------------------------------------------------------

export const listGRNs = () =>
  apiClient.get<GRN[]>('/api/v1/purchase/grns').then((r) => Array.isArray(r.data) ? r.data : [])

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const listInventory = (params?: Record<string, unknown>) =>
  apiClient.get<InventoryItem[]>('/api/v1/inventory', { params }).then((r) => Array.isArray(r.data) ? r.data : [])

export const getItemLots = (itemCode: string) =>
  apiClient.get<StockLot[]>(`/api/v1/inventory/${itemCode}/lots`).then((r) => Array.isArray(r.data) ? r.data : [])

export const adjustStock = (
  itemCode: string,
  data: { quantity: number; reason: string; transaction_type: string }
) => apiClient.post(`/api/v1/inventory/${itemCode}/adjust`, data).then((r) => r.data)
