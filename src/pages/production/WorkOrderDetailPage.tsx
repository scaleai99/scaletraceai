/**
 * WorkOrderDetailPage - Module 19: Work Order detail (MES operator view)
 *
 * Features:
 * - Header: JC number, part, drawing, batch qty, status
 * - Operations timeline: vertical list with start/complete/hold/release buttons
 * - WIP indicator: qty_completed / batch_quantity per operation
 * - Scrap entry: qty + reason field on complete
 * - Hold/Release via modal (Quality_Engineer role)
 * - Download Job Card PDF button
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Download,
  Lock,
  PlayCircle,
  RefreshCw,
  Unlock,
} from 'lucide-react'
import { Badge, Button, Input, Modal, StateMachineBadge } from '../../components/ui'
import { formatDate, formatINR } from '../../lib/utils'
import {
  completeOperation,
  getJobCardPDF,
  getWorkOrder,
  holdWorkOrder,
  releaseHold,
  startOperation,
  type WorkOrder,
  type WorkOrderOperation,
} from '../../api/productionApi'

// ---------------------------------------------------------------------------
// Op status badge
// ---------------------------------------------------------------------------
function opStatusVariant(
  status: string
): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'Pending': return 'default'
    case 'In Progress': return 'warning'
    case 'Completed': return 'success'
    case 'On Hold': return 'danger'
    default: return 'default'
  }
}

// ---------------------------------------------------------------------------
// Start operation modal
// ---------------------------------------------------------------------------
interface StartOpModalProps {
  open: boolean
  op: WorkOrderOperation | null
  onClose: () => void
  onConfirm: (machineId: string, operatorId: string) => void
  saving: boolean
}

function StartOpModal({ open, op, onClose, onConfirm, saving }: StartOpModalProps) {
  const [machineId, setMachineId] = useState('')
  const [operatorId, setOperatorId] = useState('')

  useEffect(() => {
    if (open) {
      setMachineId(op?.machine_id ?? '')
      setOperatorId('')
    }
  }, [open, op])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Start: ${op?.op_name ?? 'Operation'}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(machineId, operatorId)}
            loading={saving}
            icon={<PlayCircle size={14} />}
          >
            Start Operation
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Machine ID (optional override)"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          placeholder="Leave blank to use default"
        />
        <Input
          label="Operator ID (optional)"
          value={operatorId}
          onChange={(e) => setOperatorId(e.target.value)}
          placeholder="Employee ID"
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Complete operation modal
// ---------------------------------------------------------------------------
interface CompleteOpModalProps {
  open: boolean
  op: WorkOrderOperation | null
  batchQty: number
  onClose: () => void
  onConfirm: (qtyCompleted: number, qtyScrapped: number, reason: string) => void
  saving: boolean
}

function CompleteOpModal({ open, op, batchQty, onClose, onConfirm, saving }: CompleteOpModalProps) {
  const [qtyCompleted, setQtyCompleted] = useState<number>(0)
  const [qtyScrapped, setQtyScrapped] = useState<number>(0)
  const [scrapReason, setScrapReason] = useState('')

  useEffect(() => {
    if (open) {
      setQtyCompleted(batchQty)
      setQtyScrapped(0)
      setScrapReason('')
    }
  }, [open, batchQty])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Complete: ${op?.op_name ?? 'Operation'}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(qtyCompleted, qtyScrapped, scrapReason)}
            loading={saving}
            icon={<CheckCircle size={14} />}
          >
            Complete Operation
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Qty Completed"
          type="number"
          min={0}
          max={batchQty}
          value={qtyCompleted}
          onChange={(e) => setQtyCompleted(parseInt(e.target.value) || 0)}
          required
        />
        <Input
          label="Qty Scrapped"
          type="number"
          min={0}
          value={qtyScrapped}
          onChange={(e) => setQtyScrapped(parseInt(e.target.value) || 0)}
        />
        {qtyScrapped > 0 && (
          <Input
            label="Scrap Reason"
            value={scrapReason}
            onChange={(e) => setScrapReason(e.target.value)}
            placeholder="e.g. Dimension out of tolerance"
            required
          />
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Hold modal
// ---------------------------------------------------------------------------
interface HoldModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  saving: boolean
}

function HoldModal({ open, onClose, onConfirm, saving }: HoldModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Place Work Order On Hold"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason)}
            loading={saving}
            icon={<Lock size={14} />}
            disabled={!reason.trim()}
          >
            Hold Work Order
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Placing a hold will prevent further operations until released by Quality Engineering.
        </p>
        <Input
          label="Hold Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Inspection failure on Op 20"
          required
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Single operation row
// ---------------------------------------------------------------------------
interface OperationRowProps {
  op: WorkOrderOperation
  batchQty: number
  isOnHold: boolean
  woStatus: string
  onStart: (op: WorkOrderOperation) => void
  onComplete: (op: WorkOrderOperation) => void
}

function OperationRow({ op, batchQty, isOnHold, woStatus, onStart, onComplete }: OperationRowProps) {
  const canStart =
    !isOnHold &&
    op.status === 'Pending' &&
    ['Released', 'In Progress'].includes(woStatus)
  const canComplete = !isOnHold && op.status === 'In Progress'

  const wipPct = batchQty > 0 ? Math.round((op.qty_completed / batchQty) * 100) : 0

  return (
    <div className={`border rounded-xl p-4 ${op.is_on_hold ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: op info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Sequence bubble */}
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
            {op.op_sequence}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">
                {op.op_name ?? `Operation ${op.op_sequence}`}
              </span>
              <Badge variant={opStatusVariant(op.status)} size="sm">
                {op.status}
              </Badge>
              {op.is_on_hold && (
                <Badge variant="danger" size="sm">
                  <Lock size={10} className="mr-0.5" /> On Hold
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-gray-500">
              {op.planned_cycle_min != null && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {op.planned_cycle_min} min planned
                </span>
              )}
              {op.actual_start && (
                <span>Started: {formatDate(op.actual_start)}</span>
              )}
              {op.actual_end && (
                <span>Ended: {formatDate(op.actual_end)}</span>
              )}
              {op.qty_scrapped > 0 && (
                <span className="text-red-500">
                  <AlertTriangle size={10} className="inline mr-0.5" />
                  {op.qty_scrapped} scrapped
                </span>
              )}
            </div>

            {/* WIP bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                <div
                  className={`h-full rounded-full ${op.qty_completed >= batchQty ? 'bg-green-500' : 'bg-amber-400'}`}
                  style={{ width: `${wipPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {op.qty_completed} / {batchQty} ({wipPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canStart && (
            <Button
              variant="primary"
              size="sm"
              icon={<PlayCircle size={13} />}
              onClick={() => onStart(op)}
            >
              Start
            </Button>
          )}
          {canComplete && (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCircle size={13} />}
              onClick={() => onComplete(op)}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [wo, setWo] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [startModal, setStartModal] = useState<{ open: boolean; op: WorkOrderOperation | null }>({
    open: false,
    op: null,
  })
  const [completeModal, setCompleteModal] = useState<{
    open: boolean
    op: WorkOrderOperation | null
  }>({ open: false, op: null })
  const [holdModal, setHoldModal] = useState(false)
  const [actionSaving, setActionSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const fetchWO = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getWorkOrder(id)
      .then(setWo)
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load work order')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchWO()
  }, [fetchWO])

  const showSuccess = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const handleStartConfirm = (machineId: string, operatorId: string) => {
    if (!wo || !startModal.op) return
    setActionSaving(true)
    setActionError(null)
    startOperation(wo.id, startModal.op.id, {
      machine_id: machineId || undefined,
      operator_id: operatorId || undefined,
    })
      .then(() => {
        showSuccess('Operation started.')
        setStartModal({ open: false, op: null })
        fetchWO()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setActionError(e?.response?.data?.detail ?? e?.message ?? 'Failed to start operation')
      })
      .finally(() => setActionSaving(false))
  }

  const handleCompleteConfirm = (qtyCompleted: number, qtyScrapped: number, reason: string) => {
    if (!wo || !completeModal.op) return
    setActionSaving(true)
    setActionError(null)
    completeOperation(wo.id, completeModal.op.id, {
      qty_completed: qtyCompleted,
      qty_scrapped: qtyScrapped,
      scrap_reason: reason || undefined,
    })
      .then(() => {
        showSuccess('Operation completed.')
        setCompleteModal({ open: false, op: null })
        fetchWO()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setActionError(e?.response?.data?.detail ?? e?.message ?? 'Failed to complete operation')
      })
      .finally(() => setActionSaving(false))
  }

  const handleHoldConfirm = (reason: string) => {
    if (!wo) return
    setActionSaving(true)
    setActionError(null)
    holdWorkOrder(wo.id, reason)
      .then(() => {
        showSuccess('Work order placed on hold.')
        setHoldModal(false)
        fetchWO()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setActionError(e?.response?.data?.detail ?? e?.message ?? 'Failed to hold work order')
      })
      .finally(() => setActionSaving(false))
  }

  const handleRelease = () => {
    if (!wo) return
    setActionSaving(true)
    setActionError(null)
    releaseHold(wo.id)
      .then(() => {
        showSuccess('Hold released.')
        fetchWO()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setActionError(e?.response?.data?.detail ?? e?.message ?? 'Failed to release hold')
      })
      .finally(() => setActionSaving(false))
  }

  const handleDownloadPDF = () => {
    if (!wo) return
    getJobCardPDF(wo.id)
      .then((blob) => {
        const url = URL.createObjectURL(blob as Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${wo.jc_number}-job-card.pdf`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => setActionError('Failed to download Job Card PDF'))
  }

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-400 animate-pulse">
        Loading work order...
      </div>
    )
  }

  if (error || !wo) {
    return (
      <div className="max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ChevronLeft size={14} />}>
          Back
        </Button>
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error ?? 'Work order not found.'}
        </div>
      </div>
    )
  }

  const isOnHold = wo.operations?.some((op) => op.is_on_hold) ?? false
  const sortedOps = [...(wo.operations ?? [])].sort((a, b) => a.op_sequence - b.op_sequence)

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/production/work-orders')}
            icon={<ChevronLeft size={14} />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{wo.jc_number}</h1>
              <StateMachineBadge state={wo.status} />
              {isOnHold && (
                <Badge variant="danger">
                  <Lock size={11} className="mr-0.5" /> On Hold
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Part: <span className="font-medium">{wo.part_number ?? '-'}</span>
              {wo.drawing_number && ` | Drawing: ${wo.drawing_number} Rev ${wo.drawing_revision ?? '-'}`}
              {` | Batch Qty: ${wo.batch_quantity}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchWO}
            icon={<RefreshCw size={13} />}
            title="Refresh"
          />
          {!isOnHold && ['Released', 'In Progress'].includes(wo.status) && (
            <Button
              variant="danger"
              size="sm"
              icon={<Lock size={13} />}
              onClick={() => setHoldModal(true)}
            >
              Hold (QE)
            </Button>
          )}
          {isOnHold && (
            <Button
              variant="primary"
              size="sm"
              icon={<Unlock size={13} />}
              onClick={handleRelease}
              loading={actionSaving}
            >
              Release Hold
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleDownloadPDF}
          >
            Job Card PDF
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">SO Reference</p>
          <p className="font-mono text-gray-800 font-medium">{wo.so_id ?? '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ER Reference</p>
          <p className="font-mono text-gray-800 font-medium">{wo.er_id ?? '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Actual Cost</p>
          <p className="text-gray-800 font-medium">
            {wo.total_actual_cost > 0 ? `‚¹${formatINR(wo.total_actual_cost)}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Created</p>
          <p className="text-gray-800">{formatDate(wo.created_at)}</p>
        </div>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {actionSuccess}
        </div>
      )}

      {/* Operations timeline */}
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Operations ({sortedOps.length})
        </h2>
        {sortedOps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            No operations defined for this work order.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOps.map((op) => (
              <OperationRow
                key={op.id}
                op={op}
                batchQty={wo.batch_quantity}
                isOnHold={isOnHold}
                woStatus={wo.status}
                onStart={(o) => setStartModal({ open: true, op: o })}
                onComplete={(o) => setCompleteModal({ open: true, op: o })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <StartOpModal
        open={startModal.open}
        op={startModal.op}
        onClose={() => setStartModal({ open: false, op: null })}
        onConfirm={handleStartConfirm}
        saving={actionSaving}
      />
      <CompleteOpModal
        open={completeModal.open}
        op={completeModal.op}
        batchQty={wo.batch_quantity}
        onClose={() => setCompleteModal({ open: false, op: null })}
        onConfirm={handleCompleteConfirm}
        saving={actionSaving}
      />
      <HoldModal
        open={holdModal}
        onClose={() => setHoldModal(false)}
        onConfirm={handleHoldConfirm}
        saving={actionSaving}
      />
    </div>
  )
}
