/**
 * SalesOrderDetailPage - Module 14: Sales Order detail (read-only + actions).
 *
 * Features:
 * - Fetch SO by ID from GET /api/v1/sales-orders/:id
 * - Header: SO number, status badge, cancellation reason if cancelled
 * - Line items table: line #, part number, drawing number, revision, qty, unit price,
 *   delivery date, dispatched qty, status
 * - Cancel button (only for Open/In Production/Partially Dispatched)
 *   -> opens Modal asking for cancellation reason
 * - Transition buttons for valid next states
 * - Back navigation to /sales/sales-orders
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, XCircle } from 'lucide-react'
import { Badge, Button, Modal, StateMachineBadge, Textarea } from '../../components/ui'
import { formatDate, formatINR } from '../../lib/utils'
import {
  cancelSalesOrder,
  getSalesOrder,
  SalesOrder,
  transitionSalesOrder,
} from '../../api/salesApi'

// ---------------------------------------------------------------------------
// Valid state transitions (subset of what the backend enforces)
// ---------------------------------------------------------------------------
const SO_TRANSITIONS: Record<string, string[]> = {
  Open: ['In Production'],
  'In Production': ['Partially Dispatched', 'Completed'],
  'Partially Dispatched': ['Completed'],
  Completed: [],
  Cancelled: [],
}

// States that allow cancellation
const CANCELLABLE_STATES = new Set(['Open', 'In Production', 'Partially Dispatched'])

// ---------------------------------------------------------------------------
// Cancel confirmation modal
// ---------------------------------------------------------------------------
interface CancelModalProps {
  open: boolean
  loading: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

function CancelModal({ open, loading, onConfirm, onClose }: CancelModalProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim())
    }
  }

  // Reset reason when modal opens
  useEffect(() => {
    if (open) setReason('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel Sales Order"
      disableBackdropClose={loading}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Keep Order
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            loading={loading}
            disabled={!reason.trim()}
          >
            Confirm Cancellation
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Cancelling a Sales Order is irreversible. Please provide a reason for cancellation.
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation, order superseded by revised CPO..."
            rows={3}
            disabled={loading}
          />
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [so, setSo] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  const fetchSO = useCallback(() => {
    if (!id) return
    setLoading(true)
    getSalesOrder(id)
      .then(setSo)
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load Sales Order')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchSO()
  }, [fetchSO])

  const handleTransition = async (targetState: string) => {
    if (!so) return
    setActionLoading(targetState)
    setActionError(null)
    try {
      const updated = await transitionSalesOrder(so.id, targetState)
      setSo(updated)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Transition failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (reason: string) => {
    if (!so) return
    setActionLoading('cancel')
    setActionError(null)
    try {
      const updated = await cancelSalesOrder(so.id, reason)
      setSo(updated)
      setCancelModalOpen(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Cancellation failed')
    } finally {
      setActionLoading(null)
    }
  }

  // --- Loading ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-amber-600">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading Sales Order...
      </div>
    )
  }

  // --- Error --------------------------------------------------------------
  if (error || !so) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? 'Sales Order not found'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/sales/sales-orders')}
          icon={<ArrowLeft size={14} />}
        >
          Back to Sales Orders
        </Button>
      </div>
    )
  }

  const nextStates = SO_TRANSITIONS[so.status] ?? []
  const canCancel = CANCELLABLE_STATES.has(so.status)

  // Compute SO total value
  const totalValue = (so.line_items ?? []).reduce((sum, li) => {
    return sum + Number(li.agreed_unit_price ?? 0) * Number(li.quantity ?? 0)
  }, 0)

  return (
    <div className="max-w-7xl space-y-6">
      {/* -- Page header -------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/sales/sales-orders')}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
          aria-label="Back to Sales Orders"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{so.so_number}</h1>
            <StateMachineBadge state={so.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Created {formatDate(so.created_at)}
            {so.updated_at && `  Updated ${formatDate(so.updated_at)}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              icon={<XCircle size={14} />}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* -- Cancellation reason banner ------------------------------ */}
      {so.status === 'Cancelled' && so.cancellation_reason && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
          <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Order Cancelled</p>
            <p className="text-sm text-red-700 mt-0.5">{so.cancellation_reason}</p>
          </div>
        </div>
      )}

      {/* -- Action error -------------------------------------------- */}
      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* -- Transition actions -------------------------------------- */}
      {nextStates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Advance Order State</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {nextStates.map((state) => (
              <Button
                key={state}
                variant="secondary"
                size="sm"
                loading={actionLoading === state}
                onClick={() => handleTransition(state)}
              >
                †' {state}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* -- Order details ------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">SO Number</p>
            <p className="font-mono font-semibold text-gray-900 mt-0.5">{so.so_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
            <p className="text-gray-900 mt-0.5">{so.customer_name ?? <span className="font-mono text-xs">{so.customer_id}</span>}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
            <p className="text-gray-900 font-semibold mt-0.5">
              {totalValue > 0 ? formatINR(totalValue) : '-'}
            </p>
          </div>
          {so.customer_po_id && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Customer PO</p>
              <button
                type="button"
                onClick={() => navigate(`/sales/customer-pos/${so.customer_po_id}`)}
                className="text-amber-600 hover:text-amber-800 text-sm font-medium mt-0.5"
              >
                View CPO "
              </button>
            </div>
          )}
          {so.quotation_id && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Quotation</p>
              <button
                type="button"
                onClick={() => navigate(`/sales/quotations/${so.quotation_id}`)}
                className="text-amber-600 hover:text-amber-800 text-sm font-medium mt-0.5"
              >
                View Quotation "
              </button>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <div className="mt-1">
              <StateMachineBadge state={so.status} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* -- Line Items ---------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Line Items ({(so.line_items ?? []).length})
          </h2>
          {totalValue > 0 && (
            <span className="text-sm font-semibold text-gray-800">
              Total: {formatINR(totalValue)}
            </span>
          )}
        </div>

        {(so.line_items ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No line items on this Sales Order.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part No.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Drawing No.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rev</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Dispatched</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(so.line_items ?? []).map((li, idx) => (
                  <tr key={li.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-2 text-xs text-gray-400 font-semibold">{li.line_number}</td>
                    <td className="px-4 py-2 text-gray-800">{li.part_number ?? '-'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">{li.drawing_number ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-600">{li.drawing_revision ?? '-'}</td>
                    <td className="px-4 py-2 text-right text-gray-800">
                      {li.quantity != null ? li.quantity.toLocaleString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-gray-800">
                      {li.agreed_unit_price != null
                        ? `${Number(li.agreed_unit_price).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}`
                        : '-'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {li.delivery_date ? formatDate(li.delivery_date) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {li.dispatched_qty != null
                        ? li.dispatched_qty.toLocaleString('en-IN')
                        : '0'}
                    </td>
                    <td className="px-4 py-2">
                      {li.status ? (
                        <Badge variant="default" size="sm">{li.status}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* -- Cancel modal -------------------------------------------- */}
      <CancelModal
        open={cancelModalOpen}
        loading={actionLoading === 'cancel'}
        onConfirm={handleCancel}
        onClose={() => {
          if (actionLoading !== 'cancel') setCancelModalOpen(false)
        }}
      />
    </div>
  )
}
