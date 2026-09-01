/**
 * NCRDetailPage - Module 21: NCR detail view.
 *
 * Features:
 * - Header with NCR number, status badge, transition buttons
 * - All NCR fields displayed as read-only with Edit toggle
 * - State machine transitions:
 *   Open †' Awaiting Approval
 *   Awaiting Approval †' Approved, Rejected
 *   Approved †' Closed
 *   Rejected †' Open, Closed
 * - Linked CAPAs section
 * - Audit trail at bottom
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Loader2, Pencil, X } from 'lucide-react'
import {
  Badge,
  StateMachineBadge,
  Button,
  Modal,
  Input,
  Select,
  AuditTrailPanel,
} from '../../components/ui'
import type { AuditEntry } from '../../components/ui/AuditTrailPanel'
import { formatDate, formatDateTime } from '../../lib/utils'
import {
  getNCR,
  updateNCR,
  transitionNCR,
  listCAPAs,
  NCR,
  CAPA,
} from '../../api/qualityApi'

// ---------------------------------------------------------------------------
// NCR state machine
// ---------------------------------------------------------------------------
const NCR_TRANSITIONS: Record<string, string[]> = {
  Open: ['Awaiting Approval'],
  'Awaiting Approval': ['Approved', 'Rejected'],
  Approved: ['Closed'],
  Rejected: ['Open', 'Closed'],
  Closed: [],
}

const DETECTION_STAGES = ['Incoming', 'In-Process', 'Final Inspection', 'Customer', 'Supplier']
const DISPOSITIONS = ['Use As Is', 'Rework', 'Scrap', 'Return to Supplier', 'Concession']

// ---------------------------------------------------------------------------
// Field row helper
// ---------------------------------------------------------------------------
function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <div className="text-sm text-gray-900 mt-0.5">{value ?? <span className="text-gray-400">""</span>}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Transition Panel
// ---------------------------------------------------------------------------
interface TransitionPanelProps {
  ncr: NCR
  onTransition: (targetState: string, comment: string) => Promise<void>
  loading: boolean
}

function TransitionPanel({ ncr, onTransition, loading }: TransitionPanelProps) {
  const nextStates = NCR_TRANSITIONS[ncr.status] ?? []
  const [comment, setComment] = useState('')
  const [confirmState, setConfirmState] = useState<string | null>(null)

  if (nextStates.length === 0) {
    return (
      <span className="text-xs text-gray-400">NCR is in a terminal state "" no further transitions.</span>
    )
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
        <span className="text-xs text-gray-500 font-medium">Transition to:</span>
        {nextStates.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => { setConfirmState(s); setComment('') }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${s === 'Rejected' || s === 'Closed'
                ? 'border-red-300 text-red-700 hover:bg-red-50'
                : s === 'Approved'
                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                  : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ChevronRight size={12} />
            {s}
          </button>
        ))}
        {loading && <Loader2 size={14} className="animate-spin text-red-600" />}
      </div>

      <Modal
        open={!!confirmState}
        onClose={() => setConfirmState(null)}
        title={`Transition to "${confirmState}"`}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Moving NCR <span className="font-mono font-semibold">{ncr.ncr_number}</span>{' '}
            from <StateMachineBadge state={ncr.status} size="sm" /> to{' '}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setConfirmState(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={loading} onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Edit Form
// ---------------------------------------------------------------------------
interface EditFormProps {
  ncr: NCR
  onSaved: (updated: NCR) => void
  onClose: () => void
}

function EditForm({ ncr, onSaved, onClose }: EditFormProps) {
  const [partNumber, setPartNumber] = useState(ncr.part_number ?? '')
  const [drawingNumber, setDrawingNumber] = useState(ncr.drawing_number ?? '')
  const [detectionStage, setDetectionStage] = useState(ncr.detection_stage)
  const [description, setDescription] = useState(ncr.description)
  const [disposition, setDisposition] = useState(ncr.disposition ?? '')
  const [concessionRef, setConcessionRef] = useState(ncr.concession_ref ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const updated = await updateNCR(ncr.id, {
        part_number: partNumber || null,
        drawing_number: drawingNumber || null,
        detection_stage: detectionStage,
        description,
        disposition: disposition || null,
        concession_ref: concessionRef || null,
      })
      onSaved(updated)
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Part Number"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
        />
        <Input
          label="Drawing Number"
          value={drawingNumber}
          onChange={(e) => setDrawingNumber(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Detection Stage</label>
        <Select
          options={DETECTION_STAGES.map((s) => ({ label: s, value: s }))}
          value={detectionStage}
          onChange={(e) => setDetectionStage(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
        <Select
          options={[{ label: '"" none ""', value: '' }, ...DISPOSITIONS.map((d) => ({ label: d, value: d }))]}
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
        />
      </div>
      <Input
        label="Concession Reference"
        value={concessionRef}
        onChange={(e) => setConcessionRef(e.target.value)}
        placeholder="e.g. CONC-2024-001"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function NCRDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [ncr, setNcr] = useState<NCR | null>(null)
  const [capas, setCapas] = useState<CAPA[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [auditEntries] = useState<AuditEntry[]>([])

  const fetchData = useCallback(() => {
    if (!id) return
    setLoading(true)
    getNCR(id)
      .then((data) => {
        setNcr(data)
        return listCAPAs({ ncr_id: id })
      })
      .then(r => setCapas(Array.isArray(r) ? r : []))
      .catch((err) => setError(err?.response?.data?.detail ?? 'Failed to load NCR'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTransition = async (targetState: string, comment: string) => {
    if (!ncr) return
    setTransitionLoading(true)
    setTransitionError(null)
    try {
      const updated = await transitionNCR(ncr.id, { target_state: targetState, comment: comment || null })
      setNcr(updated)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setTransitionError(e?.response?.data?.detail ?? e?.message ?? 'Transition failed')
    } finally {
      setTransitionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-red-600">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading NCR...
      </div>
    )
  }

  if (error || !ncr) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? 'NCR not found'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/quality/ncrs')}
          icon={<ArrowLeft size={14} />}
        >
          Back to NCRs
        </Button>
      </div>
    )
  }

  const isClosed = ncr.status === 'Closed'

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/quality/ncrs')}
          className="text-gray-500 hover:text-gray-700 p-1 rounded"
          aria-label="Back to NCRs"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{ncr.ncr_number}</h1>
              <StateMachineBadge state={ncr.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Opened {formatDate(ncr.created_at)}
              {ncr.closed_at && `  ·  Closed ${formatDate(ncr.closed_at)}`}
            </p>
          </div>
          {!isClosed && (
            <Button
              variant="secondary"
              size="sm"
              icon={editing ? <X size={14} /> : <Pencil size={14} />}
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cancel Edit' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {/* Transition panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Workflow</h2>
        {transitionError && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {transitionError}
          </div>
        )}
        <TransitionPanel
          ncr={ncr}
          onTransition={handleTransition}
          loading={transitionLoading}
        />
      </div>

      {/* NCR fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">NCR Details</h2>

        {editing ? (
          <EditForm
            ncr={ncr}
            onSaved={(updated) => { setNcr(updated); setEditing(false) }}
            onClose={() => setEditing(false)}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <FieldRow label="NCR Number" value={<span className="font-mono font-semibold">{ncr.ncr_number}</span>} />
            <FieldRow label="Part Number" value={ncr.part_number} />
            <FieldRow label="Drawing Number" value={ncr.drawing_number} />
            <FieldRow label="Detection Stage" value={
              <Badge variant={({ Incoming: 'info', 'In-Process': 'warning', 'Final Inspection': 'warning', Customer: 'danger', Supplier: 'default' } as Record<string, 'info' | 'warning' | 'danger' | 'default'>)[ncr.detection_stage] ?? 'default'} size="sm">
                {ncr.detection_stage}
              </Badge>
            } />
            <FieldRow label="Status" value={<StateMachineBadge state={ncr.status} size="sm" />} />
            <FieldRow label="Disposition" value={ncr.disposition} />
            <FieldRow label="Concession Ref" value={ncr.concession_ref} />
            <FieldRow label="Assigned To" value={ncr.assigned_to_id} />
            <FieldRow label="Created" value={formatDateTime(ncr.created_at)} />
            <div className="col-span-2 md:col-span-3">
              <FieldRow
                label="Description"
                value={<p className="whitespace-pre-wrap text-sm text-gray-900">{ncr.description}</p>}
              />
            </div>
          </div>
        )}
      </div>

      {/* Linked CAPAs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Linked CAPAs ({capas.length})
        </h2>
        {capas.length === 0 ? (
          <p className="text-sm text-gray-400">No CAPAs linked to this NCR.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {capas.map((capa) => (
              <div key={capa.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold text-amber-700">{capa.capa_number}</span>
                  <span className="ml-3 text-sm text-gray-700">{capa.title}</span>
                </div>
                <StateMachineBadge state={capa.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AuditTrailPanel
          entries={[
            {
              user: 'System',
              action: `NCR ${ncr.ncr_number} created with status: Open`,
              timestamp: ncr.created_at,
            },
            ...auditEntries,
          ]}
          title="Audit Trail"
        />
      </div>
    </div>
  )
}
