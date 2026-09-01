import { apiClient } from './axiosClient'

/** A configuration or contract review row (both share these core fields). */
export interface ReviewRow {
  id: string
  review_type: string // 'RFQ' | 'PO'
  linked_id: string
  overall_outcome: string | null
  reviewed_at: string | null
  approver_id: string | null
  approved_at: string | null
  created_at: string
  // config-only
  frozen_config?: unknown
  deviations?: unknown[] | null
  // contract-only
  conditions_accepted?: string | null
  checklist?: unknown[]
}

export type ReviewStatus = 'Approved' | 'Reviewed' | 'Pending'

export const listConfigReviews = (reviewType?: string) =>
  apiClient
    .get<ReviewRow[]>('/api/v1/config-reviews/', {
      params: reviewType ? { review_type: reviewType } : {},
    })
    .then((r) => r.data)

export const listContractReviews = (reviewType?: string) =>
  apiClient
    .get<ReviewRow[]>('/api/v1/contract-reviews/', {
      params: reviewType ? { review_type: reviewType } : {},
    })
    .then((r) => r.data)

export function reviewStatus(r: ReviewRow): ReviewStatus {
  if (r.approved_at) return 'Approved'
  if (r.reviewed_at || r.overall_outcome) return 'Reviewed'
  return 'Pending'
}

/** RFQ vs PO stage → the friendly gate name shown in the diagram. */
export function stageLabel(reviewType: string): string {
  return reviewType === 'PO' ? 'PO Stage' : 'RFQ Stage'
}
