/**
 * Quotation API client - Module 10.
 * All functions call the backend via axios at /api/v1/quotations.
 */

import axios from 'axios'

const BASE = '/api/v1/quotations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuotationLineItem {
  id: string
  quotation_id: string
  line_number: number
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
  const { data } = await axios.get<Quotation[]>(BASE, { params })
  return data
}

export async function getQuotation(id: string): Promise<Quotation> {
  const { data } = await axios.get<Quotation>(`${BASE}/${id}`)
  return data
}

export async function createQuotation(body: QuotationCreate): Promise<Quotation> {
  const { data } = await axios.post<Quotation>(BASE, body)
  return data
}

export async function updateQuotation(id: string, body: QuotationUpdate): Promise<Quotation> {
  const { data } = await axios.patch<Quotation>(`${BASE}/${id}`, body)
  return data
}

export async function approveQuotation(id: string): Promise<Quotation> {
  const { data } = await axios.post<Quotation>(`${BASE}/${id}/approve`)
  return data
}

export async function sendQuotation(id: string): Promise<Blob> {
  const { data } = await axios.post(`${BASE}/${id}/send`, null, {
    responseType: 'blob',
  })
  return data
}

export async function reviseQuotation(id: string): Promise<Quotation> {
  const { data } = await axios.post<Quotation>(`${BASE}/${id}/revise`)
  return data
}

export async function convertQuotationToCPO(id: string): Promise<ConvertToCPOResponse> {
  const { data } = await axios.post<ConvertToCPOResponse>(`${BASE}/${id}/convert-to-cpo`)
  return data
}
