/**
 * Costing masters API client - Module 09 gap (Tooling / Material / Process rates).
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/costing-masters'

export interface Tooling {
  id: string
  tool_code: string
  tool_name: string
  tool_type: string | null
  part_number: string | null
  investment_inr: number | null
  expected_life_units: number | null
  units_produced: number | null
  consumable_cost_per_unit: number | null
  plant_id: string | null
  status: string
  amortised_cost_per_part: number
  created_at: string
}

export interface ToolingCreate {
  tool_code: string
  tool_name: string
  tool_type?: string
  part_number?: string
  investment_inr?: number
  expected_life_units?: number
  consumable_cost_per_unit?: number
}

export async function listTooling(): Promise<Tooling[]> {
  const { data } = await apiClient.get<Tooling[]>(`${BASE}/tooling`)
  return Array.isArray(data) ? data : []
}

export async function createTooling(body: ToolingCreate): Promise<Tooling> {
  const { data } = await apiClient.post<Tooling>(`${BASE}/tooling`, body)
  return data
}
