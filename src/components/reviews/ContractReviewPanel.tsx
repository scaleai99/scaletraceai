/**
 * ContractReviewPanel - Module 07/12: Contract Review checklist UI.
 *
 * Renders the feasibility/contract-review checklist as an expandable panel.
 * - Collapsed by default; auto-expands when the linked RFQ is at the
 *   "Contract Review-1" stage.
 * - Each checklist item has a pass/fail toggle and a comment textarea that
 *   appears when the item is set to "fail".
 * - Overall outcome selector drives the "Submit Review" action.
 *  "Approve" button is shown only to Quality_Manager users.
 *
 * Props
 * -----
 * rfqId          - UUID of the linked RFQ (used to create/list reviews)
 * reviewId       - UUID of an existing review (null = none yet)
 * rfqStatus      - current RFQ status string (auto-expand trigger)
 * onComplete     - called after a successful approve action
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChecklistItem {
  section: string
  check: string
  result: 'pass' | 'fail' | null
  comment: string | null
}

interface ContractReview {
  id: string
  review_type: string
  linked_id: string
  checklist: ChecklistItem[]
  overall_outcome: string | null
  conditions_accepted: string | null
  reviewer_id: string | null
  reviewed_at: string | null
  approver_id: string | null
  approved_at: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Section grouping helper
// ---------------------------------------------------------------------------

interface SectionGroup {
  section: string
  items: Array<{ index: number; item: ChecklistItem }>
}

function groupBySection(checklist: ChecklistItem[]): SectionGroup[] {
  const map = new Map<string, Array<{ index: number; item: ChecklistItem }>>()
  checklist.forEach((item, index) => {
    const group = map.get(item.section) ?? []
    group.push({ index, item })
    map.set(item.section, group)
  })
  return Array.from(map.entries()).map(([section, items]) => ({ section, items }))
}

// ---------------------------------------------------------------------------
// Outcome options per review_type
// ---------------------------------------------------------------------------

const RFQ_OUTCOMES = [
  { value: 'Feasible', label: 'Feasible' },
  { value: 'Feasible with Conditions', label: 'Feasible with Conditions' },
  { value: 'Not Feasible', label: 'Not Feasible' },
]
const PO_OUTCOMES = [
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Rejected', label: 'Rejected' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ContractReviewPanelProps {
  rfqId: string
  reviewId: string | null
  /** Current RFQ status - panel auto-expands at "Contract Review-1=" */
  rfqStatus?: string
  /** Whether the current user has Quality_Manager role */
  isQualityManager?: boolean
  onComplete?: () => void
}

