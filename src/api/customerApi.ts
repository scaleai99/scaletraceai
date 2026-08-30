/**
 * customerApi.ts - Axios API client for Module 02: Customer Master.
 *
 * All functions target /api/v1/customers/* and return typed responses.
 * Axios is configured with the base URL from the Vite proxy (see vite.config.ts).
 */

import { apiClient } from './axiosClient'

const BASE = '/api/v1/customers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerSite {
  id: string
  customer_id: string
  site_name: string | null
  address: string | null
  gstin: string | null
  contact_name: string | null
  contact_email: string | null
  created_at: string | null
}

export interface CustomerQualityRequirement {
  id: string
  customer_id: string
  specifications: string[] | null
  certifications: string[] | null
  fai_requirement: string | null
  source_inspection: boolean
  coc_required: boolean
  record_retention_years: number
}

export interface CustomerDocument {
  id: string
  customer_id: string
  document_type: string | null
  file_name: string | null
  file_path: string | null
  file_size_bytes: number | null
  uploaded_by: string | null
  uploaded_at: string | null
}

export interface Customer {
  id: string
  customer_code: string
  customer_name: string
  short_name: string | null
  customer_type: string | null

  // GST
  gstin: string | null
  registered_address: string | null
  state_code: string | null

  // Registration
  pan: string | null
  tan: string | null
  cin: string | null
  iec_code: string | null
  duns_number: string | null
  customer_since: string | null
  parent_customer_id: string | null
  website: string | null

  // Contact
  contact_name: string | null
  contact_email: string | null
  contact_mobile: string | null

  // Classification
  customer_tier: string | null
  industry: string | null

  // Business Information
  business_nature: string | null
  supply_type: string | null
  payment_terms_text: string | null
  incoterms: string | null
  min_order_value: number | null
  annual_turnover: number | null
  preferred_currency: string | null

  // Legacy commercial
  payment_terms: number | null
  delivery_terms: string | null
  credit_limit: number | null
  currency: string

  // Billing Address
  billing_address_line1: string | null
  billing_address_line2: string | null
  billing_city: string | null
  billing_state: string | null
  billing_country: string | null
  billing_pin: string | null

  // Shipping Address
  shipping_same_as_billing: boolean
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_country: string | null
  shipping_pin: string | null

  // Banking Information
  bank_name: string | null
  bank_branch: string | null
  bank_account_number: string | null
  bank_account_type: string | null
  bank_ifsc_code: string | null
  bank_micr_code: string | null
  bank_upi_id: string | null

  // Quality & Compliance
  qa_approval_status: string | null
  as9100_requirement: boolean
  nadcap_requirement: boolean
  flow_down_required: boolean
  customer_approval_number: string | null
  approval_date: string | null
  approval_valid_upto: string | null

  // Ratings
  quality_rating: number | null
  delivery_rating: number | null
  service_rating: number | null
  overall_rating: number | null
  rating_date: string | null
  rating_remarks: string | null

  // Workflow
  status: string
  approved_by: string | null
  approved_at: string | null
  created_at: string | null
  updated_at: string | null

  // Detail fields - populated by GET /{id}
  sites?: CustomerSite[]
  quality_requirements?: CustomerQualityRequirement | null
}

export interface CustomerCreatePayload {
  customer_code: string
  customer_name: string
  short_name?: string
  customer_type?: string

  gstin?: string
  registered_address?: string
  state_code?: string

  pan?: string
  tan?: string
  cin?: string
  iec_code?: string
  duns_number?: string
  customer_since?: string
  parent_customer_id?: string
  website?: string

  contact_name?: string
  contact_email?: string
  contact_mobile?: string

  customer_tier?: string
  industry?: string

  business_nature?: string
  supply_type?: string
  payment_terms_text?: string
  incoterms?: string
  min_order_value?: number
  annual_turnover?: number
  preferred_currency?: string

  payment_terms?: number
  delivery_terms?: string
  credit_limit?: number
  currency?: string

  billing_address_line1?: string
  billing_address_line2?: string
  billing_city?: string
  billing_state?: string
  billing_country?: string
  billing_pin?: string

  shipping_same_as_billing?: boolean
  shipping_address_line1?: string
  shipping_address_line2?: string
  shipping_city?: string
  shipping_state?: string
  shipping_country?: string
  shipping_pin?: string

  bank_name?: string
  bank_branch?: string
  bank_account_number?: string
  bank_account_type?: string
  bank_ifsc_code?: string
  bank_micr_code?: string
  bank_upi_id?: string

  qa_approval_status?: string
  as9100_requirement?: boolean
  nadcap_requirement?: boolean
  flow_down_required?: boolean
  customer_approval_number?: string
  approval_date?: string
  approval_valid_upto?: string

  quality_rating?: number
  delivery_rating?: number
  service_rating?: number
  overall_rating?: number
  rating_date?: string
  rating_remarks?: string
}

