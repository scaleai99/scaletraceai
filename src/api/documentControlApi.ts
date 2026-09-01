/**
 * documentControlApi.ts - Document Control (Module 21 QMS) API client.
 *
 * Covers all endpoints at /api/v1/qms/documents:
 * - List, create, get, update documents
 * - Submit for review, approve, reject, obsolete
 *
 * Fields (lines 154-155 erpflow.docx): Number Series, Revision, Effective Date,
 * Record Status, plus Expiry Date, Description, AS9100D Clause.
 */

import axios from 'axios'

const DOC_BASE = '/api/v1/qms/documents'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentControlRecord {
  id: string
  doc_number: string
  doc_type: string | null
  title: string
  revision: string
  status: 'Draft' | 'Under Review' | 'Approved' | 'Obsolete'
  effective_date: string | null
  expiry_date: string | null
  content_path: string | null
  description: string | null
  distribution_list: Array<{ department: string; role: string }> | null
  as9100d_clause: string | null
  approved_by: string | null
  approved_at: string | null
  obsoleted_at: string | null
  created_at: string
  updated_at: string | null
}

export interface DocumentCreate {
  title: string
  doc_type?: string | null
  revision?: string
  effective_date?: string | null
  expiry_date?: string | null
  content_path?: string | null
  description?: string | null
  distribution_list?: Array<{ department: string; role: string }> | null
  as9100d_clause?: string | null
}

export interface DocumentUpdate {
  title?: string
  doc_type?: string | null
  revision?: string
  effective_date?: string | null
  expiry_date?: string | null
  content_path?: string | null
  description?: string | null
  distribution_list?: Array<{ department: string; role: string }> | null
  as9100d_clause?: string | null
}

export interface ApproveRequest {
  effective_date?: string | null
}

export interface RejectRequest {
  comment?: string
}

export interface ListDocumentsParams {
  status?: string
  doc_type?: string
  search?: string
  skip?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** List documents with optional filters */
export async function listDocuments(params: ListDocumentsParams = {}): Promise<DocumentControlRecord[]> {
  const { data } = await axios.get<DocumentControlRecord[]>(DOC_BASE, { params })
  return data
}

/** Create a new document (auto-generates DOC-YYYY-NNNN number) */
export async function createDocument(body: DocumentCreate): Promise<DocumentControlRecord> {
  const { data } = await axios.post<DocumentControlRecord>(DOC_BASE, body)
  return data
}

/** Get a single document by ID */
export async function getDocument(id: string): Promise<DocumentControlRecord> {
  const { data } = await axios.get<DocumentControlRecord>(`${DOC_BASE}/${id}`)
  return data
}

/** Update document fields (blocked if Approved/Obsolete → returns 409) */
export async function updateDocument(id: string, body: DocumentUpdate): Promise<DocumentControlRecord> {
  const { data } = await axios.patch<DocumentControlRecord>(`${DOC_BASE}/${id}`, body)
  return data
}

/** Submit document for review (Draft → Under Review) */
export async function submitForReview(id: string): Promise<DocumentControlRecord> {
  const { data } = await axios.post<DocumentControlRecord>(`${DOC_BASE}/${id}/submit-for-review`)
  return data
}

/** Approve document (Quality_Manager only, Under Review → Approved) */
export async function approveDocument(id: string, body: ApproveRequest = {}): Promise<DocumentControlRecord> {
  const { data } = await axios.post<DocumentControlRecord>(`${DOC_BASE}/${id}/approve`, body)
  return data
}

/** Reject document - send back to Draft (Under Review → Draft) */
export async function rejectDocument(id: string, body: RejectRequest = {}): Promise<DocumentControlRecord> {
  const { data } = await axios.post<DocumentControlRecord>(`${DOC_BASE}/${id}/reject`, body)
  return data
}

/** Obsolete document (Quality_Manager only, Approved → Obsolete) */
export async function obsoleteDocument(id: string): Promise<DocumentControlRecord> {
  const { data } = await axios.post<DocumentControlRecord>(`${DOC_BASE}/${id}/obsolete`)
  return data
}
