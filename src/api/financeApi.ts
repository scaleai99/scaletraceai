/**
 * financeApi.ts - API calls for Finance (Module 24)
 */

import { apiClient } from './axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Invoice {
  id: string
  inv_number: string
  dc_id: string | null
  customer_id: string
  invoice_date: string
  due_date: string
  taxable_value: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  paid_amount: number
  outstanding_amount: number
  status: string
  created_at: string
}

export interface ARSummary {
  total_outstanding: number
  overdue_amount: number
  ageing_buckets: {
    '0-30': number
    '31-60': number
    '61-90': number
    '90+': number
  }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const listInvoices = (params?: Record<string, unknown>) =>
  apiClient.get<Invoice[]>('/api/v1/finance/invoices', { params }).then((r) => Array.isArray(r.data) ? r.data : [])

export const getInvoice = (id: string) =>
  apiClient.get<Invoice>(`/api/v1/finance/invoices/${id}`).then((r) => r.data)

export const createInvoice = (data: Partial<Invoice>) =>
  apiClient.post<Invoice>('/api/v1/finance/invoices', data).then((r) => r.data)

export const transitionInvoice = (
  id: string,
  target_status: string,
  payment_amount?: number
) =>
  apiClient
    .post<Invoice>(`/api/v1/finance/invoices/${id}/transition`, { target_status, payment_amount })
    .then((r) => r.data)

// ---------------------------------------------------------------------------
// AR Summary
// ---------------------------------------------------------------------------

export const getARSummary = () =>
  apiClient.get<ARSummary>('/api/v1/finance/ar-summary').then((r) => r.data)
