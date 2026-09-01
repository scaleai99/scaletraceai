/**
 * specificationApi.ts - Specification Master API client.
 * Endpoints: /api/v1/specifications (list/create), /{id} (get/update/delete).
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/specifications'

export interface Specification {
  id: string
  spec_number: string
  spec_title: string | null
  current_revision: string | null
  process_category: string | null
  scale_qualified: boolean
  qualification_expiry: string | null
  status?: string | null
  created_at: string | null
}

export interface SpecificationCreate {
  spec_number: string
  spec_title?: string | null
  current_revision?: string | null
  process_category?: string | null
  scale_qualified?: boolean
  qualification_expiry?: string | null
}

export type SpecificationUpdate = Partial<Omit<SpecificationCreate, 'spec_number'>>

export interface ListSpecParams {
  search?: string
  process_category?: string
  scale_qualified?: boolean
}

export async function listSpecifications(params: ListSpecParams = {}): Promise<Specification[]> {
  const { data } = await apiClient.get<Specification[]>(`${BASE}`, { params })
  return data
}

export async function getSpecification(id: string): Promise<Specification> {
  const { data } = await apiClient.get<Specification>(`${BASE}/${id}`)
  return data
}

export async function createSpecification(body: SpecificationCreate): Promise<Specification> {
  const { data } = await apiClient.post<Specification>(`${BASE}`, body)
  return data
}

export async function updateSpecification(id: string, body: SpecificationUpdate): Promise<Specification> {
  const { data } = await apiClient.patch<Specification>(`${BASE}/${id}`, body)
  return data
}

export async function deleteSpecification(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`)
}
