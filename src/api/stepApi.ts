/**
 * STEP / 3D ingestion API client - Module 05 gap (Req 5.13/5.14).
 */
import axios from 'axios'

const BASE = '/api/v1/ai'

export interface StepExtraction {
  id: string
  file_name: string | null
  file_size_bytes: number | null
  extraction_status: string | null
  bbox_length_mm: number | null
  bbox_width_mm: number | null
  bbox_height_mm: number | null
  volume_cm3: number | null
  surface_area_cm2: number | null
  face_count: number | null
  material_from_meta: string | null
  confidence_bbox: number | null
  upload_timestamp: string
}

export async function extractStep(file: File): Promise<StepExtraction> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axios.post<StepExtraction>(`${BASE}/extract-step`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
