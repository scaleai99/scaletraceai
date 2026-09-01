/**
 * Quotation API client - Module 10.
 * All functions call the backend via axios at /api/v1/quotations.
 */

import { apiClient } from './axiosClient'

const BASE = '/api/v1/quotations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuotationLineItem {
  id: string
  quotation_id: string
  line_number: number
  item_id: string | null
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  quantity: number | null
  unit_price: number | null
  total_price: number | null
  costing_sheet_id: string | null
  created_at: string
}

export interface Quotation {
  id: string
  quotation_number: string
  rfq_id: string | null
  customer_id: string
  customer_name: string | null
  required_approval_level: string | null
  margin_pct: number | null
  revision: number
  parent_id: string | null
  validity_date: string | null
  delivery_lead_days: number | null
  payment_terms: number | null
  total_value: number | null
  status: string
  approved_by: string | null
  approved_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string | null
  line_items: QuotationLineItem[]
}

export interface QuotationLineItemCreate {
  item_id?: string | null
  part_number?: string | null
  drawing_number?: string | null
  drawing_revision?: string | null
  quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
  costing_sheet_id?: string | null
}

export interface QuotationCreate {
  rfq_id?: string | null
  customer_id: string
  validity_date?: string | null   // YYYY-MM-DD
  delivery_lead_days?: number | null
  payment_terms?: number | null
  line_items?: QuotationLineItemCreate[]
}

export interface QuotationUpdate {
  validity_date?: string | null
  delivery_lead_days?: number | null
  payment_terms?: number | null
}

export interface ConvertToCPOResponse {
  message: string
  customer_po_id: string
  internal_ref: string
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function listQuotations(params: {
  customer_id?: string
  rfq_id?: string
  status?: string
  skip?: number
  limit?: number
} = {}): Promise<Quotation[]> {
  const { data } = await apiClient.get<Quotation[]>(BASE, { params })
  return data
}

export async function getQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.get<Quotation>(`${BASE}/${id}`)
  return data
}

export async function createQuotation(body: QuotationCreate): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`${BASE}/`, body)
  return data
}

export async function updateQuotation(id: string, body: QuotationUpdate): Promise<Quotation> {
  const { data } = await apiClient.patch<Quotation>(`${BASE}/${id}`, body)
  return data
}

export async function approveQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`${BASE}/${id}/approve`)
  return data
}

export async function sendQuotation(id: string): Promise<Blob> {
  const { data } = await apiClient.post(`${BASE}/${id}/send`, null, {
    responseType: 'blob',
  })
  return data
}

export async function reviseQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`${BASE}/${id}/revise`)
  return data
}

export async function convertQuotationToCPO(id: string): Promise<ConvertToCPOResponse> {
  const { data } = await apiClient.post<ConvertToCPOResponse>(`${BASE}/${id}/convert-to-cpo`)
  return data
}

export async function submitQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`${BASE}/${id}/submit`)
  return data
}

export async function addQuotationLineItem(id: string, body: QuotationLineItemCreate): Promise<Quotation> {
  const { data } = await apiClient.post<Quotation>(`${BASE}/${id}/line-items`, body)
  return data
}

export async function updateQuotationLineItem(id: string, lineId: string, body: QuotationLineItemCreate): Promise<Quotation> {
  const { data } = await apiClient.patch<Quotation>(`${BASE}/${id}/line-items/${lineId}`, body)
  return data
}

export async function deleteQuotationLineItem(id: string, lineId: string): Promise<Quotation> {
  const { data } = await apiClient.delete<Quotation>(`${BASE}/${id}/line-items/${lineId}`)
  return data
}
