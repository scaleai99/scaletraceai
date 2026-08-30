/**
 * QuotationDetailPage - Module 10: Quotation detail view.
 *
 * Features:
 * 1. Header: QT number, status badge, revision badge if > 0
 * 2. Actions: Approve / Send (PDF download) / Revise / Convert to Customer PO
 * 3. Line items table with INR formatting
 * 4. Revision history drawer
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  GitBranch,
  Loader2,
  Package,
  Send,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  Modal,
  StateMachineBadge,
  AuditTrailPanel,
} from '../../components/ui'
import type { AuditEntry } from '../../components/ui/AuditTrailPanel'
import { formatDate, formatDateTime, formatINR } from '../../lib/utils'
import {
  approveQuotation,
  convertQuotationToCPO,
  getQuotation,
  listQuotations,
  Quotation,
  reviseQuotation,
  sendQuotation,
} from '../../api/quotationApi'

// ---------------------------------------------------------------------------
// Status badge variant helper
// ---------------------------------------------------------------------------
function statusVariant(
  s: string
): 'success' | 'warning' | 'danger' | 'default' | 'info' {
  switch (s) {
    case 'Draft': return 'default'
    case 'Pending Approval': return 'warning'
    case 'Approved': case 'Won': return 'success'
    case 'Sent': return 'info'
    case 'Lost': return 'danger'
    case 'Revision Requested': return 'warning'
    default: return 'default'
  }
}

// ---------------------------------------------------------------------------
// Revision History Drawer
// ---------------------------------------------------------------------------
interface RevisionDrawerProps {
  quotation: Quotation
  onClose: () => void
  onNavigate: (id: string) => void
}

function RevisionDrawer({ quotation, onClose, onNavigate }: RevisionDrawerProps) {
  const [revisions, setRevisions] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all quotations linked to the same RFQ or customer to build chain
    setLoading(true)
    listQuotations({ customer_id: quotation.customer_id, limit: 50 })
      .then((all) => {
        // Filter to same revision family (quotation.id as root, or parent_id chains)
        const ids = new Set<string>()
        ids.add(quotation.id)
        if (quotation.parent_id) ids.add(quotation.parent_id)

        const family = all.filter(
          (q) =>
            q.id === quotation.id ||
            q.parent_id === quotation.id ||
            (quotation.parent_id && (q.id === quotation.parent_id || q.parent_id === quotation.parent_id))
        )
        setRevisions(family.sort((a, b) => a.revision - b.revision))
      })
      .catch(() => setRevisions([quotation]))
      .finally(() => setLoading(false))
  }, [quotation])

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Revision History</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 rounded p-0.5"
          aria-label="Close revision drawer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={18} className="animate-spin text-amber-600" />
          </div>
        ) : revisions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No revisions found.</p>
        ) : (
          <div className="space-y-3">
            {revisions.map((rev) => {
              const isCurrent = rev.id === quotation.id
              return (
                <button
                  key={rev.id}
                  type="button"
                  onClick={() => {
                    if (!isCurrent) {
                      onNavigate(rev.id)
                      onClose()
                    }
                  }}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    isCurrent
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold text-gray-800">
                      {rev.quotation_number}
                    </span>
                    <Badge variant={statusVariant(rev.status)} size="sm">
                      {rev.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Rev {rev.revision}</span>
                    <span></span>
                    <span>{formatDate(rev.created_at)}</span>
                  </div>
                  {rev.total_value != null && (
                    <p className="text-xs font-mono text-gray-700 mt-1">
                      {formatINR(rev.total_value)}
                    </p>
                  )}
                  {isCurrent && (
                    <span className="mt-1 inline-block text-xs font-medium text-amber-600">
                      † Current
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showRevisions, setShowRevisions] = useState(false)
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)
  const [showReviseConfirm, setShowReviseConfirm] = useState(false)

  const fetchQuotation = useCallback(() => {
    if (!id) return
    setLoading(true)
    getQuotation(id)
      .then(setQuotation)
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load quotation')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchQuotation()
  }, [fetchQuotation])

  const handleApprove = async () => {
    if (!quotation) return
    setActionLoading('approve')
    setActionError(null)
    try {
      const updated = await approveQuotation(quotation.id)
      setQuotation(updated)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Approval failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSend = async () => {
    if (!quotation) return
    setActionLoading('send')
    setActionError(null)
    try {
      const blob = await sendQuotation(quotation.id)
      // Trigger browser download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quotation.quotation_number}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      // Refresh to show Sent status
      fetchQuotation()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Send failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevise = async () => {
    if (!quotation) return
    setActionLoading('revise')
    setActionError(null)
    setShowReviseConfirm(false)
    try {
      const newRevision = await reviseQuotation(quotation.id)
      navigate(`/sales/quotations/${newRevision.id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Revision failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConvertToCPO = async () => {
    if (!quotation) return
    setActionLoading('convert')
    setActionError(null)
    setShowConvertConfirm(false)
    try {
      const result = await convertQuotationToCPO(quotation.id)
      navigate(`/sales/customer-pos/${result.customer_po_id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Conversion failed')
    } finally {
      setActionLoading(null)
    }
  }

  // ---- Loading / error states ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-amber-600">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading quotation...
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? 'Quotation not found'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/sales/quotations')}
          icon={<ArrowLeft size={14} />}
        >
          Back to Quotations
        </Button>
      </div>
    )
  }

  const lineItems = quotation.line_items ?? []
  const canApprove = quotation.status === 'Pending Approval'
  const canSend = quotation.status === 'Approved'
  const canRevise = ['Sent', 'Approved'].includes(quotation.status)
  const canConvert = ['Approved', 'Sent', 'Won'].includes(quotation.status)

  const auditEntries: AuditEntry[] = [
    {
      user: 'System',
      action: `Quotation ${quotation.quotation_number} created with status: Draft`,
      timestamp: quotation.created_at,
    },
    ...(quotation.approved_at
      ? [{
          user: 'Quality Manager',
          action: 'Quotation approved',
          timestamp: quotation.approved_at,
        }]
      : []),
    ...(quotation.sent_at
      ? [{
          user: 'System',
          action: 'Quotation PDF generated and sent',
          timestamp: quotation.sent_at,
        }]
      : []),
  ]

  return (
    <div className="max-w-7xl space-y-6">
      {/* Revision drawer overlay */}
      {showRevisions && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowRevisions(false)}
          />
          <RevisionDrawer
            quotation={quotation}
            onClose={() => setShowRevisions(false)}
            onNavigate={(qid) => navigate(`/sales/quotations/${qid}`)}
          />
        </>
      )}

      {/* -- Page header -------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/sales/quotations')}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
          aria-label="Back to Quotations"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {quotation.quotation_number}
            </h1>
            <Badge variant={statusVariant(quotation.status)}>
              {quotation.status}
            </Badge>
            {quotation.revision > 0 && (
              <Badge variant="default" size="sm">
                Rev {quotation.revision}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Created {formatDate(quotation.created_at)}
            {quotation.validity_date && `  Valid until ${formatDate(quotation.validity_date)}`}
          </p>
        </div>
      </div>

      {/* -- Action buttons ------------------------------------------ */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {actionError && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {actionError}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading === 'approve'}
              onClick={handleApprove}
              icon={<CheckCircle size={14} />}
            >
              Approve
            </Button>
          )}
          {canSend && (
            <Button
              variant="secondary"
              size="sm"
              loading={actionLoading === 'send'}
              onClick={handleSend}
              icon={<Send size={14} />}
            >
              Send (Download PDF)
            </Button>
          )}
          {canRevise && (
            <Button
              variant="secondary"
              size="sm"
              loading={actionLoading === 'revise'}
              onClick={() => setShowReviseConfirm(true)}
              icon={<GitBranch size={14} />}
            >
              Revise
            </Button>
          )}
          {canConvert && (
            <Button
              variant="secondary"
              size="sm"
              loading={actionLoading === 'convert'}
              onClick={() => setShowConvertConfirm(true)}
              icon={<Package size={14} />}
            >
              Convert to Customer PO
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRevisions(true)}
            icon={<FileText size={14} />}
          >
            Revision History
          </Button>
        </div>
      </div>

      {/* -- Summary ------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Quotation Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">QT Number</p>
            <p className="font-mono font-semibold text-gray-900 mt-0.5">{quotation.quotation_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
            <div className="mt-0.5">
              <Badge variant={statusVariant(quotation.status)} size="sm">
                {quotation.status}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Revision</p>
            <p className="text-gray-900 mt-0.5">{quotation.revision}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
            <p className="font-mono font-semibold text-gray-900 mt-0.5">
              {quotation.total_value != null ? formatINR(quotation.total_value) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Validity Date</p>
            <p className="text-gray-900 mt-0.5">
              {quotation.validity_date ? formatDate(quotation.validity_date) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Terms</p>
            <p className="text-gray-900 mt-0.5">
              {quotation.payment_terms != null ? `${quotation.payment_terms} days` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery Lead</p>
            <p className="text-gray-900 mt-0.5">
              {quotation.delivery_lead_days != null ? `${quotation.delivery_lead_days} days` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(quotation.created_at)}</p>
          </div>
        </div>
      </div>

      {/* -- Line Items ---------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Line Items ({lineItems.length})
          </h2>
        </div>

        {lineItems.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No line items on this quotation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Part No.</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Drawing No.</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Rev</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Unit Price ()</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Total ()</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map((li, idx) => {
                  const unitPrice = li.unit_price ?? 0
                  const totalPrice = li.total_price ?? (unitPrice * (li.quantity ?? 0))
                  return (
                    <tr
                      key={li.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    >
                      <td className="px-4 py-2.5 text-xs text-gray-400 font-semibold">{li.line_number}</td>
                      <td className="px-4 py-2.5 text-gray-800">{li.part_number ?? '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{li.drawing_number ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{li.drawing_revision ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-800">
                        {li.quantity != null ? li.quantity.toLocaleString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-800">
                        {li.unit_price != null ? formatINR(unitPrice) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">
                        {formatINR(totalPrice)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={6} className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700 text-base">
                    {quotation.total_value != null ? formatINR(quotation.total_value) : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* -- Audit Trail --------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AuditTrailPanel entries={auditEntries} title="Audit Trail" />
      </div>

      {/* -- Revise Confirm Modal ----------------------------------- */}
      <Modal
        open={showReviseConfirm}
        onClose={() => setShowReviseConfirm(false)}
        title="Create Revision?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create a new revision of{' '}
            <span className="font-mono font-semibold">{quotation.quotation_number}</span> (Rev{' '}
            {quotation.revision + 1}) and mark the current quotation as{' '}
            <strong>Revision Requested</strong>.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowReviseConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading === 'revise'}
              onClick={handleRevise}
            >
              Create Rev {quotation.revision + 1}
            </Button>
          </div>
        </div>
      </Modal>

      {/* -- Convert to CPO Confirm Modal --------------------------- */}
      <Modal
        open={showConvertConfirm}
        onClose={() => setShowConvertConfirm(false)}
        title="Convert to Customer PO?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create a Customer PO skeleton from quotation{' '}
            <span className="font-mono font-semibold">{quotation.quotation_number}</span> and
            redirect you to the new CPO record.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowConvertConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading === 'convert'}
              onClick={handleConvertToCPO}
            >
              Convert to CPO
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
