/**
 * ConfigReviewPanel - Module 08/13: Configuration Review checklist UI.
 *
 * Similar structure to ContractReviewPanel but tailored for drawing /
 * configuration verification.  Key differences:
 * - Flat checklist (no sections)
 * - Frozen config banner showing drawing number + revision prominently
 * - Mismatch warning banner when the frozen revision differs from the RFQ
 *   line-item revision
 * - Deviations list - each deviation has item, description, disposition
 * - Outcome: Approved / Approved with Deviations / Rejected
 *
 * Props
 * -----
 * rfqId                - UUID of the linked RFQ
 * reviewId             - UUID of an existing review (null = none yet)
 * rfqStatus            - current RFQ status (auto-expand trigger)
 * expectedDrawingNumber - drawing number from the RFQ line item (for mismatch check)
 * expectedRevision     - drawing revision from the RFQ line item
 * isQualityManager     - whether current user can approve
 * onComplete           - called after approve
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfigCheckItem {
  check: string
  result: 'pass' | 'fail' | null
  comment: string | null
}

interface DeviationItem {
  item: string
  description: string
  disposition: string | null
}

interface FrozenConfig {
  drawing_number: string | null
  revision: string | null
  specs: string[]
  bom: unknown[]
}

interface ConfigReview {
  id: string
  review_type: string
  linked_id: string
  frozen_config: FrozenConfig | null
  checklist: ConfigCheckItem[]
  deviations: DeviationItem[]
  overall_outcome: string | null
  reviewer_id: string | null
  reviewed_at: string | null
  approver_id: string | null
  approved_at: string | null
  created_at: string
}

const CONFIG_OUTCOMES = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Approved with Deviations', label: 'Approved with Deviations' },
  { value: 'Rejected', label: 'Rejected' },
]

const BLANK_DEVIATION: DeviationItem = {
  item: '',
  description: '',
  disposition: null,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ConfigReviewPanelProps {
  rfqId: string
  reviewId: string | null
  rfqStatus?: string
  expectedDrawingNumber?: string | null
  expectedRevision?: string | null
  isQualityManager?: boolean
  onComplete?: () => void
}

export function ConfigReviewPanel({
  rfqId,
  reviewId: initialReviewId,
  rfqStatus,
  expectedDrawingNumber,
  expectedRevision,
  isQualityManager = false,
  onComplete,
}: ConfigReviewPanelProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const autoExpand = rfqStatus === 'Configuration Review-1'
  const [expanded, setExpanded] = useState(autoExpand)
  const [review, setReview] = useState<ConfigReview | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(initialReviewId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local editable state
  const [checklist, setChecklist] = useState<ConfigCheckItem[]>([])
  const [deviations, setDeviations] = useState<DeviationItem[]>([])
  const [outcome, setOutcome] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Load review
  // ---------------------------------------------------------------------------
  const loadReview = useCallback(async () => {
    if (!reviewId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/config-reviews/${reviewId}`)
      if (!res.ok) throw new Error(await res.text())
      const data: ConfigReview = await res.json()
      setReview(data)
      setChecklist(data.checklist ?? [])
      setDeviations(data.deviations ?? [])
      setOutcome(data.overall_outcome ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load review')
    } finally {
      setLoading(false)
    }
  }, [reviewId])

  useEffect(() => {
    if (reviewId) loadReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId])

  useEffect(() => {
    if (autoExpand) setExpanded(true)
  }, [autoExpand])

  // ---------------------------------------------------------------------------
  // Create review
  // ---------------------------------------------------------------------------
  const handleCreate = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/config-reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_type: 'RFQ', linked_id: rfqId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: ConfigReview = await res.json()
      setReviewId(data.id)
      setReview(data)
      setChecklist(data.checklist ?? [])
      setDeviations(data.deviations ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create review')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Checklist helpers
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

  const handleCheckComment = (index: number, comment: string) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, comment } : item))
    )
  }

  // ---------------------------------------------------------------------------
  // Deviation helpers
  // ---------------------------------------------------------------------------
  const addDeviation = () => {
    setDeviations((prev) => [...prev, { ...BLANK_DEVIATION }])
  }

  const updateDeviation = (
    index: number,
    field: keyof DeviationItem,
    value: string
  ) => {
    setDeviations((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  const removeDeviation = (index: number) => {
    setDeviations((prev) => prev.filter((_, i) => i !== index))
  }

  // ---------------------------------------------------------------------------
  // Save (PATCH)
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!reviewId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/config-reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist,
          deviations,
          overall_outcome: outcome || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: ConfigReview = await res.json()
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
      await handleSave()
      const res = await fetch(`/api/v1/config-reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver_id: '00000000-0000-0000-0000-000000000000',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: ConfigReview = await res.json()
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
  const frozenConfig = review?.frozen_config
  const frozenRevision = frozenConfig?.revision
  const frozenDrawingNo = frozenConfig?.drawing_number

  // Mismatch detection
  const revisionMismatch =
    frozenRevision &&
    expectedRevision &&
    frozenRevision !== expectedRevision

  const drawingMismatch =
    frozenDrawingNo &&
    expectedDrawingNumber &&
    frozenDrawingNo !== expectedDrawingNumber

  const passCount = checklist.filter((c) => c.result === 'pass').length
  const failCount = checklist.filter((c) => c.result === 'fail').length

  const outcomeBadgeVariant =
    outcome === 'Approved'
      ? 'success'
      : outcome === 'Rejected'
      ? 'danger'
      : outcome === 'Approved with Deviations'
      ? 'warning'
      : 'default'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-3">
          <Settings size={18} className="text-amber-600 shrink-0" />
          <span className="font-semibold text-gray-900 text-sm">
            Configuration Review-1
          </span>
          {isApproved && <Badge variant="success" size="sm">Approved</Badge>}
          {!isApproved && review && (
            <Badge variant="info" size="sm">
              {passCount}/{checklist.length} checked
            </Badge>
          )}
          {(revisionMismatch || drawingMismatch) && (
            <Badge variant="danger" size="sm">
              Mismatch
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
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* No review yet */}
          {!review && !loading && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">
                No configuration review created yet.
              </p>
              <Button
                onClick={handleCreate}
                loading={saving}
                icon={<Settings size={14} />}
              >
                Create Configuration Review
              </Button>
            </div>
          )}

          {loading && (
            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
          )}

          {review && (
            <div className="space-y-5">
              {/* Frozen config banner */}
              {frozenConfig && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={14} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Frozen Configuration Baseline
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Drawing Number</span>
                      <p className="font-mono font-semibold text-gray-900">
                        {frozenDrawingNo ?? '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Revision</span>
                      <p className="font-mono font-semibold text-gray-900">
                        {frozenRevision ?? '-'}
                      </p>
                    </div>
                  </div>
                  {frozenConfig.specs && frozenConfig.specs.length > 0 && (
                    <div>
                      <span className="text-gray-500 text-xs block mb-1">
                        Specifications
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {frozenConfig.specs.map((spec, i) => (
                          <Badge key={i} variant="info" size="sm">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mismatch warning banners */}
              {drawingMismatch && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Drawing number mismatch:</strong> frozen config has{' '}
                    <code className="font-mono">{frozenDrawingNo}</code> but RFQ
                    specifies{' '}
                    <code className="font-mono">{expectedDrawingNumber}</code>.
                  </span>
                </div>
              )}
              {revisionMismatch && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Revision mismatch:</strong> frozen config has revision{' '}
                    <code className="font-mono">{frozenRevision}</code> but RFQ
                    specifies{' '}
                    <code className="font-mono">{expectedRevision}</code>.
                  </span>
                </div>
              )}

              {/* Flat checklist */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1.5 border-b border-gray-200">
                  Checklist
                </p>
                <div className="space-y-3">
                  {checklist.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-start gap-3">
                        <span className="flex-1 text-sm text-gray-700 leading-snug">
                          {item.check}
                        </span>
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
                        {isApproved && item.result && (
                          <Badge
                            variant={item.result === 'pass' ? 'success' : 'danger'}
                            size="sm"
                          >
                            {item.result === 'pass' ? 'Pass' : 'Fail'}
                          </Badge>
                        )}
                      </div>

                      {item.result === 'fail' && !isApproved && (
                        <textarea
                          value={item.comment ?? ''}
                          onChange={(e) =>
                            handleCheckComment(index, e.target.value)
                          }
                          placeholder="Explain the failure / required action..."
                          rows={2}
                          className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50 placeholder:text-red-300 resize-none"
                          aria-label={`Comment for: ${item.check}`}
                        />
                      )}
                      {isApproved && item.comment && (
                        <p className="text-xs text-gray-500 pl-1 italic">
                          {item.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {!isApproved && checklist.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 size={13} /> {passCount} pass
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle size={13} /> {failCount} fail
                    </span>
                    <span>
                      {checklist.length - passCount - failCount} pending
                    </span>
                  </div>
                )}
              </div>

              {/* Deviations */}
              {!isApproved && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Deviations
                    </p>
                    <button
                      onClick={addDeviation}
                      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                      type="button"
                    >
                      <Plus size={12} /> Add Deviation
                    </button>
                  </div>
                  {deviations.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No deviations recorded.</p>
                  )}
                  {deviations.map((dev, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-3 gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg items-start"
                    >
                      <input
                        value={dev.item}
                        onChange={(e) => updateDeviation(i, 'item', e.target.value)}
                        placeholder="Item"
                        className="text-xs border border-amber-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                        aria-label="Deviation item"
                      />
                      <input
                        value={dev.description}
                        onChange={(e) =>
                          updateDeviation(i, 'description', e.target.value)
                        }
                        placeholder="Description"
                        className="text-xs border border-amber-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                        aria-label="Deviation description"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={dev.disposition ?? ''}
                          onChange={(e) =>
                            updateDeviation(i, 'disposition', e.target.value)
                          }
                          className="flex-1 text-xs border border-amber-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                          aria-label="Disposition"
                        >
                          <option value="">Disposition...</option>
                          <option value="Accept">Accept</option>
                          <option value="Reject">Reject</option>
                          <option value="Waiver">Waiver</option>
                        </select>
                        <button
                          onClick={() => removeDeviation(i)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove deviation ${i + 1}`}
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isApproved && deviations.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Deviations Recorded
                  </p>
                  <div className="space-y-2">
                    {deviations.map((dev, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-xs text-gray-700"
                      >
                        <Badge variant="warning" size="sm">
                          {dev.disposition ?? 'No disposition'}
                        </Badge>
                        <span>
                          <strong>{dev.item}</strong>: {dev.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outcome selector */}
              {!isApproved && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">
                    Overall Outcome
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONFIG_OUTCOMES.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOutcome(opt.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                          outcome === opt.value
                            ? opt.value === 'Approved'
                              ? 'bg-green-600 text-white border-green-600'
                              : opt.value === 'Rejected'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved - read-only outcome */}
              {isApproved && review.overall_outcome && (
                <div className="pt-2 border-t border-gray-200 flex items-center gap-3">
                  <span className="text-sm text-gray-600">Overall Outcome:</span>
                  <Badge variant={outcomeBadgeVariant}>
                    {review.overall_outcome}
                  </Badge>
                </div>
              )}

              {/* Action buttons */}
              {!isApproved && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={handleSave}
                    loading={saving}
                  >
                    Save Review
                  </Button>
                  {isQualityManager && outcome && (
                    <Button onClick={handleApprove} loading={approving}>
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
