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
import * as F from '../../components/flow/FlowUi'
import { createQuotation } from '../../api/quotationApi'
import { ItemPicker, type ItemPickerSelection } from '../../components/ui/ItemPicker'
import {
  getRFQ,
  transitionRFQ,
  addLineItem,
  updateLineItem,
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
// RFQ-page flow stages (screenshots 1–4). Stages 5–12 live on the Quotation
// page. Each stage maps to real RFQ state-machine statuses.
// ---------------------------------------------------------------------------
const RFQ_FLOW_STAGES: F.FlowStageDef[] = [
  { n: 1, title: 'RFQ Received', sub: 'Inbox & attachments', group: 'RFQ INTAKE' },
  { n: 2, title: 'RFQ Registration', sub: 'Header, items, terms', group: 'RFQ INTAKE' },
  { n: 3, title: 'AI Drawing & Spec Review', sub: '2D/3D extraction', group: 'ENGINEERING REVIEW' },
  { n: 4, title: 'Technical & Config Review', sub: 'Manufacturability', group: 'ENGINEERING REVIEW' },
]

/** Map a real RFQ status to its RFQ-page stage number (1–4). Post-stage-4
 *  states (Feasibility Review onward → Quotation page) are treated as 4-done. */
function stageOfStatus(status: string): number {
  switch (status) {
    case 'Received': return 1
    case 'Registration': return 2
    case 'Document Upload':
    case 'AI Drawing Reader':
    case 'AI Surface Treatment Analysis': return 3
    case 'Configuration Review-1':
    case 'Contract Review-1': return 4
    default: return 5 // Feasibility Review onward — handed to Quotation page
  }
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
  const [itemId, setItemId] = useState<string | null>(null)
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
        item_id: itemId || undefined,
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
      <div>
        <label className="text-xs font-medium text-gray-600">Item / Part Master</label>
        <ItemPicker
          value={itemId}
          onSelect={(sel: ItemPickerSelection | null) => {
            setItemId(sel?.item_id ?? null)
            if (sel) {
              if (sel.part_number) setPartNumber(sel.part_number)
              if (sel.drawing_number) setDrawingNumber(sel.drawing_number)
              if (sel.drawing_revision) setRevision(sel.drawing_revision)
            }
          }}
        />
        <p className="mt-1 text-[11px] text-gray-400">Pick from the Item Master to link this line (item_id) and auto-fill the fields, or type a free-text part below.</p>
      </div>
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
  const [activeStage, setActiveStage] = useState<number | null>(null)
  const [selectedLineIdx, setSelectedLineIdx] = useState(0)
  const [creatingQuote, setCreatingQuote] = useState(false)
  const [editLineId, setEditLineId] = useState<string | null>(null)
  const [lineBusy, setLineBusy] = useState(false)
  const [modifyExtraction, setModifyExtraction] = useState(false)
  const [lineEdit, setLineEdit] = useState<Record<string, string | boolean>>({})

  // Derived audit trail from state transitions (we'll simulate from RFQ data for now)
  const [auditEntries] = useState<AuditEntry[]>([])

  const fetchRFQ = useCallback(() => {
    if (!id) return
    setLoading(true)
    getRFQ(id)
      .then(setRfq)
      .catch((err) => {
        const d = err?.response?.data?.detail
        setError(typeof d === 'string' ? d : (d ? JSON.stringify(d) : (err?.message ?? 'Failed to load RFQ')))
      })
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

  const startEditLine = (li: RFQLineItem) => {
    setEditLineId(li.id)
    setLineEdit({
      part_number: li.part_number ?? '',
      part_description: li.part_description ?? '',
      drawing_number: li.drawing_number ?? '',
      drawing_revision: li.drawing_revision ?? '',
      material_spec: li.material_spec ?? '',
      batch_quantity: li.batch_quantity != null ? String(li.batch_quantity) : '',
      coating_thickness: li.coating_thickness ?? '',
      inspection_requirements: li.inspection_requirements ?? '',
      fai_required: !!li.fai_required,
    })
  }

  const saveLine = async (lid: string) => {
    if (!rfq) return
    setLineBusy(true); setTransitionError(null)
    try {
      const body: Record<string, unknown> = {
        part_number: (lineEdit.part_number as string) || undefined,
        part_description: (lineEdit.part_description as string) || undefined,
        drawing_number: (lineEdit.drawing_number as string) || undefined,
        drawing_revision: (lineEdit.drawing_revision as string) || undefined,
        material_spec: (lineEdit.material_spec as string) || undefined,
        coating_thickness: (lineEdit.coating_thickness as string) || undefined,
        inspection_requirements: (lineEdit.inspection_requirements as string) || undefined,
        fai_required: !!lineEdit.fai_required,
      }
      const q = (lineEdit.batch_quantity as string)
      if (q && q.trim()) body.batch_quantity = parseInt(q, 10)
      await updateLineItem(rfq.id, lid, body)
      setEditLineId(null); setModifyExtraction(false)
      fetchRFQ()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setTransitionError(typeof d === 'string' ? d : (d ? JSON.stringify(d) : e?.message ?? 'Failed to save line item'))
    } finally { setLineBusy(false) }
  }

  const handleCreateQuotation = async () => {
    if (!rfq) return
    setCreatingQuote(true); setTransitionError(null)
    try {
      const q = await createQuotation({
        rfq_id: rfq.id,
        customer_id: rfq.customer_id,
        line_items: (rfq.line_items ?? []).map((li) => ({
          item_id: li.item_id ?? null,
          part_number: li.part_number ?? null,
          drawing_number: li.drawing_number ?? null,
          drawing_revision: li.drawing_revision ?? null,
          quantity: li.batch_quantity ?? li.annual_quantity ?? null,
        })),
      })
      navigate(`/sales/quotations/${q.id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setTransitionError(typeof d === 'string' ? d : (d ? JSON.stringify(d) : e?.message ?? 'Failed to create quotation'))
    } finally { setCreatingQuote(false) }
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
  const currentStage = stageOfStatus(rfq.status)
  const viewStage = activeStage ?? Math.min(4, currentStage)
  const doneStages = new Set<number>(
    RFQ_FLOW_STAGES.filter((s) => s.n < currentStage).map((s) => s.n)
  )
  const customerLabel = rfq.customer_name || rfq.customer_id
  const nextState = RFQ_TRANSITIONS[rfq.status]?.[0] ?? null
  const attachments = lineItems.filter((li) => li.drawing_pdf_path)
  const sel = lineItems[selectedLineIdx] ?? lineItems[0] ?? null
  const extractedCount = lineItems.filter((li) => li.ai_extraction_id).length

  const fileName = (p: string | null) => (p ? p.split(/[\\/]/).pop() ?? p : '')

  const handleAdvance = async () => {
    if (nextState) {
      await handleTransition(nextState, '')
    }
    setActiveStage(null) // follow the real current stage after a transition
  }

  return (
    <div className="max-w-7xl space-y-5">
      {/* -- Page header -------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/sales/rfqs')}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
          aria-label="Back to RFQs"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{rfq.rfq_number}</h1>
            <Badge variant={PRIORITY_VARIANT[rfq.priority] ?? 'default'} size="sm">{rfq.priority}</Badge>
            <StateMachineBadge state={rfq.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {customerLabel} · Received {formatDate(rfq.received_date)} · Due {formatDate(rfq.quotation_due_date)}
            {rfq.contact_name && ` · ${rfq.contact_name}`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateQuotation}
          disabled={creatingQuote || lineItems.length === 0}
          title={lineItems.length === 0 ? 'Add line items before creating a quotation' : 'Create a quotation from this RFQ'}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creatingQuote ? 'Creating…' : 'Create Quotation →'}
        </button>
      </div>

      {/* -- Stage strip (RFQ Intake + Engineering Review) --------- */}
      <F.StageStrip stages={RFQ_FLOW_STAGES} active={viewStage} done={doneStages} onSelect={setActiveStage} />

      {transitionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{transitionError}</div>
      )}

      {/* -- Active stage ------------------------------------------- */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-6">
        {/* ── Stage 1 · RFQ Received ── */}
        {viewStage === 1 && (
          <>
            <F.StageHeader
              n={1} group="RFQ INTAKE" title="RFQ Received"
              desc="Customer request captured with drawings, specifications and commercial terms."
              meta={<>
                <F.MetaChip label="Received" value={formatDate(rfq.received_date)} />
                <F.MetaChip label="Line Items" value={String(lineItems.length)} />
                <F.MetaChip label="Priority" value={rfq.priority} tone={rfq.priority === 'High' ? 'amber' : 'gray'} />
              </>}
            />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <F.Card
                title="Inbound RFQ"
                right={<F.Badge text={currentStage <= 1 ? 'Unregistered' : 'Registered'} tone={currentStage <= 1 ? 'indigo' : 'green'} />}
              >
                <div className="divide-y divide-gray-100">
                  <F.Row label="From" value={rfq.contact_name ?? <span className="text-gray-400">Not captured</span>} />
                  <F.Row label="Customer" value={customerLabel} />
                  <F.Row label="Received" value={formatDateTime(rfq.created_at)} />
                  <F.Row label="Due Date" value={formatDate(rfq.quotation_due_date)} />
                  <F.Row label="RFQ No." value={<span className="font-mono">{rfq.rfq_number}</span>} />
                </div>
                <F.Footer>
                  <button
                    className={F.btnPrimary}
                    onClick={rfq.status === 'Received' ? handleAdvance : () => setActiveStage(2)}
                    disabled={transitionLoading}
                  >
                    {rfq.status === 'Received' ? 'Register RFQ →' : 'View Registration →'}
                  </button>
                </F.Footer>
              </F.Card>
              <F.Card title="Attachments">
                {attachments.length === 0 ? (
                  <p className="text-sm text-gray-400">No drawings uploaded yet — add them in the AI Drawing &amp; Spec Review stage.</p>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                        <span className="flex items-center gap-2.5 text-sm text-gray-700"><Package size={16} className="text-gray-400" />{a.part_number ?? fileName(a.drawing_pdf_path)}</span>
                        <span className="text-xs text-gray-400 font-mono">{fileName(a.drawing_pdf_path)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </F.Card>
            </div>
          </>
        )}

        {/* ── Stage 2 · RFQ Registration ── */}
        {viewStage === 2 && (
          <>
            <F.StageHeader
              n={2} group="RFQ INTAKE" title="RFQ Registration"
              desc="Customer, items, due date and attachments captured in the ERP."
              meta={<>
                <F.MetaChip label="RFQ No." value={rfq.rfq_number} />
                <F.MetaChip label="Due Date" value={formatDate(rfq.quotation_due_date)} tone="amber" />
                <F.MetaChip label="Line Items" value={String(lineItems.length)} />
              </>}
            />
            <div className="space-y-6">
              <F.Card title="RFQ Header" right={<F.Badge text={rfq.status} tone="gray" />}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <F.FieldValue label="RFQ No." value={<span className="font-mono">{rfq.rfq_number}</span>} />
                  <F.FieldValue label="Customer" value={customerLabel} required />
                  <F.FieldValue label="Contact Person" value={rfq.contact_name} />
                  <F.FieldValue label="RFQ Date" value={formatDate(rfq.received_date)} />
                  <F.FieldValue label="Quote Due Date" value={formatDate(rfq.quotation_due_date)} required />
                  <F.FieldValue label="Priority" value={rfq.priority} />
                </div>
                <div className="mt-4">
                  <F.PlaceholderNote>Currency, Incoterms, payment terms, customer RFQ no. and contact email are not yet fields on the RFQ header — they will appear here once added to the RFQ schema.</F.PlaceholderNote>
                </div>
              </F.Card>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                <F.Card
                  title="RFQ Items"
                  right={<Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAddLine(true)}>Add Line</Button>}
                >
                  {lineItems.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No line items yet — click “Add Line”.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                        <th className="pb-2 font-medium">PART NO.</th><th className="pb-2 font-medium">DESCRIPTION</th><th className="pb-2 text-right font-medium">QTY</th><th className="pb-2 text-right font-medium">DRAWING</th><th className="pb-2 text-right font-medium"></th>
                      </tr></thead>
                      <tbody>
                        {lineItems.map((it) => (
                          editLineId === it.id ? (
                            <tr key={it.id} className="border-b border-gray-50 bg-indigo-50/40">
                              <td className="py-1.5 pr-2"><input value={lineEdit.part_number as string} onChange={(e) => setLineEdit((p) => ({ ...p, part_number: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" /></td>
                              <td className="py-1.5 pr-2"><input value={lineEdit.part_description as string} onChange={(e) => setLineEdit((p) => ({ ...p, part_description: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" /></td>
                              <td className="py-1.5 pr-2"><input type="number" value={lineEdit.batch_quantity as string} onChange={(e) => setLineEdit((p) => ({ ...p, batch_quantity: e.target.value }))} className="w-16 rounded border border-gray-300 px-2 py-1 text-right text-xs" /></td>
                              <td className="py-1.5 pr-2"><input value={lineEdit.drawing_number as string} onChange={(e) => setLineEdit((p) => ({ ...p, drawing_number: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Drawing" /></td>
                              <td className="py-1.5 text-right whitespace-nowrap">
                                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50" disabled={lineBusy} onClick={() => saveLine(it.id)}>Save</button>
                                <button className="ml-2 text-xs text-gray-500 hover:text-gray-700" onClick={() => setEditLineId(null)}>Cancel</button>
                              </td>
                            </tr>
                          ) : (
                            <tr key={it.id} className="border-b border-gray-50">
                              <td className="py-2.5 font-mono text-indigo-600">{it.part_number ?? '—'}</td>
                              <td className="py-2.5 text-gray-700">{it.part_description ?? '—'}</td>
                              <td className="py-2.5 text-right text-gray-700">{(it.batch_quantity ?? it.annual_quantity ?? '—').toLocaleString?.('en-IN') ?? '—'}</td>
                              <td className="py-2.5 text-right font-mono text-gray-500">{it.drawing_number ?? '—'}{it.drawing_revision ? ` Rev ${it.drawing_revision}` : ''}</td>
                              <td className="py-2.5 text-right whitespace-nowrap">
                                <button type="button" onClick={() => startEditLine(it)} className="text-xs text-indigo-600 hover:text-indigo-800">Edit</button>
                                <button type="button" disabled={deletingId === it.id} onClick={() => handleDeleteLine(it.id)} className="ml-2 text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
                                  {deletingId === it.id ? <Loader2 size={12} className="animate-spin" /> : 'Remove'}
                                </button>
                              </td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  )}
                </F.Card>
                <F.Card title="Customer Requirements">
                  {(() => {
                    const reqs: string[] = []
                    lineItems.forEach((li) => {
                      if (li.quality_clauses) reqs.push(li.quality_clauses)
                      if (li.inspection_requirements) reqs.push(li.inspection_requirements)
                      if (li.testing_requirements) reqs.push(li.testing_requirements)
                      if (li.fai_required) reqs.push('First Article Inspection (AS9102) required')
                    })
                    return reqs.length ? (
                      <ol className="space-y-2 text-sm text-indigo-700">{reqs.map((r, i) => <li key={i}>{i + 1}. {r}</li>)}</ol>
                    ) : (
                      <p className="text-sm text-gray-400">No special requirements captured on the line items yet.</p>
                    )
                  })()}
                </F.Card>
              </div>
              <F.Footer>
                <button className={F.btnPrimary} onClick={rfq.status === 'Registration' ? handleAdvance : () => setActiveStage(3)} disabled={transitionLoading}>
                  {rfq.status === 'Registration' ? 'Save & Continue →' : 'Go to Drawing Review →'}
                </button>
              </F.Footer>
            </div>
          </>
        )}

        {/* ── Stage 3 · AI Drawing & Spec Review ── */}
        {viewStage === 3 && (
          <>
            <F.StageHeader
              n={3} group="ENGINEERING REVIEW" title="AI Drawing & Spec Review"
              desc="AI reads the 2D drawing and specification sheet — extracting dimensions, tolerances, material and process requirements."
              meta={<>
                <F.MetaChip label="AI Status" value={extractedCount > 0 ? 'Completed' : 'Pending'} tone={extractedCount > 0 ? 'green' : 'amber'} />
                <F.MetaChip label="Drawings" value={`${attachments.length}/${lineItems.length}`} />
                <F.MetaChip label="Part" value={sel?.part_number ?? '—'} />
              </>}
            />
            {lineItems.length === 0 ? (
              <F.PlaceholderNote>Add line items in the RFQ Registration stage before uploading drawings.</F.PlaceholderNote>
            ) : (
              <>
                {lineItems.length > 1 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {lineItems.map((li, i) => (
                      <button key={li.id} onClick={() => setSelectedLineIdx(i)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${i === selectedLineIdx ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        {li.part_number ?? `Line ${li.line_number}`}
                      </button>
                    ))}
                  </div>
                )}
                {sel && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <F.Card
                      title={sel.drawing_number ? `${sel.drawing_number}${sel.drawing_revision ? ` · Rev ${sel.drawing_revision}` : ''}` : (sel.part_number ?? 'Drawing')}
                      right={<F.Badge text={sel.ai_extraction_id ? '✓ AI Analysis Completed' : 'No extraction yet'} tone={sel.ai_extraction_id ? 'green' : 'gray'} />}
                    >
                      {sel.drawing_pdf_path ? (
                        <a href={`/uploads/${fileName(sel.drawing_pdf_path)}`} target="_blank" rel="noreferrer" className="flex h-56 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-indigo-600 hover:bg-gray-100">
                          Open drawing: {fileName(sel.drawing_pdf_path)}
                        </a>
                      ) : (
                        <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">No drawing uploaded</div>
                      )}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload size={13} className="text-indigo-600" />
                          <span className="text-xs font-medium text-gray-600">Drawing Upload &amp; AI Extraction</span>
                        </div>
                        <DrawingUploadCell rfqId={rfq.id} lineItem={sel} onUploaded={fetchRFQ} />
                      </div>
                    </F.Card>
                    <F.Card title="Extracted Summary — Engineering Verification" right={<F.Badge text={modifyExtraction ? 'Modifying' : (sel.ai_extraction_id ? 'Review' : 'Pending')} tone="amber" />}>
                      {modifyExtraction && editLineId === sel.id ? (
                        <div className="space-y-3">
                          <F.FieldInput label="Part Number" value={lineEdit.part_number as string} onChange={(v) => setLineEdit((p) => ({ ...p, part_number: v }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <F.FieldInput label="Drawing Number" value={lineEdit.drawing_number as string} onChange={(v) => setLineEdit((p) => ({ ...p, drawing_number: v }))} />
                            <F.FieldInput label="Revision" value={lineEdit.drawing_revision as string} onChange={(v) => setLineEdit((p) => ({ ...p, drawing_revision: v }))} />
                          </div>
                          <F.FieldInput label="Material" value={lineEdit.material_spec as string} onChange={(v) => setLineEdit((p) => ({ ...p, material_spec: v }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <F.FieldInput label="Coating Thickness" value={lineEdit.coating_thickness as string} onChange={(v) => setLineEdit((p) => ({ ...p, coating_thickness: v }))} />
                            <F.FieldInput label="Inspection" value={lineEdit.inspection_requirements as string} onChange={(v) => setLineEdit((p) => ({ ...p, inspection_requirements: v }))} />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!lineEdit.fai_required} onChange={(e) => setLineEdit((p) => ({ ...p, fai_required: e.target.checked }))} /> FAI (AS9102) required</label>
                          <F.Footer>
                            <button className={F.btnGhost} onClick={() => { setModifyExtraction(false); setEditLineId(null) }}>Cancel</button>
                            <button className={F.btnPrimary} disabled={lineBusy} onClick={() => saveLine(sel.id)}>{lineBusy ? 'Saving…' : 'Save extracted data'}</button>
                          </F.Footer>
                        </div>
                      ) : (
                        <>
                          <div className="divide-y divide-gray-100">
                            <F.Row label="Part Number" value={<span className="font-mono">{sel.part_number ?? '—'}</span>} />
                            <F.Row label="Drawing Number" value={<span className="font-mono">{sel.drawing_number ?? '—'}</span>} />
                            <F.Row label="Revision" value={<span className="font-mono">{sel.drawing_revision ?? '—'}</span>} />
                            <F.Row label="Material" value={sel.material_spec ?? '—'} />
                            <F.Row label="Special Processes" value={(sel.special_processes && sel.special_processes.length) ? sel.special_processes.join(', ') : '—'} />
                            <F.Row label="Surface Treatment" value={sel.surface_treatment_spec ?? '—'} />
                            <F.Row label="Coating Thickness" value={sel.coating_thickness ?? '—'} />
                            <F.Row label="Inspection" value={sel.inspection_requirements ?? '—'} />
                            <F.Row label="FAI (AS9102)" value={sel.fai_required ? 'Required' : 'Not required'} />
                            <F.Row label="Quantity" value={(sel.batch_quantity ?? sel.annual_quantity) ? String(sel.batch_quantity ?? sel.annual_quantity) : '—'} />
                          </div>
                          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                            Mandatory human verification — AI extraction becomes controlled ERP data only after engineering acceptance.
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button className={F.btnSuccess} disabled={transitionLoading} onClick={() => { if (currentStage === 3) { handleAdvance() } else { setActiveStage(4) } }}>Accept →</button>
                            <button className={F.btnGhost} onClick={() => { startEditLine(sel); setModifyExtraction(true) }}>Modify</button>
                            <button className={F.btnDanger} onClick={() => setActiveStage(2)}>Reject / Send back</button>
                          </div>
                        </>
                      )}
                    </F.Card>
                  </div>
                )}
                <F.Footer>
                  <button className={F.btnPrimary} onClick={currentStage === 3 ? handleAdvance : () => setActiveStage(4)} disabled={transitionLoading}>
                    {currentStage === 3 ? 'Accept & Continue →' : 'Go to Technical Review →'}
                  </button>
                </F.Footer>
              </>
            )}
          </>
        )}

        {/* ── Stage 4 · Technical & Config Review ── */}
        {viewStage === 4 && (
          <>
            <F.StageHeader
              n={4} group="ENGINEERING REVIEW" title="Technical & Configuration Review"
              desc="Engineer verifies AI output against shop-floor capability, manufacturability and certification requirements."
              meta={<>
                <F.MetaChip label="Status" value={rfq.status} tone={currentStage >= 4 ? 'green' : 'amber'} />
                <F.MetaChip label="Line Items" value={String(lineItems.length)} />
                <F.MetaChip label="Contact" value={rfq.contact_name ?? '—'} />
              </>}
            />
            {currentStage < 4 ? (
              <F.PlaceholderNote>
                Configuration &amp; Contract Review open once this RFQ reaches the “Configuration Review-1” state. Advance the workflow below to begin the review.
              </F.PlaceholderNote>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <F.Card title="Suggested Process Route">
                    {(() => {
                      const route = (sel?.manufacturing_route as { operation?: string }[] | null) ?? null
                      return Array.isArray(route) && route.length ? (
                        <ol className="space-y-2 text-sm text-gray-700">{route.map((r, i) => <li key={i}>{i + 1}. {r.operation ?? JSON.stringify(r)}</li>)}</ol>
                      ) : (
                        <p className="text-sm text-gray-400">No process route captured on the selected line item yet.</p>
                      )
                    })()}
                  </F.Card>
                  <F.Card title="Certification & Capability">
                    <div className="divide-y divide-gray-100">
                      <F.CheckItem ok={!!sel?.fai_required}>{sel?.fai_required ? 'FAI (AS9102) required — flagged on line item.' : 'FAI not marked required.'}</F.CheckItem>
                      <F.CheckItem ok={!!sel?.special_processes?.length}>{sel?.special_processes?.length ? `Special processes: ${sel.special_processes.join(', ')}` : 'No special processes captured.'}</F.CheckItem>
                      <F.CheckItem ok={!!sel?.material_spec}>{sel?.material_spec ? `Material spec: ${sel.material_spec}` : 'Material spec not captured.'}</F.CheckItem>
                    </div>
                  </F.Card>
                </div>
                <ConfigReviewPanel
                  rfqId={rfq.id}
                  reviewId={configReviewId}
                  rfqStatus={rfq.status}
                  expectedDrawingNumber={rfq.line_items?.[0]?.drawing_number ?? null}
                  expectedRevision={rfq.line_items?.[0]?.drawing_revision ?? null}
                  isQualityManager={true}
                  onComplete={() => fetchRFQ()}
                />
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
                <F.Footer>
                  <button className={F.btnPrimary} onClick={handleAdvance} disabled={transitionLoading || !nextState}>
                    {nextState ? `Approve & Continue → (${nextState})` : 'No further transition'}
                  </button>
                </F.Footer>
              </div>
            )}
            {currentStage >= 5 && (
              <div className="mt-6">
                <F.PlaceholderNote>
                  This RFQ has advanced to the quotation phase. Costing, pricing, approval and release (stages 5–12) are handled on the Quotation for this RFQ.
                </F.PlaceholderNote>
              </div>
            )}
          </>
        )}
      </div>

      {/* -- Workflow state (real state machine incl. branches) ---- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Workflow State</h2>
        <StateMachineStepper currentStatus={rfq.status} />
        <div className="mt-5 pt-4 border-t border-gray-100">
          <TransitionPanel rfq={rfq} onTransition={handleTransition} loading={transitionLoading} />
        </div>
      </div>

      {/* -- Audit Trail --------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AuditTrailPanel
          entries={[
            { user: 'System', action: `RFQ ${rfq.rfq_number} created with status: Received`, timestamp: rfq.created_at, comment: undefined },
            ...auditEntries,
          ]}
          title="Audit Trail"
        />
      </div>

      {/* -- Add Line Modal ------------------------------------------ */}
      <Modal open={showAddLine} onClose={() => setShowAddLine(false)} title="Add Line Item">
        <AddLineModal rfqId={rfq.id} onAdded={fetchRFQ} onClose={() => setShowAddLine(false)} />
      </Modal>
    </div>
  )
}
