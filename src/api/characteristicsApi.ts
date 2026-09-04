/**
 * Drawing/Model extraction backbone API client.
 *
 * The signed CharacteristicSet is the single authoritative source of a part's
 * requirements — see backend app/api/characteristics.py. A set is extracted
 * from a line item's AI drawing extraction, reviewed/confirmed by a human,
 * then SIGNED to freeze it. All data is real: an empty extraction yields an
 * empty set, never synthetic rows.
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/characteristics'

export type CharTier = 'auto' | 'confirm' | 'must_open'

export interface ExtractionCharacteristic {
  id: string
  seq: number | null
  source: 'drawing' | 'model' | 'manual' | 'customer' | string
  source_ref: Record<string, unknown> | null
  char_type: string
  raw_text: string | null
  nominal: number | null
  upper_tol: number | null
  lower_tol: number | null
  unit: string | null
  gdt_symbol: string | null
  datums: unknown[] | null
  material_condition: string | null
  feature_ref: string | null
  is_key: boolean
  confidence: number | null
  tier: CharTier
  confirmed_by: string | null
  confirmed_at: string | null
  status: string
  /** OP110 balloon placement: 0-1 fractions of the drawing page. */
  balloon_x?: number | null
  balloon_y?: number | null
  balloon_page?: number | null
}

export interface IntakeManifest {
  filename?: string
  file_size_bytes?: number
  sha256?: string
  detected_type?: string
  detected_by?: string
  extension?: string
  probe_ok?: boolean
  page_count?: number
  has_text_layer?: boolean
  text_char_count?: number
  pages_with_text_layer?: number
  classification?: string
  encrypted?: boolean
  step_schema?: string | null
  has_pmi_hint?: boolean
  pmi_entity_hint_count?: number
  sheets?: Array<Record<string, unknown>>
  warnings?: string[]
  probed_at?: string
  [k: string]: unknown
}

export interface CharacteristicSet {
  id: string
  rfq_id: string
  rfq_line_item_id: string | null
  version: number
  status: 'draft' | 'extracted' | 'under_review' | 'signed' | 'superseded' | string
  intake_manifest: IntakeManifest | null
  source_summary: Record<string, number> | null
  source_extraction_id: string | null
  characteristic_count: number
  key_characteristic_count: number
  open_count: number
  signed_by: string | null
  signed_at: string | null
  signature_note: string | null
  supersedes_id: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
  confidence_tiers: { auto: number; confirm: number }
  characteristics: ExtractionCharacteristic[]
}

export interface CharacteristicUpdate {
  char_type?: string
  raw_text?: string
  nominal?: number | null
  upper_tol?: number | null
  lower_tol?: number | null
  unit?: string
  gdt_symbol?: string
  datums?: unknown[]
  material_condition?: string
  feature_ref?: string
  is_key?: boolean
  confidence?: number
  confirm?: boolean
}

export interface CharacteristicCreate {
  set_id: string
  char_type?: string
  raw_text: string
  nominal?: number | null
  upper_tol?: number | null
  lower_tol?: number | null
  unit?: string
  gdt_symbol?: string
  datums?: unknown[]
  material_condition?: string
  feature_ref?: string
  is_key?: boolean
}

export const getCharacteristicSet = (rfqId: string, lineItemId?: string) =>
  apiClient
    .get<{ set: CharacteristicSet | null }>(`${BASE}/sets`, {
      params: lineItemId ? { rfq_id: rfqId, line_item_id: lineItemId } : { rfq_id: rfqId },
    })
    .then((r) => r.data.set)

export const getCharacteristicSetById = (setId: string) =>
  apiClient.get<CharacteristicSet>(`${BASE}/sets/${setId}`).then((r) => r.data)

export const extractCharacteristicSet = (rfqId: string, lineItemId?: string) =>
  apiClient
    .post<CharacteristicSet>(`${BASE}/sets/extract`, {
      rfq_id: rfqId,
      line_item_id: lineItemId ?? null,
    })
    .then((r) => r.data)

export const updateCharacteristic = (cid: string, body: CharacteristicUpdate) =>
  apiClient.patch<CharacteristicSet>(`${BASE}/characteristics/${cid}`, body).then((r) => r.data)

export const addCharacteristic = (body: CharacteristicCreate) =>
  apiClient.post<CharacteristicSet>(`${BASE}/characteristics`, body).then((r) => r.data)

export const deleteCharacteristic = (cid: string) =>
  apiClient.delete<CharacteristicSet>(`${BASE}/characteristics/${cid}`).then((r) => r.data)

export const signCharacteristicSet = (setId: string, note?: string) =>
  apiClient
    .post<CharacteristicSet>(`${BASE}/sets/${setId}/sign`, { note: note ?? null })
    .then((r) => r.data)

export const reopenCharacteristicSet = (setId: string) =>
  apiClient.post<CharacteristicSet>(`${BASE}/sets/${setId}/reopen`, {}).then((r) => r.data)

/** OP110: place a characteristic's balloon on the drawing page (0-1 fractions). */
export const placeBalloon = (cid: string, balloon_x: number, balloon_y: number, balloon_page = 1) =>
  apiClient
    .patch<{ id: string; seq: number | null; balloon_x: number; balloon_y: number; balloon_page: number }>(
      `${BASE}/characteristics/${cid}/balloon`, { balloon_x, balloon_y, balloon_page })
    .then((r) => r.data)
