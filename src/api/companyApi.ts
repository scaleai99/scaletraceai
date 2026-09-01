/**
 * companyApi.ts - Axios API client for Module 01: Company Master.
 *
 * Covers: companies, plants, public holidays, GSTIN lookup, company documents.
 *
 * Requirements: 1.1, 1.2, 1.4, 1.7, 2.3, 33.3
 */

import { apiClient } from './axiosClient'

const BASE = '/api/v1/company'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Company {
  id: string
  company_code: string
  legal_name: string
  trade_name: string | null
  short_name?: string | null
  company_type: string
  cin_number: string | null
  incorporation_date: string | null
  industry: string
  business_type: string
  base_currency: string
  country: string
  timezone: string
  status: string
  created_at: string | null
  updated_at: string | null
  plants?: Plant[]
  // Registration / Statutory
  pan?: string | null
  gstin?: string | null
  tan?: string | null
  iec_code?: string | null
  msme_registration?: string | null
  pf_number?: string | null
  esi_number?: string | null
  factory_licence_number?: string | null
  profession_tax_no?: string | null
  // GSTIN-registry-sourced (populated by GSTIN lookup, not user-typed)
  gst_status?: string | null
  gst_taxpayer_type?: string | null
  // Contact Details
  phone?: string | null
  mobile_no?: string | null
  landline_no?: string | null
  email?: string | null
  alternate_email?: string | null
  fax_no?: string | null
  website?: string | null
  // Registered address
  registered_address?: string | null
  registered_address_line1?: string | null
  registered_address_line2?: string | null
  registered_city?: string | null
  registered_state?: string | null
  registered_country?: string | null
  registered_pin?: string | null
  // Corporate address
  corporate_address?: string | null
  corporate_same_as_registered?: boolean | null
  corporate_address_line1?: string | null
  corporate_address_line2?: string | null
  corporate_city?: string | null
  corporate_state?: string | null
  corporate_country?: string | null
  corporate_pin?: string | null
  // Legacy flat address
  pin_code?: string | null
  state_code?: string | null
  city?: string | null
  // Banking
  bank_name?: string | null
  bank_branch?: string | null
  bank_account_number?: string | null
  bank_ifsc_code?: string | null
  bank_account_type?: string | null
  bank_micr_code?: string | null
  bank_upi_id?: string | null
  // Factory / Approvals
  factory_licence_valid_upto?: string | null
  factory_licence_date?: string | null
  factory_licence_issuing_authority?: string | null
  kspcb_consent_number?: string | null
  kspcb_consent_valid_upto?: string | null
  // Certifications
  as9100_cert_number?: string | null
  as9100_cert_valid_upto?: string | null
  nadcap_cert_number?: string | null
  nadcap_cert_valid_upto?: string | null
  // Financial config
  financial_year_start?: string | null
  cost_method?: string | null
  rounding_decimal_places?: number | null
  tds_applicable?: string | null
  tcs_applicable?: string | null
  accounting_standard?: string | null
  audit_required?: string | null
  rounding_off_level?: string | null
  // Audit & Notes
  notes?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_by_name?: string | null
  updated_by_name?: string | null
  logo_file_path?: string | null
}

export interface CompanyCreatePayload {
  company_code: string
  legal_name: string
  trade_name?: string
  short_name?: string
  company_type: string
  cin_number?: string
  incorporation_date?: string
  industry: string
  business_type: string
  base_currency?: string
  country?: string
  timezone?: string
  pan?: string
  gstin?: string
  tan?: string
  iec_code?: string
  msme_registration?: string
  pf_number?: string
  esi_number?: string
  factory_licence_number?: string
  profession_tax_no?: string
  gst_status?: string
  gst_taxpayer_type?: string
  phone?: string
  mobile_no?: string
  landline_no?: string
  email?: string
  alternate_email?: string
  fax_no?: string
  website?: string
  registered_address?: string
  registered_address_line1?: string
  registered_address_line2?: string
  registered_city?: string
  registered_state?: string
  registered_country?: string
  registered_pin?: string
  corporate_address?: string
  corporate_same_as_registered?: boolean
  corporate_address_line1?: string
  corporate_address_line2?: string
  corporate_city?: string
  corporate_state?: string
  corporate_country?: string
  corporate_pin?: string
  pin_code?: string
  state_code?: string
  city?: string
  bank_name?: string
  bank_branch?: string
  bank_account_number?: string
  bank_ifsc_code?: string
  bank_account_type?: string
  bank_micr_code?: string
  bank_upi_id?: string
  factory_licence_date?: string
  factory_licence_valid_upto?: string
  factory_licence_issuing_authority?: string
  kspcb_consent_number?: string
  kspcb_consent_valid_upto?: string
  as9100_cert_number?: string
  as9100_cert_valid_upto?: string
  nadcap_cert_number?: string
  nadcap_cert_valid_upto?: string
  financial_year_start?: string
  cost_method?: string
  rounding_decimal_places?: number
  tds_applicable?: string
  tcs_applicable?: string
  accounting_standard?: string
  audit_required?: string
  rounding_off_level?: string
  notes?: string
}

