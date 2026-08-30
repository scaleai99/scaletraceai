/**
 * AI Surface Treatment Analysis API client - Module 06 gap (Req 6.9).
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/ai'

export interface SurfaceTreatmentResult {
  process_types: string[]
  estimated_surface_area_cm2: number | null
  masking: { masking_required: boolean; description: string | null }
  coating_thickness: { min: number | null; max: number | null; unit: string | null }
  finish_colour: string | null
  nadcap_categories: string[]
  certifications_required: boolean
  source_spec_refs: string[]
}

export interface SurfaceTreatmentRequest {
  spec_refs?: string[]
  drawing_text?: string
  surface_area_cm2?: number
  bbox_mm?: { length?: number; width?: number; height?: number; thickness?: number }
  coverage_factor?: number
  rfq_line_item_id?: string
}

export async function analyzeSurfaceTreatment(
  body: SurfaceTreatmentRequest,
): Promise<SurfaceTreatmentResult> {
  const { data } = await apiClient.post<SurfaceTreatmentResult>(`${BASE}/surface-treatment-analysis`, body)
  return data
}
