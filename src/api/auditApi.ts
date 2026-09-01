/**
 * auditApi.ts - Axios API client for the Global Audit Trail.
 *
 * Read-only, cross-module compliance view over the shared AuditLog table.
 * Administrator-only on the backend (no dedicated Auditor role exists yet).
 */

import { apiClient } from './axiosClient'

const BASE = '/api/v1/audit-trail'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditTrailItem {
  event_id: string
  timestamp: string
  user_id?: string | null
  user_name: string
  user_role?: string | null
  action: string
  nav_group: string
  page_label: string
  record_type: string
  record_id?: string | null
  changed_fields?: string[] | null
  previous_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
}

export interface AuditTrailPage {
  items: AuditTrailItem[]
  total: number
}

export interface AuditModuleSummary {
  nav_group: string
  page_label: string
  record_type: string
  count: number
}

export interface AuditTrailListParams {
  nav_group?: string
  record_type?: string
  action?: string
  user_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function listAuditTrail(params: AuditTrailListParams = {}): Promise<AuditTrailPage> {
  const { data } = await apiClient.get<AuditTrailPage>(`${BASE}/`, { params })
  return data
}

export async function listAuditModules(): Promise<AuditModuleSummary[]> {
  const { data } = await apiClient.get<AuditModuleSummary[]>(`${BASE}/modules`)
  return data
}
