/**
 * supplierApi.ts - Axios API client for Module 03: Supplier Master.
 *
 * All functions target /api/v1/suppliers/* and /api/v1/specifications/*.
 * Returns typed responses matching backend schemas.
 */

import { apiClient } from './axiosClient'

const BASE = '/api/v1/suppliers'
const SPEC_BASE = '/api/v1/specifications'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupplierCapability {
  id: string
  supplier_id: string
  processes: string[] | null
  materials: string[] | null
  certifications: Array<{ name: string; expiry_date: string }> | null
  facility_sqft: number | null
  as9100d_cert: boolean
  nadcap_cert: boolean
  iso9001_cert: boolean
  nadcap_expiry: string | null  // ISO date string YYYY-MM-DD
}

export interface Supplier {
  id: string
  supplier_code: string
  supplier_name: string
  short_name: string | null
  supplier_type: string | null
  category: string | null
  sub_category: string | null
  website: string | null
  gstin: string | null
  registered_address: string | null
  state_code: string | null
  pan: string | null
  tan: string | null
  cin: string | null
  iec_code: string | null
  msme_no: string | null
  date_of_incorporation: string | null  // YYYY-MM-DD
  contact_name: string | null
  contact_email: string | null
  contact_mobile: string | null
  supply_category: string | null
  msme_category: string | null
  business_nature: string | null
  supply_type: string | null
  main_products: string | null
  payment_terms_text: string | null
  incoterms: string | null
  min_order_value: number | null
  annual_turnover: number | null
  preferred_currency: string | null
  payment_terms: number | null
  currency: string
  manufacturing_location: string | null
  plant_size: string | null
  num_employees: number | null
  equipment_facility: string | null
  core_competencies: string | null
  capacity_per_month: string | null
  bank_name: string | null
  bank_branch: string | null
  bank_account_number: string | null
  bank_account_type: string | null
  bank_ifsc_code: string | null
  bank_micr_code: string | null
  bank_upi_id: string | null
  as9100_status: string | null
  nadcap_status: string | null
  iso9001_status: string | null
  iso14001_status: string | null
  iso45001_status: string | null
  other_certifications: string | null
  qa_system: string | null
  fai_ppap_support: string | null
  approved_for_raw_material: boolean
  approved_for_sub_contract: boolean
  approved_for_heat_treatment: boolean
  approved_for_surface: boolean
  approved_for_ndt: boolean
  approved_for_others: boolean
  approved_for_others_text: string | null
  asl_status: string
  approved_by: string | null
  approved_at: string | null
  delisted_reason: string | null
  delisted_at: string | null
  audit_overdue: boolean
  dgca_reference: string | null
  hal_supplier_code: string | null
  isro_registration_number: string | null
  dgca_approval_number: string | null
  dgca_approval_expiry: string | null
  hal_vendor_code: string | null
  isro_vendor_code: string | null
  created_at: string | null
  updated_at: string | null
  // Detail fields
  capabilities?: SupplierCapability | null
  last_audit_score?: number | null
  last_audit_date?: string | null  // ISO date string YYYY-MM-DD
  nadcap_expiry_warning?: boolean
}

export interface SupplierCreatePayload {
  dgca_reference?: string
  dgca_approval_number?: string
  dgca_approval_expiry?: string
  hal_supplier_code?: string
  hal_vendor_code?: string
  isro_registration_number?: string
  isro_vendor_code?: string
  supplier_code: string
  supplier_name: string
  short_name?: string
  supplier_type?: string
  category?: string
  sub_category?: string
  website?: string
  gstin?: string
  registered_address?: string
  state_code?: string
  pan?: string
  tan?: string
  cin?: string
  iec_code?: string
  msme_no?: string
  date_of_incorporation?: string
  contact_name?: string
  contact_email?: string
  contact_mobile?: string
  supply_category?: string
  msme_category?: string
  business_nature?: string
  supply_type?: string
  main_products?: string
  payment_terms_text?: string
  incoterms?: string
  min_order_value?: number
  annual_turnover?: number
  preferred_currency?: string
  payment_terms?: number
  currency?: string
  manufacturing_location?: string
  plant_size?: string
  num_employees?: number
  equipment_facility?: string
  core_competencies?: string
  capacity_per_month?: string
  bank_name?: string
  bank_branch?: string
  bank_account_number?: string
  bank_account_type?: string
  bank_ifsc_code?: string
  bank_micr_code?: string
  bank_upi_id?: string
  as9100_status?: string
  nadcap_status?: string
  iso9001_status?: string
  iso14001_status?: string
  iso45001_status?: string
  other_certifications?: string
  qa_system?: string
  fai_ppap_support?: string
  approved_for_raw_material?: boolean
  approved_for_sub_contract?: boolean
  approved_for_heat_treatment?: boolean
  approved_for_surface?: boolean
  approved_for_ndt?: boolean
  approved_for_others?: boolean
  approved_for_others_text?: string
}

