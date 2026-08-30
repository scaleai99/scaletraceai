/**
 * engineeringApi.ts - Module 15: Engineering Release API client
 */

import axiosClient from './axiosClient'

export interface EngineeringRelease {
  id: string
  release_number: string
  drawing_number: string
  revision: string
  part_number: string
  description: string
  status: 'draft' | 'pending_approval' | 'approved' | 'released' | 'obsolete'
  released_by?: string
  approved_by?: string
  release_date?: string
  effective_date?: string
  sales_order_ref?: string
  customer_name?: string
  bom_items?: BOMItem[]
  routing_operations?: RoutingOperation[]
  created_at: string
  updated_at: string
}

export interface BOMItem {
  line_number: number
  item_code: string
  description: string
  quantity: number
  uom: string
  material_grade?: string
  notes?: string
}

export interface RoutingOperation {
  sequence: number
  operation_code: string
  operation_name: string
  work_center: string
  setup_time_hrs: number
  cycle_time_hrs: number
  tooling?: string
  special_process?: string
  notes?: string
}

export interface EngineeringReleaseCreatePayload {
  drawing_number: string
  revision: string
  part_number: string
  description: string
  sales_order_ref?: string
  customer_name?: string
  bom_items?: BOMItem[]
  routing_operations?: RoutingOperation[]
  effective_date?: string
}

export interface EngineeringListParams {
  page?: number
  page_size?: number
  status?: string
  search?: string
  customer?: string
  from_date?: string
  to_date?: string
}

/** GET /api/v1/engineering-releases */
export async function getEngineeringReleases(
  params?: EngineeringListParams
): Promise<{ items: EngineeringRelease[]; total: number }> {
  const res = await axiosClient.get('/engineering-releases', { params })
  return res.data
}

/** POST /api/v1/engineering-releases */
export async function createEngineeringRelease(
  data: EngineeringReleaseCreatePayload
): Promise<EngineeringRelease> {
  const res = await axiosClient.post('/engineering-releases', data)
  return res.data
}

/** GET /api/v1/engineering-releases/{id} */
export async function getEngineeringRelease(id: string): Promise<EngineeringRelease> {
  const res = await axiosClient.get(`/engineering-releases/${id}`)
  return res.data
}

/** PATCH /api/v1/engineering-releases/{id} */
export async function updateEngineeringRelease(
  id: string,
  data: Partial<EngineeringReleaseCreatePayload>
): Promise<EngineeringRelease> {
  const res = await axiosClient.patch(`/engineering-releases/${id}`, data)
  return res.data
}

/** POST /api/v1/engineering-releases/{id}/approve */
export async function approveEngineeringRelease(id: string): Promise<EngineeringRelease> {
  const res = await axiosClient.post(`/engineering-releases/${id}/approve`)
  return res.data
}

/** POST /api/v1/engineering-releases/{id}/release */
export async function releaseEngineering(id: string): Promise<EngineeringRelease> {
  const res = await axiosClient.post(`/engineering-releases/${id}/release`)
  return res.data
}
