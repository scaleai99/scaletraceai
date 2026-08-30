/**
 * Manpower Planning API client - Module 16 gap (Req 16.10).
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/production-orders'

export interface WorkCentreLoad {
  work_centre: string
  planned_operator_hours: number
  available_operator_hours: number
  utilisation_pct: number
  over_threshold: boolean
}

export interface ManpowerLoading {
  threshold_pct: number
  work_centres: WorkCentreLoad[]
}

export interface SkillGap {
  work_order_id: string | null
  operation: string
  required_competency: string
  qualified_operators: number
  has_gap: boolean
}

export async function getManpowerLoading(): Promise<ManpowerLoading> {
  const { data } = await apiClient.get<ManpowerLoading>(`${BASE}/manpower-loading`)
  return data
}

export async function getSkillGaps(productionOrderId: string): Promise<{ gaps: SkillGap[] }> {
  const { data } = await apiClient.get<{ gaps: SkillGap[] }>(`${BASE}/${productionOrderId}/skill-gaps`)
  return data
}
