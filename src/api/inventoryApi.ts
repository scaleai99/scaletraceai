/**
 * inventoryApi.ts - Module 18: Inventory / Stores API client
 */

import axiosClient from './axiosClient'

export interface InventoryItem {
  item_code: string
  description: string
  uom: string
  category?: string
  quantity_on_hand: number
  reserved_quantity?: number
  available_quantity?: number
  min_stock_level?: number
  max_stock_level?: number
  reorder_point?: number
  unit_cost?: number
  total_value?: number
  storage_location?: string
  last_updated?: string
}

export interface StockLot {
  lot_id: string
  item_code: string
  description?: string
  quantity: number
  unit_cost: number
  total_value: number
  received_date: string
  expiry_date?: string
  location?: string
  status: string
  grn_number?: string
}

export interface GRN {
  grn_number: string
  po_number?: string
  supplier_name?: string
  grn_date: string
  status: string
  items: GRNLineItem[]
  total_value?: number
  created_by?: string
}

export interface GRNLineItem {
  line_number: number
  item_code: string
  description?: string
  ordered_qty: number
  received_qty: number
  accepted_qty: number
  rejected_qty?: number
  unit_cost: number
  uom: string
}

export interface ValuationReport {
  as_of_date: string
  total_inventory_value: number
  items: ValuationLineItem[]
  category_summary?: Record<string, number>
}

export interface ValuationLineItem {
  item_code: string
  description: string
  quantity: number
  uom: string
  average_cost: number
  total_value: number
  method: string
}

export interface InventoryListParams {
  page?: number
  page_size?: number
  search?: string
  category?: string
  low_stock?: boolean
}

export interface GRNListParams {
  page?: number
  page_size?: number
  status?: string
  supplier?: string
  from_date?: string
  to_date?: string
}

/** GET /api/v1/inventory/items */
export async function getInventoryItems(params?: InventoryListParams): Promise<InventoryItem[]> {
  const res = await axiosClient.get('/inventory/items', { params })
  return res.data?.items ?? res.data ?? []
}

/** GET /api/v1/inventory/lots */
export async function getStockLots(itemCode?: string): Promise<StockLot[]> {
  const params = itemCode ? { item_code: itemCode } : undefined
  const res = await axiosClient.get('/inventory/lots', { params })
  return res.data?.lots ?? res.data ?? []
}

/** GET /api/v1/purchase/grns */
export async function getGRNs(params?: GRNListParams): Promise<GRN[]> {
  const res = await axiosClient.get('/purchase/grns', { params })
  return res.data?.grns ?? res.data ?? []
}

/** GET /api/v1/inventory/valuation */
export async function getValuationReport(): Promise<ValuationReport> {
  const res = await axiosClient.get('/inventory/valuation')
  return res.data
}
