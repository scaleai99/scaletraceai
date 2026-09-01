import { apiClient } from './axiosClient'

export interface ItemRecord {
  id: string
  
  // ---- Basic Information ----
  item_code: string
  item_name?: string | null
  short_name?: string | null
  part_number?: string | null
  revision?: string | null
  description?: string | null
  item_type?: string | null
  item_category?: string | null
  status?: string
  
  // ---- Product Classification ----
  material_group?: string | null
  material?: string | null
  hsn_code?: string | null
  eccn?: string | null
  itar_controlled?: string | null
  country_of_origin?: string | null
  
  // ---- Unit & Pricing ----
  base_uom?: string | null
  sales_uom?: string | null
  purchase_uom?: string | null
  conversion_factor?: number | null
  standard_cost?: number | null
  last_purchase_price?: number | null
  standard_selling_price?: number | null
  price_control?: string | null
  costing_method?: string | null
  
  // ---- Inventory Information ----
  valuation_method?: string | null
  moving_average?: number | null
  reorder_level?: number | null
  max_stock_level?: number | null
  min_stock_level?: number | null
  lead_time_days?: number | null
  safety_stock?: number | null
  stock_in_hand?: number | null
  stock_in_transit?: number | null
  reserved_stock?: number | null
  
  // ---- Drawing & Revision ----
  drawing_number?: string | null
  drawing_revision?: string | null
  drawing_date?: string | null
  issued_by?: string | null
  approved_by?: string | null
  
  // ---- Dimensional & Weight ----
  length_mm?: number | null
  width_mm?: number | null
  height_mm?: number | null
  net_weight_kg?: number | null
  gross_weight_kg?: number | null
  tolerance?: string | null
  
  // ---- Quality & Certifications ----
  as9100_applicable?: string | null
  nadcap_applicable?: string | null
  special_process_req?: string | null
  anodizing?: string | null
  inspection_type?: string | null
  key_characteristics?: string | null
  first_article_insp_req?: string | null
  
  // ---- Default Accounts ----
  inventory_account?: string | null
  cogs_account?: string | null
  sales_account?: string | null
  purchase_account?: string | null
  tax_code?: string | null
  expense_account?: string | null
  
  // ---- Make/Brand ----
  make_brand?: string | null
  
  // ---- Legacy fields ----
  part_no?: string | null
  drawing_no?: string | null
  part_name?: string | null
  item_short_desc?: string | null
  item_long_desc?: string | null
  sales_category?: string | null
  unit_of_measure?: string
  customer_id?: string | null
  customer_name?: string | null
  drawing_standard?: string | null
  material_spec?: string | null
  surface_treatment?: string | null
  heat_treatment?: string | null
  special_process?: string | null
  thickness_mm?: number | null
  remarks?: string | null
  
  // ---- Form data ----
  form_data?: Record<string, unknown> | null
  
