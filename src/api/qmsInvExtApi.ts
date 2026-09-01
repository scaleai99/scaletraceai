import { apiClient } from './axiosClient'

// ── QMS ext ─────────────────────────────────────────────────────────────────
export interface APQPElement { name: string; status: string }
export interface APQPPackage { id: string; part_number: string; customer?: string | null; ppap_level: number; phase: string; elements: APQPElement[]; status: string; submission_date?: string | null }
export const listApqp = () => apiClient.get<APQPPackage[]>('/api/v1/qms-ext/apqp').then(r => r.data)
export const createApqp = (b: { part_number: string; customer?: string; ppap_level?: number }) => apiClient.post<APQPPackage>('/api/v1/qms-ext/apqp', b).then(r => r.data)
export const updateApqp = (id: string, b: Partial<APQPPackage>) => apiClient.patch<APQPPackage>(`/api/v1/qms-ext/apqp/${id}`, b).then(r => r.data)

export interface InternalAudit { id: string; audit_no: string; audit_type: string; area?: string | null; auditor?: string | null; planned_date?: string | null; completed_date?: string | null; findings_major: number; findings_minor: number; observations: number; status: string; notes?: string | null }
export const listAudits = () => apiClient.get<InternalAudit[]>('/api/v1/qms-ext/audits').then(r => r.data)
export const createAudit = (b: { audit_type: string; area?: string; auditor?: string; planned_date?: string }) => apiClient.post<InternalAudit>('/api/v1/qms-ext/audits', b).then(r => r.data)
export const updateAudit = (id: string, b: Partial<InternalAudit>) => apiClient.patch<InternalAudit>(`/api/v1/qms-ext/audits/${id}`, b).then(r => r.data)

export interface ManagementReview { id: string; review_date: string; chaired_by?: string | null; attendees?: string | null; agenda?: string | null; decisions?: string | null; action_items: { action: string; owner?: string; due?: string }[]; status: string }
export const listMrm = () => apiClient.get<ManagementReview[]>('/api/v1/qms-ext/management-reviews').then(r => r.data)
export const createMrm = (b: { review_date: string; chaired_by?: string; attendees?: string; agenda?: string }) => apiClient.post<ManagementReview>('/api/v1/qms-ext/management-reviews', b).then(r => r.data)
export const updateMrm = (id: string, b: Partial<ManagementReview>) => apiClient.patch<ManagementReview>(`/api/v1/qms-ext/management-reviews/${id}`, b).then(r => r.data)

// ── Inventory ext ────────────────────────────────────────────────────────────
export interface StockBin { id: string; bin_code: string; warehouse?: string | null; zone?: string | null; description?: string | null; capacity?: number | null; status: string }
export const listBins = () => apiClient.get<StockBin[]>('/api/v1/inventory-ext/bins').then(r => r.data)
export const createBin = (b: Partial<StockBin>) => apiClient.post<StockBin>('/api/v1/inventory-ext/bins', b).then(r => r.data)

export interface InternalTransfer { id: string; transfer_no: string; item_code: string; quantity: number; from_bin?: string | null; to_bin?: string | null; transfer_date?: string | null; reason?: string | null; status: string }
export const listTransfers = () => apiClient.get<InternalTransfer[]>('/api/v1/inventory-ext/transfers').then(r => r.data)
export const createTransfer = (b: { item_code: string; quantity: number; from_bin?: string; to_bin?: string; transfer_date?: string; reason?: string }) => apiClient.post<InternalTransfer>('/api/v1/inventory-ext/transfers', b).then(r => r.data)
export const completeTransfer = (id: string) => apiClient.post<InternalTransfer>(`/api/v1/inventory-ext/transfers/${id}/complete`).then(r => r.data)

export interface CycleCount { id: string; count_no: string; item_code: string; bin_code?: string | null; system_qty: number; counted_qty: number; variance: number; count_date?: string | null; status: string; notes?: string | null }
export const listCounts = () => apiClient.get<CycleCount[]>('/api/v1/inventory-ext/cycle-counts').then(r => r.data)
export const createCount = (b: { item_code: string; bin_code?: string; system_qty: number; counted_qty: number; count_date?: string; notes?: string }) => apiClient.post<CycleCount>('/api/v1/inventory-ext/cycle-counts', b).then(r => r.data)
export const adjustCount = (id: string) => apiClient.post<CycleCount>(`/api/v1/inventory-ext/cycle-counts/${id}/adjust`).then(r => r.data)
