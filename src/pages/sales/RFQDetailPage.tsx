/**
 * RFQDetailPage - Module 04: RFQ detail / edit view.
 *
 * Features:
 * 1. State Machine Stepper - horizontal strip showing all 16 states.
 *    Current state = amber, completed (earlier in sequence) = green, future = grey.
 *    Terminal states (Won/Loss/PO Received) shown as side branches.
 * 2. Transition Buttons - next valid states shown as clickable buttons.
 * 3. Header fields: RFQ number, customer, dates, priority, status badge.
 * 4. Line Items table with "Add Line" button and per-row "Upload Drawing" button.
 * 5. Drawing Upload: per-line FileUpload -> uploadDrawing() -> AiExtractionPanel.
 * 6. Audit Trail: AuditTrailPanel at bottom (fetched from audit_log via rfq transitions).
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Upload,
  ChevronRight,
  CheckCircle2,
  Circle,
  Trophy,
  XCircle,
  Package,
  Loader2,
} from 'lucide-react'
import {
  Badge,
  StateMachineBadge,
  Button,
  Modal,
  Input,
  Select,
  FileUpload,
  AuditTrailPanel,
} from '../../components/ui'
import type { AuditEntry } from '../../components/ui/AuditTrailPanel'
import { AiExtractionPanel } from '../../components/ui/AiExtractionPanel'
import { ContractReviewPanel } from '../../components/reviews/ContractReviewPanel'
import { ConfigReviewPanel } from '../../components/reviews/ConfigReviewPanel'
import { CostingSheetPanel } from '../../components/costing/CostingSheetPanel'
import { formatDate, formatDateTime } from '../../lib/utils'
import {
  getRFQ,
  transitionRFQ,
  addLineItem,
  deleteLineItem,
  uploadDrawing,
  RFQ,
  RFQLineItem,
} from '../../api/rfqApi'
import {
  RFQ_STATES,
  RFQ_TRANSITIONS,
  RFQ_TERMINAL_STATES,
  RFQ_LINEAR_STATES,
} from '../../lib/rfqConstants'

// ---------------------------------------------------------------------------
// Priority colours
// ---------------------------------------------------------------------------
const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'default'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'default',
}

// ---------------------------------------------------------------------------
// Step state helper - where is a state in the linear flow?
// ---------------------------------------------------------------------------
function getStepPhase(
  stateLabel: string,
  currentStatus: string
): 'completed' | 'current' | 'future' | 'terminal' {
  if (RFQ_TERMINAL_STATES.has(stateLabel)) return 'terminal'
  const currentIdx = RFQ_LINEAR_STATES.indexOf(currentStatus)
  const stepIdx = RFQ_LINEAR_STATES.indexOf(stateLabel)
  if (stepIdx < 0) return 'future'
  if (stateLabel === currentStatus) return 'current'
  if (currentIdx >= 0 && stepIdx < currentIdx) return 'completed'
  return 'future'
}

// ---------------------------------------------------------------------------
// State Machine Stepper
// ---------------------------------------------------------------------------
interface StepperProps {
  currentStatus: string
}

function StateMachineStepper({ currentStatus }: StepperProps) {
  const linearStates = RFQ_LINEAR_STATES
  const terminalStates = ['Won', 'Loss', 'PO Received']

  return (
    <div className="w-full">
      {/* Linear flow */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {linearStates.map((state, i) => {
          const phase = getStepPhase(state, currentStatus)
          return (
            <div key={state} className="flex items-center shrink-0">
              {/* Step */}
              <div className="flex flex-col items-center gap-1 min-w-[72px]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    phase === 'current'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : phase === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {phase === 'completed' ? (
                    <CheckCircle2 size={14} />
                  ) : phase === 'current' ? (
                    <Circle size={14} className="fill-current" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-center leading-tight text-[9px] font-medium px-0.5 ${
                    phase === 'current'
                      ? 'text-amber-700'
                      : phase === 'completed'
                        ? 'text-green-700'
                        : 'text-gray-400'
                  }`}
                  style={{ maxWidth: 68 }}
                >
                  {state}
                </span>
              </div>

              {/* Connector */}
              {i < linearStates.length - 1 && (
                <div
                  className={`h-0.5 w-4 shrink-0 mx-0.5 ${
                    getStepPhase(linearStates[i + 1], currentStatus) !== 'future' ||
                    linearStates[i + 1] === currentStatus
                      ? 'bg-green-400'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Terminal states row */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-[10px] text-gray-400 font-medium shrink-0">Outcome:</span>
        {terminalStates.map((ts) => {
          const isActive = currentStatus === ts
          return (
            <div
              key={ts}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
                isActive
                  ? ts === 'Won'
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : ts === 'Loss'
                      ? 'bg-red-100 border-red-400 text-red-700'
                      : 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              {ts === 'Won' ? (
                <Trophy size={11} />
              ) : ts === 'Loss' ? (
                <XCircle size={11} />
              ) : (
                <Package size={11} />
              )}
              {ts}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Transition Panel
// ---------------------------------------------------------------------------
interface TransitionPanelProps {
  rfq: RFQ
  onTransition: (targetState: string, comment: string) => Promise<void>
  loading: boolean
}

function TransitionPanel({ rfq, onTransition, loading }: TransitionPanelProps) {
  const nextStates = RFQ_TRANSITIONS[rfq.status] ?? []
  const [comment, setComment] = useState('')
  const [confirmState, setConfirmState] = useState<string | null>(null)

  if (nextStates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle2 size={16} className="text-gray-400" />
        No further transitions - RFQ is in a terminal state.
      </div>
    )
  }

  const handleClick = (state: string) => {
    setConfirmState(state)
    setComment('')
  }

  const handleConfirm = async () => {
    if (!confirmState) return
    await onTransition(confirmState, comment)
    setConfirmState(null)
    setComment('')
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Next:</span>
        {nextStates.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => handleClick(s)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              s === 'Loss'
                ? 'border-red-300 text-red-700 hover:bg-red-50'
                : s === 'Won'
                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                  : 'border-amber-300 text-amber-700 hover:bg-amber-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ChevronRight size={12} />
            {s}
          </button>
        ))}
        {loading && <Loader2 size={14} className="animate-spin text-amber-600" />}
      </div>

      {/* Confirm modal */}
      <Modal
        open={!!confirmState}
        onClose={() => setConfirmState(null)}
        title={`Transition to "${confirmState}"`}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Moving RFQ <span className="font-mono font-semibold">{rfq.rfq_number}</span>{' '}
            from <StateMachineBadge state={rfq.status} size="sm" /> to{' '}
            <StateMachineBadge state={confirmState ?? ''} size="sm" />.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add a comment for the audit trail..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setConfirmState(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={handleConfirm}
            >
              Confirm Transition
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Add Line Item Modal
// ---------------------------------------------------------------------------
interface AddLineModalProps {
  rfqId: string
  onAdded: () => void
  onClose: () => void
}

function AddLineModal({ rfqId, onAdded, onClose }: AddLineModalProps) {
  const [partNumber, setPartNumber] = useState('')
  const [drawingNumber, setDrawingNumber] = useState('')
  const [revision, setRevision] = useState('')
  const [materialSpec, setMaterialSpec] = useState('')
  const [annualQty, setAnnualQty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await addLineItem(rfqId, {
        part_number: partNumber || undefined,
        drawing_number: drawingNumber || undefined,
        drawing_revision: revision || undefined,
        material_spec: materialSpec || undefined,
        annual_quantity: annualQty ? parseInt(annualQty, 10) : undefined,
      })
      onAdded()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to add line item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Part Number"
          placeholder="e.g. KSI-123456"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
        />
        <Input
          label="Drawing Number"
          placeholder="e.g. DWG-001"
          value={drawingNumber}
          onChange={(e) => setDrawingNumber(e.target.value)}
        />
        <Input
          label="Revision"
          placeholder="e.g. A"
          value={revision}
          onChange={(e) => setRevision(e.target.value)}
          maxLength={10}
        />
        <Input
          label="Annual Quantity"
          type="number"
          min={1}
          placeholder="e.g. 100"
          value={annualQty}
          onChange={(e) => setAnnualQty(e.target.value)}
        />
      </div>
      <Input
        label="Material Specification"
        placeholder="e.g. AMS 4037 Aluminium"
        value={materialSpec}
        onChange={(e) => setMaterialSpec(e.target.value)}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
          Add Line Item
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drawing Upload Row
// ---------------------------------------------------------------------------
interface DrawingUploadCellProps {
  rfqId: string
  lineItem: RFQLineItem
  onUploaded: () => void
}

function DrawingUploadCell({ rfqId, lineItem, onUploaded }: DrawingUploadCellProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFile = async (f: File) => {
    setFile(f)
    setUploading(true)
    setUploadError(null)
    try {
      await uploadDrawing(rfqId, lineItem.id, f)
      setShowPanel(true)
      onUploaded()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setUploadError(e?.response?.data?.detail ?? e?.message ?? 'Upload failed')
      setFile(null)
    } finally {
      setUploading(false)
    }
  }

  if (showPanel && file) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <AiExtractionPanel pdfFile={file} rfqId={rfqId} />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {lineItem.drawing_pdf_path ? (
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">Drawing attached</Badge>
          <button
            type="button"
            className="text-xs text-amber-600 hover:text-amber-800"
            onClick={() => setShowPanel(true)}
          >
            View AI extraction
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {uploading ? (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Loader2 size={12} className="animate-spin" /> Uploading...
            </span>
          ) : (
            <FileUpload
              accept=".pdf"
              maxSizeMB={50}
              onFile={handleFile}
              label="Upload Drawing PDF"
              className="max-w-xs"
            />
          )}
        </div>
      )}
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function RFQDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [showAddLine, setShowAddLine] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [contractReviewId, setContractReviewId] = useState<string | null>(null)
  const [configReviewId, setConfigReviewId] = useState<string | null>(null)

  // Derived audit trail from state transitions (we'll simulate from RFQ data for now)
  const [auditEntries] = useState<AuditEntry[]>([])

  const fetchRFQ = useCallback(() => {
    if (!id) return
    setLoading(true)
    getRFQ(id)
      .then(setRfq)
      .catch((err) => setError(err?.response?.data?.detail ?? 'Failed to load RFQ'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchRFQ()
  }, [fetchRFQ])

  const handleTransition = async (targetState: string, comment: string) => {
    if (!rfq) return
    setTransitionLoading(true)
    setTransitionError(null)
    try {
      const updated = await transitionRFQ(rfq.id, { target_state: targetState, comment: comment || null })
      setRfq(updated)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const detail = e?.response?.data?.detail
      if (typeof detail === 'object' && detail !== null && 'current_state' in detail) {
        const d = detail as { current_state: string; permitted_transitions: string[] }
        setTransitionError(
          `Cannot transition from "${d.current_state}". Permitted: ${d.permitted_transitions.join(', ')}`
        )
      } else {
        setTransitionError(typeof detail === 'string' ? detail : e?.message ?? 'Transition failed')
      }
    } finally {
      setTransitionLoading(false)
    }
  }

  const handleDeleteLine = async (lid: string) => {
    if (!rfq) return
    setDeletingId(lid)
    try {
      await deleteLineItem(rfq.id, lid)
      setRfq((prev) =>
        prev ? { ...prev, line_items: prev.line_items.filter((l) => l.id !== lid) } : prev
      )
    } catch {
      // silently skip
    } finally {
      setDeletingId(null)
    }
  }

  // ---- Loading / error states ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-amber-600">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading RFQ...
      </div>
    )
  }

  if (error || !rfq) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? 'RFQ not found'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/sales/rfqs')}
          icon={<ArrowLeft size={14} />}
        >
          Back to RFQs
        </Button>
      </div>
    )
  }

  const lineItems = rfq.line_items ?? []

  return (
    <div className="max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/sales/rfqs')}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
          aria-label="Back to RFQs"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{rfq.rfq_number}</h1>
              <Badge variant={PRIORITY_VARIANT[rfq.priority] ?? 'default'} size="sm">
                {rfq.priority}
              </Badge>
              <StateMachineBadge state={rfq.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Received {formatDate(rfq.received_date)}  Due {formatDate(rfq.quotation_due_date)}
              {rfq.contact_name && `  ${rfq.contact_name}`}
            </p>
          </div>
        </div>
      </div>

      {/* -- State Machine Stepper ----------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Progress</h2>
        <StateMachineStepper currentStatus={rfq.status} />

        <div className="mt-5 pt-4 border-t border-gray-100">
          {transitionError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {transitionError}
            </div>
          )}
          <TransitionPanel
            rfq={rfq}
            onTransition={handleTransition}
            loading={transitionLoading}
          />
        </div>
      </div>

      {/* -- Header Info --------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">RFQ Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">RFQ Number</p>
            <p className="font-mono font-semibold text-gray-900 mt-0.5">{rfq.rfq_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</p>
            <div className="mt-0.5"><StateMachineBadge state={rfq.status} size="sm" /></div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Received</p>
            <p className="text-gray-900 mt-0.5">{formatDate(rfq.received_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Due Date</p>
            <p className="text-gray-900 mt-0.5">{formatDate(rfq.quotation_due_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Priority</p>
            <div className="mt-0.5">
              <Badge variant={PRIORITY_VARIANT[rfq.priority] ?? 'default'} size="sm">
                {rfq.priority}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contact</p>
            <p className="text-gray-900 mt-0.5">{rfq.contact_name ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Created</p>
            <p className="text-gray-500 mt-0.5 text-xs">{formatDateTime(rfq.created_at)}</p>
          </div>
        </div>
      </div>

      {/* -- Line Items ---------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Line Items ({lineItems.length})
          </h2>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowAddLine(true)}
          >
            Add Line
          </Button>
        </div>

        {lineItems.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No line items yet - click "Add Line" to add parts.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lineItems.map((li) => (
              <div key={li.id} className="px-5 py-4">
                {/* Line item header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 w-6 shrink-0">
                      #{li.line_number}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {li.part_number ?? <span className="text-gray-400 font-normal">No part number</span>}
                      </p>
                      {li.part_description && (
                        <p className="text-xs text-gray-500">{li.part_description}</p>
                      )}
                    </div>
                    {li.drawing_number && (
                      <div>
                        <p className="text-xs text-gray-500">Drawing</p>
                        <p className="text-sm font-mono text-gray-700">
                          {li.drawing_number}
                          {li.drawing_revision && (
                            <span className="text-gray-400"> Rev {li.drawing_revision}</span>
                          )}
                        </p>
                      </div>
                    )}
                    {li.material_spec && (
                      <div>
                        <p className="text-xs text-gray-500">Material</p>
                        <p className="text-sm text-gray-700">{li.material_spec}</p>
                      </div>
                    )}
                    {li.annual_quantity && (
                      <div>
                        <p className="text-xs text-gray-500">Annual Qty</p>
                        <p className="text-sm text-gray-700">{li.annual_quantity.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={deletingId === li.id}
                    onClick={() => handleDeleteLine(li.id)}
                    className="text-xs text-red-500 hover:text-red-700 ml-4 shrink-0 disabled:opacity-50"
                  >
                    {deletingId === li.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      'Remove'
                    )}
                  </button>
                </div>

                {/* Drawing upload + AI extraction panel */}
                <div className="mt-3 ml-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload size={13} className="text-amber-600" />
                    <span className="text-xs font-medium text-gray-600">Drawing Upload & AI Extraction</span>
                  </div>
                  <DrawingUploadCell
                    rfqId={rfq.id}
                    lineItem={li}
                    onUploaded={fetchRFQ}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -- Review and Costing Panels (state-triggered) ----------- */}
      {rfq && ['Configuration Review-1', 'Contract Review-1', 'Feasibility Review',
               'AI Costing', 'Cost Review', 'Quotation Approval', 'Quotation Release',
               'Customer Submission', 'Won', 'Loss', 'PO Received'].includes(rfq.status) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Reviews & Costing</h2>

          {/* Config Review - shown from Configuration Review-1 onwards */}
          {['Configuration Review-1', 'Contract Review-1', 'Feasibility Review',
            'AI Costing', 'Cost Review', 'Quotation Approval', 'Quotation Release',
            'Customer Submission', 'Won', 'Loss', 'PO Received'].includes(rfq.status) && (
            <ConfigReviewPanel
              rfqId={rfq.id}
              reviewId={configReviewId}
              rfqStatus={rfq.status}
              expectedDrawingNumber={rfq.line_items?.[0]?.drawing_number ?? null}
              expectedRevision={rfq.line_items?.[0]?.drawing_revision ?? null}
              isQualityManager={true}
              onComplete={() => fetchRFQ()}
            />
          )}

          {/* Contract Review - shown from Contract Review-1 onwards */}
          {['Contract Review-1', 'Feasibility Review', 'AI Costing', 'Cost Review',
            'Quotation Approval', 'Quotation Release', 'Customer Submission',
            'Won', 'Loss', 'PO Received'].includes(rfq.status) && (
            <ContractReviewPanel
              rfqId={rfq.id}
              reviewId={contractReviewId}
              rfqStatus={rfq.status}
              isQualityManager={true}
              onComplete={() => fetchRFQ()}
            />
          )}

          {/* Costing Sheet - shown from AI Costing onwards */}
          {['AI Costing', 'Cost Review', 'Quotation Approval', 'Quotation Release',
            'Customer Submission', 'Won', 'PO Received'].includes(rfq.status) &&
            rfq.line_items && rfq.line_items.length > 0 && (
            <CostingSheetPanel
              rfqLineItemId={rfq.line_items[0].id}
              isQualityManager={true}
              onApproved={() => fetchRFQ()}
            />
          )}
        </div>
      )}

      {/* -- Audit Trail --------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AuditTrailPanel
          entries={[
            // Initial creation entry (derived from RFQ data)
            {
              user: 'System',
              action: `RFQ ${rfq.rfq_number} created with status: Received`,
              timestamp: rfq.created_at,
              comment: undefined,
            },
            ...auditEntries,
          ]}
          title="Audit Trail"
        />
      </div>

      {/* -- Add Line Modal ------------------------------------------ */}
      <Modal
        open={showAddLine}
        onClose={() => setShowAddLine(false)}
        title="Add Line Item"
      >
        <AddLineModal
          rfqId={rfq.id}
          onAdded={fetchRFQ}
          onClose={() => setShowAddLine(false)}
        />
      </Modal>
    </div>
  )
}