export interface SupplierCapabilityPayload {
  processes?: string[]
  materials?: string[]
  certifications?: Array<{ name: string; expiry_date: string }>
  facility_sqft?: number
  as9100d_cert?: boolean
  nadcap_cert?: boolean
  iso9001_cert?: boolean
  nadcap_expiry?: string
}

export type SupplierUpdatePayload = Partial<SupplierCreatePayload> & {
  capabilities?: SupplierCapabilityPayload
}

export interface SupplierListParams {
  search?: string
  asl_status?: string
  supply_category?: string
  msme_category?: string
  skip?: number
  limit?: number
}

export interface SupplierAudit {
  id: string
  supplier_id: string
  audit_date: string  // YYYY-MM-DD
  auditor_name: string | null
  audit_type: string | null
  audit_score: number | null
  findings_critical: number
  findings_major: number
  findings_minor: number
  audit_status: string
  report_path: string | null
  created_at: string | null
}

export interface SupplierAuditCreatePayload {
  audit_date: string  // YYYY-MM-DD
  auditor_name?: string
  audit_type?: string
  audit_score?: number
  findings_critical?: number
  findings_major?: number
  findings_minor?: number
  audit_status?: string
  report_path?: string
}

export interface SupplierScorecard {
  on_time_delivery_rate_pct: number
  quality_rejection_rate_pct: number
  ncr_count_12m: number
  open_po_value_inr: number
  last_audit_score: number | null
  last_audit_date: string | null  // YYYY-MM-DD
  audit_overdue: boolean
}

export interface Specification {
  id: string
  spec_number: string
  spec_title: string | null
  current_revision: string | null
  process_category: string | null
  scale_qualified: boolean
  qualification_expiry: string | null  // YYYY-MM-DD
  created_at: string | null
}

export interface SpecificationCreatePayload {
  spec_number: string
  spec_title?: string
  current_revision?: string
  process_category?: string
  scale_qualified?: boolean
  qualification_expiry?: string
}

export interface SpecificationListParams {
  search?: string
  process_category?: string
  scale_qualified?: boolean
  skip?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// Supplier API functions
// ---------------------------------------------------------------------------

/** List suppliers with optional filters. */
export async function listSuppliers(params: SupplierListParams = {}): Promise<Supplier[]> {
  const { data } = await apiClient.get<Supplier[]>(BASE, { params })
  return data
}

/** Get a single supplier with capabilities and last audit eagerly loaded. */
export async function getSupplier(id: string): Promise<Supplier> {
  const { data } = await apiClient.get<Supplier>(`${BASE}/${id}`)
  return data
}

/** Create a new supplier (Procurement / Administrator). */
export async function createSupplier(payload: SupplierCreatePayload): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>(`${BASE}/`, payload)
  return data
}

/** Partially update supplier fields (PATCH). */
export async function updateSupplier(id: string, payload: SupplierUpdatePayload): Promise<Supplier> {
  const { data } = await apiClient.patch<Supplier>(`${BASE}/${id}`, payload)
  return data
}

/** Approve a supplier (Quality_Manager only). Pending Approval -> Active. */
export async function approveSupplier(id: string): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>(`${BASE}/${id}/approve`)
  return data
}

/** Suspend a supplier (Quality_Manager only). Active -> Suspended. */
export async function suspendSupplier(id: string): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>(`${BASE}/${id}/suspend`)
  return data
}

/** Delist a supplier with reason (Quality_Manager only). */
export async function delistSupplier(id: string, reason: string): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>(`${BASE}/${id}/delist`, { reason })
  return data
}

/** Restore a suspended supplier to Active (Quality_Manager only). */
export async function restoreSupplier(id: string): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>(`${BASE}/${id}/restore`)
  return data
}

/** Soft-delete a supplier (Administrator only). Sets asl_status to Deleted; drops from the list. */
export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}

/** Get the Approved Vendor List - Active suppliers only. */
export async function getAVL(): Promise<Supplier[]> {
  const { data } = await apiClient.get<Supplier[]>(`${BASE}/avl`)
  return data
}

