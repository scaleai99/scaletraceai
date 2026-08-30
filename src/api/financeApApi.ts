/**
 * financeApApi.ts - API calls for Finance AP / Payables (Module 24)
 *
 * Covers supplier invoices with three-way matching and AP ageing summary.
 */

import { apiClient } from './axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupplierInvoice {
  id: string
  internal_number: string
  supplier_inv_number: string
  supplier_id?: string
  po_id?: string
  grn_id?: string
  invoice_date?: string
  due_date?: string
  taxable_value: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  paid_amount: number
  outstanding_amount: number
  status: string
  three_way_match_status?: string
  match_details?: object
  created_at: string
}

export interface SupplierInvoiceCreate {
  supplier_inv_number: string
  supplier_id?: string
  po_id?: string
  grn_id?: string
  invoice_date?: string
  due_date?: string
  taxable_value?: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  total_amount: number
  notes?: string
  line_items?: Array<{
    item_code: string
    qty: number
    unit_price: number
    po_qty?: number
    po_price?: number
    grn_qty?: number
  }>
}

export interface APSummary {
  total_outstanding: number
  overdue_amount: number
  ageing_buckets: {
    '0-30': number
    '31-60': number
    '61-90': number
    '90+': number
  }
}

export interface APListParams {
  status?: string
  supplier_id?: string
  po_id?: string
  skip?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// Supplier Invoices
// ---------------------------------------------------------------------------

export const listSupplierInvoices = (params?: APListParams) =>
  apiClient
    .get<SupplierInvoice[]>('/api/v1/finance/supplier-invoices', { params })
    .then((r) => r.data)

export const createSupplierInvoice = (data: SupplierInvoiceCreate) =>
  apiClient
    .post<SupplierInvoice>('/api/v1/finance/supplier-invoices', data)
    .then((r) => r.data)

export const getSupplierInvoice = (id: string) =>
  apiClient
    .get<SupplierInvoice>(`/api/v1/finance/supplier-invoices/${id}`)
    .then((r) => r.data)

export const updateSupplierInvoice = (id: string, data: Partial<SupplierInvoiceCreate>) =>
  apiClient
    .patch<SupplierInvoice>(`/api/v1/finance/supplier-invoices/${id}`, data)
    .then((r) => r.data)

export const approveSupplierInvoice = (id: string) =>
  apiClient
    .post<SupplierInvoice>(`/api/v1/finance/supplier-invoices/${id}/approve`)
    .then((r) => r.data)

export const transitionSupplierInvoice = (
  id: string,
  target_status: string,
  payment_amount?: number
) =>
  apiClient
    .post<SupplierInvoice>(`/api/v1/finance/supplier-invoices/${id}/transition`, {
      target_status,
      payment_amount,
    })
    .then((r) => r.data)

// ---------------------------------------------------------------------------
// AP Summary
// ---------------------------------------------------------------------------

export const getAPSummary = () =>
  apiClient.get<APSummary>('/api/v1/finance/ap-summary').then((r) => r.data)
