/**
 * chemicalBatchApi.ts - Shop Floor - Special Process, Phase 1 (Chemical
 * Control). Typed client for /api/v1/stp/chemical-batches.
 */

import { apiClient } from './axiosClient'

const BASE = '/api/v1/stp'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QcReleaseStatus = 'Pending' | 'Released' | 'Rejected'

export interface ChemicalBatch {
  id: string
  stock_lot_id: string
  chemical_name: string
  process_ref: string | null
  concentration_pct: number | null
  qc_release_status: QcReleaseStatus
  qc_released_by: string | null
  qc_released_at: string | null
  qc_notes: string | null
  coc_number: string | null
  coc_file_name: string | null
  coc_file_path: string | null
  coc_file_mime_type: string | null
  status: string
  created_at: string | null
  created_by: string | null
  updated_by: string | null
  // Joined from the underlying StockLot
  lot_number: string | null
  item_code: string | null
  supplier_batch: string | null
  expiry_date: string | null
  qty_remaining: number | null
}

export interface ChemicalBatchCreatePayload {
  stock_lot_id: string
  chemical_name: string
  process_ref?: string
  concentration_pct?: number
  coc_number?: string
}

export interface ChemicalBatchUpdatePayload {
  chemical_name?: string
  process_ref?: string
  concentration_pct?: number
  coc_number?: string
  qc_notes?: string
}

export interface StockLotOption {
  id: string
  lot_number: string
  item_code: string
  supplier_batch: string | null
  expiry_date: string | null
  qty_remaining: number | null
}

// ---------------------------------------------------------------------------
// Chemical Batch CRUD
// ---------------------------------------------------------------------------

export const listChemicalBatches = () =>
  apiClient.get<ChemicalBatch[]>(`${BASE}/chemical-batches`).then((r) => r.data)

export const getChemicalBatch = (id: string) =>
  apiClient.get<ChemicalBatch>(`${BASE}/chemical-batches/${id}`).then((r) => r.data)

export const createChemicalBatch = (body: ChemicalBatchCreatePayload) =>
  apiClient.post<ChemicalBatch>(`${BASE}/chemical-batches`, body).then((r) => r.data)

export const updateChemicalBatch = (id: string, body: ChemicalBatchUpdatePayload) =>
  apiClient.patch<ChemicalBatch>(`${BASE}/chemical-batches/${id}`, body).then((r) => r.data)

export const qcReleaseChemicalBatch = (
  id: string,
  body: { qc_release_status: 'Released' | 'Rejected'; qc_notes?: string }
) => apiClient.post<ChemicalBatch>(`${BASE}/chemical-batches/${id}/qc-release`, body).then((r) => r.data)

export const uploadCocFile = (id: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return apiClient
    .post<ChemicalBatch>(`${BASE}/chemical-batches/${id}/coc-upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const deleteChemicalBatch = (id: string) =>
  apiClient.delete(`${BASE}/chemical-batches/${id}`)

// ---------------------------------------------------------------------------
// Stock lot lookup (existing inventory endpoint)
// ---------------------------------------------------------------------------

export const listStockLotsForItem = (itemCode: string) =>
  apiClient
    .get<StockLotOption[]>(`/api/v1/inventory/${encodeURIComponent(itemCode)}/lots`, {
      params: { active_only: true },
    })
    .then((r) => r.data)