export interface CompanyUpdatePayload extends Partial<Omit<CompanyCreatePayload, 'company_code'>> {
  notes?: string
}

export interface Plant {
  id: string
  company_id: string
  plant_code: string
  plant_name: string
  address?: string | null
  city?: string | null
  state?: string | null
  pin_code?: string | null
  gstin?: string | null
  plant_type?: string | null
  cost_centre?: string | null
  shift_hours?: number | null
  working_days_per_week?: number | null
  machine_count?: number | null
  status?: string | null
  created_at: string | null
}

export interface PlantCreatePayload {
  plant_code: string
  plant_name: string
  plant_type?: string
  address?: string
  city?: string
  state?: string
  pin_code?: string
  gstin?: string
  cost_centre?: string
}

export interface PublicHoliday {
  id: string
  company_id: string
  holiday_date: string
  description: string | null
  holiday_type: string | null
}

export interface HolidaySeedResponse {
  inserted: number
  message: string
}

export interface ActivationError {
  message: string
  missing: string[]
}

export interface GSTINLookupResponse {
  gstin: string
  legal_name: string | null
  trade_name?: string | null
  registered_address: string | null
  state_code: string | null
  state_name?: string | null
  taxpayer_type?: string | null
  status?: string | null
  registration_date?: string | null
  pincode?: string | null
  business_constitution?: string | null
  state_jurisdiction?: string | null
  confidence: number
  source: string
  message?: string | null
}

export interface AiExtractedField { value: string | number | null; confidence: number }
export interface AiCompanyField { value: string | number | null; confidence: number; label?: string }
export interface AiExtractedFields {
  primary?: Record<string, AiExtractedField>
  secondary_drawing_fields?: Record<string, AiExtractedField> | null
  doc_type?: string | null
  company_fields?: Record<string, AiCompanyField> | null
}

export interface CompanyDocument {
  id: string
  company_id: string
  doc_type: string
  doc_number?: string | null
  revision?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  issuing_authority?: string | null
  file_name?: string | null
  file_path?: string | null
  file_size?: number | null
  file_mime_type?: string | null
  status: string
  category?: string | null
  created_at?: string | null
  created_by?: string | null
  updated_at?: string | null
  updated_by?: string | null
  extraction_status?: string | null
  ai_extraction_id?: string | null
  extracted_fields?: AiExtractedFields | null
}

export interface CompanyDocumentCreatePayload {
  doc_type: string
  doc_number?: string
  revision?: string
  issue_date?: string
  expiry_date?: string
  issuing_authority?: string
  status?: string
  category?: string
}

export interface CompanyDocumentUpdatePayload extends Partial<CompanyDocumentCreatePayload> {}

export interface DocumentNumbering {
  id: string
  company_id: string
  doc_type: string
  prefix: string
  year_format?: string | null
  current_sequence: number
  reset_policy?: string | null
}

export interface DocumentNumberingCreatePayload {
  doc_type: string
  prefix?: string
  year_format?: string
  reset_policy?: string
}

export interface DocumentNumberingUpdatePayload extends Partial<DocumentNumberingCreatePayload> {}

export interface AuditTrailEntry {
  user: string
  user_role?: string | null
  action: string
  timestamp: string
  comment?: string | null
}

// ---------------------------------------------------------------------------
// Company CRUD
// ---------------------------------------------------------------------------

export async function getCompanies(): Promise<Company[]> {
  const { data } = await apiClient.get<Company[]>(BASE)
  return data
}

export async function getCompany(id: string): Promise<Company> {
  const { data } = await apiClient.get<Company>(`${BASE}/${id}`)
  return data
}

export async function createCompany(payload: CompanyCreatePayload): Promise<Company> {
  const { data } = await apiClient.post<Company>(`${BASE}/`, payload)
  return data
}

export async function updateCompany(id: string, payload: CompanyUpdatePayload): Promise<Company> {
  const { data } = await apiClient.patch<Company>(`${BASE}/${id}`, payload)
  return data
}

