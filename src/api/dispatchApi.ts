/**
 * dispatchApi.ts - API calls for Dispatch (Module 23)
 */

import { apiClient } from './axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DCLineItem {
  id: string
  dc_id: string
  item_code: string | null
  description: string | null
  quantity: number | null
  unit_price: number | null
  hsn_code: string | null
}

export interface DeliveryChallan {
  id: string
  dc_number: string
  so_id: string | null
  customer_id: string
  dispatch_date: string
  transporter: string | null
  lr_number: string | null
  taxable_value: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_value: number
  state_from: string | null
  state_to: string | null
  status: string
  created_at: string
  line_items: DCLineItem[]
}

// ---------------------------------------------------------------------------
// Delivery Challans
// ---------------------------------------------------------------------------

export const listChallans = (params?: Record<string, unknown>) =>
  apiClient.get<DeliveryChallan[]>('/api/v1/dispatch/challans', { params }).then((r) => Array.isArray(r.data) ? r.data : [])

export const getChallan = (id: string) =>
  apiClient.get<DeliveryChallan>(`/api/v1/dispatch/challans/${id}`).then((r) => r.data)

export const createChallan = (data: Partial<DeliveryChallan>) =>
  apiClient.post<DeliveryChallan>('/api/v1/dispatch/challans', data).then((r) => r.data)