  // ---- Audit ----
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface ItemListParams {
  q?: string
  category?: string
  item_type?: string
  status?: string
}

export const listItems = (params?: ItemListParams) =>
  apiClient.get<ItemRecord[]>('/api/v1/items/', { params: params || {} }).then((r) => r.data)

export const createItem = (body: Partial<ItemRecord>) =>
  apiClient.post<ItemRecord>('/api/v1/items/', body).then((r) => r.data)

export const updateItem = (id: string, body: Partial<ItemRecord>) =>
  apiClient.patch<ItemRecord>(`/api/v1/items/${id}`, body).then((r) => r.data)

export const getItem = (id: string) =>
  apiClient.get<ItemRecord>(`/api/v1/items/${id}`).then((r) => r.data)

export const deleteItem = (id: string) =>
  apiClient.delete<{ deleted: string }>(`/api/v1/items/${id}`).then((r) => r.data)

// ---------------------------------------------------------------------------
// Item ↔ Supplier links (Approved Suppliers per item) — Tier-B
// ---------------------------------------------------------------------------
export interface ItemSupplierLink {
  id: string
  item_id: string
  supplier_id: string
  supplier_code: string | null
  supplier_name: string | null
  supply_category: string | null
  supply_type: string | null
  lead_time_days: number | null
  unit_price: number | null
  is_preferred: boolean
  status: string
}

export interface ItemSupplierCreatePayload {
  supplier_id: string
  supply_type?: string
  lead_time_days?: number
  unit_price?: number
  is_preferred?: boolean
  remarks?: string
}

export const listItemSuppliers = (itemId: string) =>
  apiClient.get<ItemSupplierLink[]>(`/api/v1/items/${itemId}/suppliers`).then((r) => r.data)

export const addItemSupplier = (itemId: string, body: ItemSupplierCreatePayload) =>
  apiClient.post<ItemSupplierLink>(`/api/v1/items/${itemId}/suppliers`, body).then((r) => r.data)

export const deleteItemSupplier = (itemId: string, linkId: string) =>
  apiClient.delete(`/api/v1/items/${itemId}/suppliers/${linkId}`).then((r) => r.data)

// ===========================================================================
// Item Documents — versioned drawing/document storage (revision control)
// ===========================================================================
export interface ItemDocument {
  id: string
  item_id: string
  document_type: string
  file_name: string | null
  file_path: string | null
  file_size_bytes: number | null
  content_type: string | null
  doc_number: string | null
  revision: string | null
  issue_date: string | null
  notes: string | null
  version_no: number
  is_current: boolean
  superseded_at: string | null
  superseded_by_id: string | null
  extraction_status: string | null
  ai_extraction_id: string | null
  extracted_fields?: Record<string, any> | null
  status: string
  uploaded_by: string | null
  uploaded_at: string | null
}

export interface ItemDocumentUploadFields {
  document_type?: string
  revision?: string
  doc_number?: string
  issue_date?: string
  notes?: string
}

/** Current-version documents only (one row per document_type). */
export const listItemDocuments = (itemId: string) =>
  apiClient.get<ItemDocument[]>(`/api/v1/items/${itemId}/documents`).then((r) => r.data)

/** Full revision history — every version, newest first (supersedes retained). */
export const listItemDocumentHistory = (itemId: string) =>
  apiClient.get<ItemDocument[]>(`/api/v1/items/${itemId}/documents/history`).then((r) => r.data)

export const uploadItemDocument = (
  itemId: string,
  file: File,
  fields: ItemDocumentUploadFields = {},
) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('document_type', fields.document_type || 'Drawing')
  if (fields.revision) fd.append('revision', fields.revision)
  if (fields.doc_number) fd.append('doc_number', fields.doc_number)
  if (fields.issue_date) fd.append('issue_date', fields.issue_date)
  if (fields.notes) fd.append('notes', fields.notes)
  return apiClient
    .post<ItemDocument>(`/api/v1/items/${itemId}/documents/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const deleteItemDocument = (itemId: string, docId: string) =>
  apiClient.delete(`/api/v1/items/${itemId}/documents/${docId}`).then((r) => r.data)

// ===========================================================================
// Item BOM components (Bill of Materials)
// ===========================================================================
export interface ItemBomComponent {
  id: string
  item_id: string
  component_item_id: string | null
  component_code: string | null
  component_name: string | null
  quantity: number | null
  uom: string | null
  level: number | null
  remarks: string | null
  status: string
}

export interface ItemBomCreatePayload {
  component_code?: string
  component_name?: string
  quantity?: number
  uom?: string
  level?: number
  remarks?: string
}

export const listItemBom = (itemId: string) =>
  apiClient.get<ItemBomComponent[]>(`/api/v1/items/${itemId}/bom`).then((r) => r.data)

export const addItemBom = (itemId: string, body: ItemBomCreatePayload) =>
  apiClient.post<ItemBomComponent>(`/api/v1/items/${itemId}/bom`, body).then((r) => r.data)

export const deleteItemBom = (itemId: string, linkId: string) =>
  apiClient.delete(`/api/v1/items/${itemId}/bom/${linkId}`).then((r) => r.data)

// ===========================================================================
// Item ↔ Customer part mapping
// ===========================================================================
export interface ItemCustomerPart {
  id: string
  item_id: string
  customer_id: string | null
  customer_code: string | null
  customer_name: string | null
  customer_part_no: string | null
  remarks: string | null
  status: string
}

export interface ItemCustomerPartCreatePayload {
  customer_id?: string
  customer_code?: string
  customer_name?: string
  customer_part_no?: string
  remarks?: string
}

export const listItemCustomerParts = (itemId: string) =>
  apiClient.get<ItemCustomerPart[]>(`/api/v1/items/${itemId}/customer-parts`).then((r) => r.data)

export const addItemCustomerPart = (itemId: string, body: ItemCustomerPartCreatePayload) =>
  apiClient.post<ItemCustomerPart>(`/api/v1/items/${itemId}/customer-parts`, body).then((r) => r.data)

export const deleteItemCustomerPart = (itemId: string, linkId: string) =>
  apiClient.delete(`/api/v1/items/${itemId}/customer-parts/${linkId}`).then((r) => r.data)