export async function deleteCompany(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

export async function deactivateCompany(id: string): Promise<Company> {
  const { data } = await apiClient.post<Company>(`${BASE}/${id}/deactivate`)
  return data
}

export async function activateCompany(id: string): Promise<Company> {
  const { data } = await apiClient.post<Company>(`${BASE}/${id}/activate`)
  return data
}

// ---------------------------------------------------------------------------
// Plants
// ---------------------------------------------------------------------------

export async function listPlants(companyId: string): Promise<Plant[]> {
  const { data } = await apiClient.get<Plant[]>(`${BASE}/${companyId}/plants`)
  return data
}

export async function createPlant(companyId: string, payload: PlantCreatePayload): Promise<Plant> {
  const { data } = await apiClient.post<Plant>(`${BASE}/${companyId}/plants`, payload)
  return data
}

export async function deletePlant(companyId: string, plantId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${companyId}/plants/${plantId}`)
}

// ---------------------------------------------------------------------------
// Holidays
// ---------------------------------------------------------------------------

export async function listHolidays(companyId: string): Promise<PublicHoliday[]> {
  const { data } = await apiClient.get<PublicHoliday[]>(`${BASE}/${companyId}/holidays`)
  return data
}

export async function seedHolidays(companyId: string): Promise<HolidaySeedResponse> {
  const { data } = await apiClient.post<HolidaySeedResponse>(`${BASE}/${companyId}/holidays/seed`)
  return data
}

export async function createHoliday(
  companyId: string,
  payload: { holiday_date: string; description?: string; holiday_type?: string },
): Promise<PublicHoliday> {
  const { data } = await apiClient.post<PublicHoliday>(`${BASE}/${companyId}/holidays`, payload)
  return data
}

export async function deleteHoliday(companyId: string, holidayId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${companyId}/holidays/${holidayId}`)
}

// ---------------------------------------------------------------------------
// GSTIN Lookup
// ---------------------------------------------------------------------------

export async function gstinLookup(gstin: string): Promise<GSTINLookupResponse> {
  const { data } = await apiClient.post<GSTINLookupResponse>(`${BASE}/gstin-lookup`, { gstin })
  return data
}

// ---------------------------------------------------------------------------
// Company Documents CRUD
// ---------------------------------------------------------------------------

export async function listCompanyDocuments(companyId: string, category?: string): Promise<CompanyDocument[]> {
  const { data } = await apiClient.get<CompanyDocument[]>(`${BASE}/${companyId}/documents`, {
    params: category ? { category } : undefined,
  })
  return data
}

export async function createCompanyDocument(
  companyId: string,
  payload: CompanyDocumentCreatePayload
): Promise<CompanyDocument> {
  const { data } = await apiClient.post<CompanyDocument>(`${BASE}/${companyId}/documents`, payload)
  return data
}

export async function updateCompanyDocument(
  companyId: string,
  docId: string,
  payload: CompanyDocumentUpdatePayload
): Promise<CompanyDocument> {
  const { data } = await apiClient.patch<CompanyDocument>(`${BASE}/${companyId}/documents/${docId}`, payload)
  return data
}

export async function deleteCompanyDocument(companyId: string, docId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${companyId}/documents/${docId}`)
}

// ---------------------------------------------------------------------------
// Document Numbering Configuration CRUD
// ---------------------------------------------------------------------------

export async function listDocNumbering(companyId: string): Promise<DocumentNumbering[]> {
  const { data } = await apiClient.get<DocumentNumbering[]>(`${BASE}/${companyId}/doc-numbering`)
  return data
}

export async function createDocNumbering(
  companyId: string,
  payload: DocumentNumberingCreatePayload
): Promise<DocumentNumbering> {
  const { data } = await apiClient.post<DocumentNumbering>(`${BASE}/${companyId}/doc-numbering`, payload)
  return data
}

export async function updateDocNumbering(
  companyId: string,
  configId: string,
  payload: DocumentNumberingUpdatePayload
): Promise<DocumentNumbering> {
  const { data } = await apiClient.patch<DocumentNumbering>(`${BASE}/${companyId}/doc-numbering/${configId}`, payload)
  return data
}

export async function deleteDocNumbering(companyId: string, configId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${companyId}/doc-numbering/${configId}`)
}

// ---------------------------------------------------------------------------
// Logo & File Uploads
// ---------------------------------------------------------------------------

export async function uploadCompanyLogo(companyId: string, file: File): Promise<{ logo_url: string; filename: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<{ logo_url: string; filename: string }>(
    `${BASE}/${companyId}/logo`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function deleteCompanyLogo(companyId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${companyId}/logo`)
}

export async function uploadDocumentFile(
  companyId: string,
  docId: string,
  file: File
): Promise<CompanyDocument> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<CompanyDocument>(
    `${BASE}/${companyId}/documents/${docId}/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

// ---------------------------------------------------------------------------
// Audit Trail
// ---------------------------------------------------------------------------

export async function listCompanyAuditTrail(companyId: string, limit = 100): Promise<AuditTrailEntry[]> {
  const { data } = await apiClient.get<AuditTrailEntry[]>(`${BASE}/${companyId}/audit-trail`, {
    params: { limit },
  })
  return data
}
