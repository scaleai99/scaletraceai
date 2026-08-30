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