export type CustomerUpdatePayload = Partial<Omit<CustomerCreatePayload, 'customer_code'>>

export interface CustomerListParams {
  search?: string
  status?: string
  tier?: string
  skip?: number
  limit?: number
}

export interface CustomerPerformance {
  total_orders_count: number
  total_orders_value_inr: number
  open_orders_count: number
  avg_payment_days: number
  quality_holds_count: number
  ncr_count: number
}

export interface CustomerSiteCreatePayload {
  site_name: string
  address?: string
  gstin?: string
  contact_name?: string
  contact_email?: string
}

export interface CustomerQualityRequirementPayload {
  specifications?: string[]
  certifications?: string[]
  fai_requirement?: string
  source_inspection?: boolean
  coc_required?: boolean
  record_retention_years?: number
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * List customers with optional search/filter/pagination params.
 */
export async function listCustomers(params: CustomerListParams = {}): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>(BASE, { params })
  return Array.isArray(data) ? data : []
}

/**
 * Get a single customer with sites and quality_requirements eager-loaded.
 */
export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`${BASE}/${id}`)
  return data
}

/**
 * Create a new customer in Draft status.
 */
export async function createCustomer(payload: CustomerCreatePayload): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(`${BASE}/`, payload)
  return data
}

/**
 * Partially update customer fields (PATCH).
 */
export async function updateCustomer(id: string, payload: CustomerUpdatePayload): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`${BASE}/${id}`, payload)
  return data
}

/**
 * Approve a customer (Quality_Manager / Administrator only).
 * Transitions status: Draft -> Active.
 */
export async function approveCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(`${BASE}/${id}/approve`)
  return data
}

/**
 * Deactivate a customer.
 * Transitions status to Inactive.
 */
export async function deactivateCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(`${BASE}/${id}/deactivate`)
  return data
}

/**
 * Soft-delete a customer (sets status to Deleted).
 */
export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

/**
 * Delete a customer site.
 */
export async function deleteCustomerSite(customerId: string, siteId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${customerId}/sites/${siteId}`)
}

/**
 * List all sites for a customer.
 */
export async function listCustomerSites(customerId: string): Promise<CustomerSite[]> {
  const { data } = await apiClient.get<CustomerSite[]>(`${BASE}/${customerId}/sites`)
  return Array.isArray(data) ? data : []
}

/**
 * Add a new site to a customer.
 */
export async function addCustomerSite(customerId: string, payload: CustomerSiteCreatePayload): Promise<CustomerSite> {
  const { data } = await apiClient.post<CustomerSite>(`${BASE}/${customerId}/sites`, payload)
  return data
}

/**
 * Get quality requirements for a customer.
 */
export interface CustomerContact {
  id: string
  customer_id: string
  name: string | null
  designation: string | null
  email: string | null
  phone: string | null
  is_primary: boolean | null
  created_at: string | null
}

export interface CustomerContactCreatePayload {
  name: string
  designation?: string
  email?: string
  phone?: string
  is_primary?: boolean
}

export async function listCustomerContacts(customerId: string): Promise<CustomerContact[]> {
  const { data } = await apiClient.get<CustomerContact[]>(`${BASE}/${customerId}/contacts`)
  return Array.isArray(data) ? data : []
}

export async function addCustomerContact(customerId: string, payload: CustomerContactCreatePayload): Promise<CustomerContact> {
  const { data } = await apiClient.post<CustomerContact>(`${BASE}/${customerId}/contacts`, payload)
  return data
}

export async function deleteCustomerContact(customerId: string, contactId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${customerId}/contacts/${contactId}`)
}

export async function getCustomerQualityRequirements(customerId: string): Promise<CustomerQualityRequirement | null> {
  const { data } = await apiClient.get<CustomerQualityRequirement | null>(`${BASE}/${customerId}/quality-requirements`)
  return data
}

/**
 * Upsert (create or replace) quality requirements for a customer.
 */
export async function upsertCustomerQualityRequirements(
  customerId: string,
  payload: CustomerQualityRequirementPayload,
): Promise<CustomerQualityRequirement> {
  const { data } = await apiClient.put<CustomerQualityRequirement>(`${BASE}/${customerId}/quality-requirements`, payload)
  return data
}

/**
 * Upload a supporting document to a customer record (multipart form).
 */
export async function uploadCustomerDocument(
  customerId: string,
  file: File,
  documentType: string,
): Promise<CustomerDocument> {
  const form = new FormData()
  form.append('file', file)
  form.append('document_type', documentType)
  const { data } = await apiClient.post<CustomerDocument>(`${BASE}/${customerId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Get the performance summary for a customer.
 * Returns zeroes until later modules are wired.
 */
export async function getCustomerPerformance(id: string): Promise<CustomerPerformance> {
  const { data } = await apiClient.get<CustomerPerformance>(`${BASE}/${id}/performance`)
  return data
}