export function ContractReviewPanel({
  rfqId,
  reviewId: initialReviewId,
  rfqStatus,
  isQualityManager = false,
  onComplete,
}: ContractReviewPanelProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const autoExpand = rfqStatus === 'Contract Review-1'
  const [expanded, setExpanded] = useState(autoExpand)
  const [review, setReview] = useState<ContractReview | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(initialReviewId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local editable copy of the checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [outcome, setOutcome] = useState<string>('')
  const [conditions, setConditions] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Load review on mount / reviewId change
  // ---------------------------------------------------------------------------
  const loadReview = useCallback(async () => {
    if (!reviewId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/contract-reviews/${reviewId}`)
      if (!res.ok) throw new Error(await res.text())
      const data: ContractReview = await res.json()
      setReview(data)
      setChecklist(data.checklist ?? [])
      setOutcome(data.overall_outcome ?? '')
      setConditions(data.conditions_accepted ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load review')
    } finally {
      setLoading(false)
    }
  }, [reviewId])

  useEffect(() => {
    if (reviewId) {
      loadReview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId])

  useEffect(() => {
    if (autoExpand) setExpanded(true)
  }, [autoExpand])

  // ---------------------------------------------------------------------------
  // Create review
  // ---------------------------------------------------------------------------
  const handleCreateReview = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/contract-reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_type: 'RFQ', linked_id: rfqId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: ContractReview = await res.json()
      setReviewId(data.id)
      setReview(data)
      setChecklist(data.checklist ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create review')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Toggle pass/fail for a checklist item
  // ---------------------------------------------------------------------------
  const handleToggleResult = (index: number, value: 'pass' | 'fail') => {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, result: item.result === value ? null : value }
          : item
      )
    )
  }

  const handleCommentChange = (index: number, comment: string) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, comment } : item))
    )
  }

  // ---------------------------------------------------------------------------
  // Submit review (PATCH)
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!reviewId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/contract-reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist,
          overall_outcome: outcome || undefined,
          conditions_accepted: conditions || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: ContractReview = await res.json()
      setReview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Approve
  // ---------------------------------------------------------------------------
  const handleApprove = async () => {
    if (!reviewId) return
    setApproving(true)
    setError(null)
    try {
      // Save checklist first
      await fetch(`/api/v1/contract-reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist,
          overall_outcome: outcome || undefined,
          conditions_accepted: conditions || undefined,
        }),
      })
      // Then approve
      const res = await fetch(`/api/v1/contract-reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // NOTE: approver_id would come from the auth context in production
        body: JSON.stringify({
          approver_id: '00000000-0000-0000-0000-000000000000',
          conditions_accepted: conditions || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: ContractReview = await res.json()
      setReview(data)
      onComplete?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve review')
    } finally {
      setApproving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const isApproved = !!review?.approved_at
  const outcomeOptions = review?.review_type === 'PO' ? PO_OUTCOMES : RFQ_OUTCOMES
  const groups = groupBySection(checklist)
  const passCount = checklist.filter((c) => c.result === 'pass').length
  const failCount = checklist.filter((c) => c.result === 'fail').length
  const totalChecks = checklist.length
  const needsConditions = outcome === 'Feasible with Conditions'

  // Outcome badge variant
  const outcomeBadgeVariant =
    outcome === 'Feasible' || outcome === 'Accepted'
      ? 'success'
      : outcome === 'Not Feasible' || outcome === 'Rejected'
      ? 'danger'
      : outcome === 'Feasible with Conditions'
      ? 'warning'
      : 'default'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-3">
          <ClipboardList size={18} className="text-amber-600 shrink-0" />
          <span className="font-semibold text-gray-900 text-sm">
            Contract Review-1
          </span>
          {isApproved && (
            <Badge variant="success" size="sm">
              Approved
            </Badge>
          )}
          {!isApproved && review && (
            <Badge variant="info" size="sm">
              {passCount}/{totalChecks} checked
            </Badge>
          )}
        </span>
        {expanded ? (
          <ChevronDown size={16} className="text-gray-500 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-gray-500 shrink-0" />
        )}
      </button>

      {/* Body */}
      {expanded && (
        <div className="p-5 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* No review yet - create */}
          {!review && !loading && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">
                No contract review created yet for this RFQ.
              </p>
              <Button
                onClick={handleCreateReview}
                loading={saving}
                icon={<ClipboardList size={14} />}
              >
                Create Contract Review
              </Button>
            </div>
          )}

          {loading && (
            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
          )}

          {/* Checklist */}
          {review && groups.length > 0 && (
            <div className="space-y-6">
              {groups.map(({ section, items }) => (
                <div key={section}>
                  {/* Section header */}
                  <div className="mb-3 pb-1.5 border-b border-gray-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {section}
                    </span>
                  </div>

                  {/* Check rows */}
                  <div className="space-y-3">
                    {items.map(({ index, item }) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-start gap-3">
                          {/* Check text */}
                          <span className="flex-1 text-sm text-gray-700 leading-snug">
                            {item.check}
                          </span>
                          {/* Pass / Fail toggles */}
                          {!isApproved && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleToggleResult(index, 'pass')}
                                title="Pass"
                                aria-label={`Pass: ${item.check}`}
                                className={cn(
                                  'p-1 rounded-full transition-colors',
                                  item.result === 'pass'
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-gray-300 hover:text-green-500'
                                )}
                              >
                                <CheckCircle2 size={20} />
                              </button>
                              <button
                                onClick={() => handleToggleResult(index, 'fail')}
                                title="Fail"
                                aria-label={`Fail: ${item.check}`}
                                className={cn(
                                  'p-1 rounded-full transition-colors',
                                  item.result === 'fail'
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-gray-300 hover:text-red-500'
                                )}
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          )}
                          {/* Read-only result badge when approved */}
                          {isApproved && item.result && (
                            <Badge
                              variant={item.result === 'pass' ? 'success' : 'danger'}
                              size="sm"
                            >
                              {item.result === 'pass' ? 'Pass' : 'Fail'}
                            </Badge>
                          )}
                        </div>

                        {/* Comment textarea - shown when item is failed */}
                        {item.result === 'fail' && !isApproved && (
                          <textarea
                            value={item.comment ?? ''}
                            onChange={(e) => handleCommentChange(index, e.target.value)}
                            placeholder="Comment / remediation required..."
                            rows={2}
                            className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50 placeholder:text-red-300 resize-none"
                            aria-label={`Comment for: ${item.check}`}
                          />
                        )}
                        {/* Read-only comment when approved */}
                        {isApproved && item.comment && (
                          <p className="text-xs text-gray-500 pl-1 italic">
                            {item.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Summary bar */}
              {!isApproved && (
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 size={13} /> {passCount} pass
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle size={13} /> {failCount} fail
                  </span>
                  <span>{totalChecks - passCount - failCount} pending</span>
                </div>
              )}

              {/* Outcome selector */}
              {!isApproved && (
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">
                    Overall Outcome
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {outcomeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOutcome(opt.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                          outcome === opt.value
                            ? opt.value === 'Feasible' || opt.value === 'Accepted'
                              ? 'bg-green-600 text-white border-green-600'
                              : opt.value === 'Not Feasible' ||
                                opt.value === 'Rejected'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Conditions text area */}
                  {needsConditions && (
                    <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">
                        Conditions Accepted{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={conditions}
                        onChange={(e) => setConditions(e.target.value)}
                        placeholder="Describe the conditions under which this RFQ is feasible..."
                        rows={3}
                        maxLength={2000}
                        className="w-full text-sm border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50 placeholder:text-amber-300 resize-none"
                        aria-label="Conditions accepted"
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">
                        {conditions.length}/2000
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Read-only outcome + conditions when approved */}
              {isApproved && review.overall_outcome && (
                <div className="pt-2 border-t border-gray-200 flex items-center gap-3">
                  <span className="text-sm text-gray-600">Overall Outcome:</span>
                  <Badge variant={outcomeBadgeVariant}>
                    {review.overall_outcome}
                  </Badge>
                  {review.conditions_accepted && (
                    <span className="text-xs text-gray-500 italic">
                      {review.conditions_accepted}
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {!isApproved && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={handleSubmit}
                    loading={saving}
                    disabled={checklist.length === 0}
                  >
                    Save Review
                  </Button>
                  {isQualityManager && outcome && (
                    <Button
                      onClick={handleApprove}
                      loading={approving}
                      disabled={needsConditions && !conditions.trim()}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