// ---------------------------------------------------------------------------
// Audit API functions
// ---------------------------------------------------------------------------

/** List audits for a supplier ordered by date descending. */
export async function listAudits(supplierId: string): Promise<SupplierAudit[]> {
  const { data } = await apiClient.get<SupplierAudit[]>(`${BASE}/${supplierId}/audits`)
  return data
}

/** Create a new audit record for a supplier. */
export async function addAudit(supplierId: string, payload: SupplierAuditCreatePayload): Promise<SupplierAudit> {
  const { data } = await apiClient.post<SupplierAudit>(`${BASE}/${supplierId}/audits`, payload)
  return data
}

/** Get the performance scorecard for a supplier. */
export async function getScorecard(supplierId: string): Promise<SupplierScorecard> {
  const { data } = await apiClient.get<SupplierScorecard>(`${BASE}/${supplierId}/scorecard`)
  return data
}

// ---------------------------------------------------------------------------
// Specification Master API functions
// ---------------------------------------------------------------------------

/** List specifications with optional filters. */
export interface SupplierContact {
  id: string
  supplier_id: string
  name: string | null
  designation: string | null
  email: string | null
  phone: string | null
  is_primary: boolean | null
  created_at: string | null
}

export interface SupplierContactCreatePayload {
  name: string
  designation?: string
  email?: string
  phone?: string
  is_primary?: boolean
}

export interface SupplierDocument {
  id: string
  supplier_id: string
  document_type: string | null
  doc_number: string | null
  revision: string | null
  issue_date: string | null
  expiry_date: string | null
  issuing_authority: string | null
  status: string | null
  file_name: string | null
  uploaded_at: string | null
}
export interface SupplierDocumentCreatePayload {
  document_type: string
  doc_number?: string
  revision?: string
  issue_date?: string
  expiry_date?: string
  issuing_authority?: string
  status?: string
}
export async function listSupplierDocuments(sid: string): Promise<SupplierDocument[]> {
  const { data } = await apiClient.get<SupplierDocument[]>(`${BASE}/${sid}/documents`)
  return data
}
export async function addSupplierDocument(sid: string, payload: SupplierDocumentCreatePayload): Promise<SupplierDocument> {
  const { data } = await apiClient.post<SupplierDocument>(`${BASE}/${sid}/documents`, payload)
  return data
}
export async function deleteSupplierDocument(sid: string, docId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${sid}/documents/${docId}`)
}

export interface SupplierApprovedProduct {
  id: string
  supplier_id: string
  material: string | null
  specification: string | null
  form: string | null
  condition: string | null
  approved_on: string | null
  status: string | null
  created_at: string | null
}
export interface SupplierApprovedProductCreatePayload {
  material: string
  specification?: string
  form?: string
  condition?: string
  approved_on?: string
  status?: string
}
export async function listSupplierApprovedProducts(sid: string): Promise<SupplierApprovedProduct[]> {
  const { data } = await apiClient.get<SupplierApprovedProduct[]>(`${BASE}/${sid}/approved-products`)
  return data
}
export async function addSupplierApprovedProduct(sid: string, payload: SupplierApprovedProductCreatePayload): Promise<SupplierApprovedProduct> {
  const { data } = await apiClient.post<SupplierApprovedProduct>(`${BASE}/${sid}/approved-products`, payload)
  return data
}
export async function deleteSupplierApprovedProduct(sid: string, productId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${sid}/approved-products/${productId}`)
}

export async function listSupplierContacts(supplierId: string): Promise<SupplierContact[]> {
  const { data } = await apiClient.get<SupplierContact[]>(`${BASE}/${supplierId}/contacts`)
  return data
}

export async function addSupplierContact(supplierId: string, payload: SupplierContactCreatePayload): Promise<SupplierContact> {
  const { data } = await apiClient.post<SupplierContact>(`${BASE}/${supplierId}/contacts`, payload)
  return data
}

export async function deleteSupplierContact(supplierId: string, contactId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${supplierId}/contacts/${contactId}`)
}

export async function listSpecifications(params: SpecificationListParams = {}): Promise<Specification[]> {
  const { data } = await apiClient.get<Specification[]>(SPEC_BASE, { params })
  return data
}

/** Create a new specification (Quality_Manager / Administrator). */
export async function createSpecification(payload: SpecificationCreatePayload): Promise<Specification> {
  const { data } = await apiClient.post<Specification>(SPEC_BASE, payload)
  return data
}
