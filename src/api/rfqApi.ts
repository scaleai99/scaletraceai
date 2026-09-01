/**
 * RFQ API client - Module 04.
 *
 * All functions call the backend via apiClient. Assumes a Vite proxy
 * or the backend is accessible at /api/v1/rfqs.
 */

import { apiClient } from './axiosClient'

const BASE = '/api/v1/rfqs'
const CUSTOMERS_BASE = '/api/v1/customers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RFQLineItem {
  id: string
  rfq_id: string
  line_number: number
  part_number: string | null
  item_id: string | null
  part_description: string | null
  drawing_number: string | null
  drawing_revision: string | null
  annual_quantity: number | null
  batch_quantity: number | null
  delivery_schedule: string | null
  material_spec: string | null
  manufacturing_route: unknown
  special_processes: string[] | null
  surface_treatment_spec: string | null
  masking_requirements: string | null
  coating_thickness: string | null
  finish_colour: string | null
  testing_requirements: string | null
  inspection_requirements: string | null
  fai_required: boolean
  source_inspection: boolean
  quality_clauses: string | null
  coc_required: boolean
  drawing_pdf_path: string | null
  ai_extraction_id: string | null
  created_at: string
}

export interface RFQ {
  id: string
  rfq_number: string
  customer_id: string
  customer_name: string | null
  customer_site_id: string | null
  contact_name: string | null
  received_date: string
  quotation_due_date: string
  priority: 'High' | 'Medium' | 'Low'
  owner_id: string | null
  status: string
  created_at: string
  updated_at: string | null
  line_items: RFQLineItem[]
}

export interface RFQCreate {
  customer_id: string
  customer_site_id?: string | null
  contact_name?: string | null
  received_date: string   // ISO date string YYYY-MM-DD
  quotation_due_date: string
  priority: 'High' | 'Medium' | 'Low'
  owner_id?: string | null
}

export interface RFQUpdate {
  received_date?: string
  quotation_due_date?: string
  priority?: 'High' | 'Medium' | 'Low'
  contact_name?: string
}

export interface RFQLineItemCreate {
  item_id?: string | null
  part_number?: string
  part_description?: string
  drawing_number?: string
  drawing_revision?: string
  annual_quantity?: number
  batch_quantity?: number
  delivery_schedule?: string
  material_spec?: string
  special_processes?: string[]
  fai_required?: boolean
  source_inspection?: boolean
  quality_clauses?: string
  coc_required?: boolean
}

export interface RFQLineItemUpdate extends Partial<RFQLineItemCreate> {
  surface_treatment_spec?: string
  masking_requirements?: string
  coating_thickness?: string
  finish_colour?: string
  testing_requirements?: string
  inspection_requirements?: string
}

export interface TransitionRequest {
  target_state: string
  comment?: string | null
}

export interface DrawingUploadResponse {
  line_item_id: string
  drawing_pdf_path: string
  ai_extraction_id: string | null
  extraction_status: 'pending' | 'processing' | 'complete' | 'failed'
  message: string
}

export interface CustomerOption {
  id: string
  customer_code: string
  customer_name: string
  status: string
}

// ---------------------------------------------------------------------------
// List filters
// ---------------------------------------------------------------------------

export interface ListRFQsParams {
  customer_id?: string
  status?: string
  priority?: string
  search?: string
  skip?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** List RFQs with optional filters */
export async function listRFQs(params: ListRFQsParams = {}): Promise<RFQ[]> {
  const { data } = await apiClient.get<RFQ[]>(BASE, { params })
  return data
}

/** Get a single RFQ by ID with line items */
export async function getRFQ(id: string): Promise<RFQ> {
  const { data } = await apiClient.get<RFQ>(`${BASE}/${id}`)
  return data
}

/** Create a new RFQ */
export async function createRFQ(body: RFQCreate): Promise<RFQ> {
  const { data } = await apiClient.post<RFQ>(`${BASE}/`, body)
  return data
}

/** Update RFQ header fields */
export async function updateRFQ(id: string, body: RFQUpdate): Promise<RFQ> {
  const { data } = await apiClient.patch<RFQ>(`${BASE}/${id}`, body)
  return data
}

/** Transition RFQ state */
export async function transitionRFQ(id: string, body: TransitionRequest): Promise<RFQ> {
  const { data } = await apiClient.post<RFQ>(`${BASE}/${id}/transition`, body)
  return data
}

/** Add a line item to an RFQ */
export async function addLineItem(rfqId: string, body: RFQLineItemCreate): Promise<RFQLineItem> {
  const { data } = await apiClient.post<RFQLineItem>(`${BASE}/${rfqId}/line-items`, body)
  return data
}

/** Update a line item */
export async function updateLineItem(
  rfqId: string,
  lid: string,
  body: RFQLineItemUpdate
): Promise<RFQLineItem> {
  const { data } = await apiClient.patch<RFQLineItem>(`${BASE}/${rfqId}/line-items/${lid}`, body)
  return data
}

/** Delete a line item */
export async function deleteLineItem(rfqId: string, lid: string): Promise<void> {
  await apiClient.delete(`${BASE}/${rfqId}/line-items/${lid}`)
}

/** Upload a drawing PDF for a line item */
export async function uploadDrawing(
  rfqId: string,
  lid: string,
  file: File
): Promise<DrawingUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<DrawingUploadResponse>(
    `${BASE}/${rfqId}/line-items/${lid}/upload-drawing`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

/** List active customers for selector dropdowns */
export async function listActiveCustomers(): Promise<CustomerOption[]> {
  const { data } = await apiClient.get<CustomerOption[]>(CUSTOMERS_BASE, {
    params: { status: 'Active', limit: 200 },
  })
  return data
}
