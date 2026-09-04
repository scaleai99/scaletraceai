/**
 * Export-control (ITAR / EAR) API client.
 * Backend: app/api/export_control.py — restricted-party screening, per-part
 * classification, licenses, and the deemed-export access check + access log.
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/export-control'

export interface Screening {
  id: string
  party_type: string
  party_id: string | null
  party_name: string | null
  lists: string
  screened_date: string | null
  result: 'clear' | 'rescreen due' | 'hit' | string
  screened_by: string | null
  notes: string | null
  status: string
  created_at: string | null
}

export interface Classification {
  id: string
  linked_type: string | null
  linked_id: string | null
  part_ref: string | null
  jurisdiction: 'ITAR' | 'EAR' | 'Not controlled' | string
  authority: string | null
  usml_category: string | null
  eccn: string | null
  basis: string | null
  cj_reference: string | null
  marking: string | null
  determined_by: string | null
  determined_date: string | null
  status: string
  created_at: string | null
}

export interface ExportLicense {
  id: string
  license_ref: string
  license_type: string
  status: 'active' | 'expired' | 'not required' | 'pending' | string
  scope: string | null
  parties: string | null
  named_persons: string[] | null
  expires: string | null
  value: string | null
  used: string | null
  record_status: string
  created_at: string | null
}

export interface AccessLogEntry {
  id: string
  at: string | null
  person_id: string | null
  who: string | null
  what: string | null
  linked_type: string | null
  linked_id: string | null
  basis: string | null
  result: string
}

export interface AccessDecision {
  allow: boolean
  level: string
  reason: string
  basis: string
  result: string
}

export const listScreenings = (params?: { party_type?: string; party_id?: string }) =>
  apiClient.get<Screening[]>(`${BASE}/screenings`, { params }).then((r) => r.data)
export const createScreening = (body: Partial<Screening>) =>
  apiClient.post<Screening>(`${BASE}/screenings`, body).then((r) => r.data)

export const listClassifications = (params?: { linked_id?: string }) =>
  apiClient.get<Classification[]>(`${BASE}/classifications`, { params }).then((r) => r.data)
export const createClassification = (body: Partial<Classification>) =>
  apiClient.post<Classification>(`${BASE}/classifications`, body).then((r) => r.data)

export const listLicenses = () =>
  apiClient.get<ExportLicense[]>(`${BASE}/licenses`).then((r) => r.data)
export const createLicense = (body: Partial<ExportLicense>) =>
  apiClient.post<ExportLicense>(`${BASE}/licenses`, body).then((r) => r.data)

export const listAccessLog = (limit = 100) =>
  apiClient.get<AccessLogEntry[]>(`${BASE}/access-log`, { params: { limit } }).then((r) => r.data)
export const accessCheck = (body: { person_id: string; what?: string; linked_type?: string; linked_id?: string }) =>
  apiClient.post<AccessDecision>(`${BASE}/access-check`, body).then((r) => r.data)
