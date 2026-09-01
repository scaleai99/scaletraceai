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
  Download,
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
import * as F from '../../components/flow/FlowUi'
import { ItemPicker, type ItemPickerSelection } from '../../components/ui/ItemPicker'
import {
  approveQuotation,
  convertQuotationToCPO,
  getQuotation,
  listQuotations,
  Quotation,
  reviseQuotation,
  sendQuotation,
  submitQuotation,
  addQuotationLineItem,
  updateQuotationLineItem,
  deleteQuotationLineItem,
  type QuotationLineItemCreate,
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
// Quotation-page flow stages (screenshots 5–12). Stages 1–4 live on the RFQ
// page. Mapped to the real quotation lifecycle where a status exists.
// ---------------------------------------------------------------------------
const QUO_FLOW_STAGES: F.FlowStageDef[] = [
  { n: 5, title: 'AI Process Planning & Costing', sub: 'Cost build-up', group: 'COSTING & PRICING' },
  { n: 6, title: 'Commercial Pricing', sub: 'Margin & selling price', group: 'COSTING & PRICING' },
  { n: 7, title: 'Approval Workflow', sub: 'Margin matrix routing', group: 'APPROVAL & RELEASE' },
  { n: 8, title: 'Quotation Released', sub: 'Sent to customer', group: 'APPROVAL & RELEASE' },
  { n: 9, title: 'Negotiation / Revision', sub: 'Revision history', group: 'CUSTOMER RESPONSE' },
  { n: 10, title: 'Customer PO Received', sub: 'PO comparison', group: 'CUSTOMER RESPONSE' },
  { n: 11, title: 'Contract Review', sub: 'Terms acceptance', group: 'ORDER EXECUTION' },
  { n: 12, title: 'Sales Order', sub: 'Handover to planning', group: 'ORDER EXECUTION' },
]

function stageOfQuotation(status: string): number {
  switch (status) {
    case 'Draft': return 5
    case 'Pending Approval':
    case 'Approved': return 7
    case 'Sent': return 8
    case 'Revision Requested': return 9
    case 'Won': return 10
    case 'Lost': return 9
    default: return 5
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
  const [activeStage, setActiveStage] = useState<number | null>(null)
  const [lineBusy, setLineBusy] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [showAddLine, setShowAddLine] = useState(false)
  const [lineForm, setLineForm] = useState<{ item_id: string | null; part_number: string; drawing_number: string; quantity: string; unit_price: string }>({ item_id: null, part_number: '', drawing_number: '', quantity: '', unit_price: '' })

  const fetchQuotation = useCallback(() => {
    if (!id) return
    setLoading(true)
    getQuotation(id)
      .then(setQuotation)
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
        const d = e?.response?.data?.detail
        setError(typeof d === 'string' ? d : (d ? JSON.stringify(d) : (e?.message ?? 'Failed to load quotation')))
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

  const lineErr = (err: unknown, fallback: string) => {
    const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
    const d = e?.response?.data?.detail
    setActionError(typeof d === 'string' ? d : (d ? JSON.stringify(d) : e?.message ?? fallback))
  }

  const resetLineForm = () => { setLineForm({ item_id: null, part_number: '', drawing_number: '', quantity: '', unit_price: '' }); setEditingLineId(null); setShowAddLine(false) }

  const buildLinePayload = (): QuotationLineItemCreate => ({
    item_id: lineForm.item_id,
    part_number: lineForm.part_number || null,
    drawing_number: lineForm.drawing_number || null,
    quantity: lineForm.quantity.trim() ? parseInt(lineForm.quantity, 10) : null,
    unit_price: lineForm.unit_price.trim() ? Number(lineForm.unit_price) : null,
  })

  const handleAddLine = async () => {
    if (!quotation) return
    setLineBusy(true); setActionError(null)
    try {
      const updated = await addQuotationLineItem(quotation.id, buildLinePayload())
      setQuotation(updated); resetLineForm()
    } catch (err) { lineErr(err, 'Failed to add line item') } finally { setLineBusy(false) }
  }

  const handleUpdateLine = async (lineId: string) => {
    if (!quotation) return
    setLineBusy(true); setActionError(null)
    try {
      const updated = await updateQuotationLineItem(quotation.id, lineId, buildLinePayload())
      setQuotation(updated); resetLineForm()
    } catch (err) { lineErr(err, 'Failed to update line item') } finally { setLineBusy(false) }
  }

  const handleDeleteLine = async (lineId: string) => {
    if (!quotation) return
    setLineBusy(true); setActionError(null)
    try {
      const updated = await deleteQuotationLineItem(quotation.id, lineId)
      setQuotation(updated)
    } catch (err) { lineErr(err, 'Failed to delete line item') } finally { setLineBusy(false) }
  }

  const startEditLine = (li: { id: string; part_number: string | null; drawing_number: string | null; quantity: number | null; unit_price: number | null }) => {
    setEditingLineId(li.id); setShowAddLine(false)
    setLineForm({ item_id: (li as { item_id?: string | null }).item_id ?? null, part_number: li.part_number ?? '', drawing_number: li.drawing_number ?? '', quantity: li.quantity != null ? String(li.quantity) : '', unit_price: li.unit_price != null ? String(li.unit_price) : '' })
  }

  const handleSubmitForApproval = async () => {
    if (!quotation) return
    setActionLoading('submit'); setActionError(null)
    try {
      const updated = await submitQuotation(quotation.id)
      setQuotation(updated)
    } catch (err) { lineErr(err, 'Submit failed') } finally { setActionLoading(null) }
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

  const currentStage = stageOfQuotation(quotation.status)
  const viewStage = activeStage ?? currentStage
  const doneStages = new Set<number>()
  if (quotation.status !== 'Draft') { doneStages.add(5); doneStages.add(6) }
  if (['Approved', 'Sent', 'Won', 'Lost'].includes(quotation.status)) doneStages.add(7)
  if (quotation.sent_at) doneStages.add(8)
  if (quotation.status === 'Won') { doneStages.add(9); doneStages.add(10) }
  const customerLabel = quotation.customer_name || quotation.customer_id
  const grandTotal = quotation.total_value ?? lineItems.reduce((t, li) => t + (li.total_price ?? 0), 0)
  const isEditable = ['Draft', 'Revision Requested'].includes(quotation.status)

  return (
    <div className="max-w-7xl space-y-5">
      {showRevisions && (
        <RevisionDrawer quotation={quotation} onClose={() => setShowRevisions(false)} onNavigate={(qid) => { setShowRevisions(false); navigate(`/sales/quotations/${qid}`) }} />
      )}

      {/* -- Page header -------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/sales/quotations')} className="text-gray-500 hover:text-gray-700 p-1 rounded" aria-label="Back to Quotations">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{quotation.quotation_number}</h1>
            {quotation.revision > 0 && <Badge variant="info" size="sm">Rev {quotation.revision}</Badge>}
            <Badge variant={statusVariant(quotation.status)} size="sm">{quotation.status}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {customerLabel}{quotation.validity_date && ` · Valid till ${formatDate(quotation.validity_date)}`} · {formatINR(grandTotal)}
          </p>
        </div>
      </div>

      {/* -- Stage strip (Costing → Order Execution) --------------- */}
      <F.StageStrip stages={QUO_FLOW_STAGES} active={viewStage} done={doneStages} onSelect={setActiveStage} />

      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{actionError}</div>
      )}

      {/* -- Active stage ------------------------------------------- */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-6">
        {/* ── Stage 5 · AI Process Planning & Costing ── */}
        {viewStage === 5 && (
          <>
            <F.StageHeader n={5} group="COSTING & PRICING" title="AI Process Planning & Costing"
              desc="Process plan and cost build-up per line item — material, machining, tooling and special-process cost."
              meta={<>
                <F.MetaChip label="Line Items" value={String(lineItems.length)} />
                <F.MetaChip label="Total Value" value={formatINR(grandTotal)} tone="indigo" />
                <F.MetaChip label="Status" value={quotation.status} />
              </>} />
            <F.Card title="Cost Summary" right={<span className="text-xs text-gray-400">{lineItems.length} line items</span>}>
              {lineItems.length === 0 ? (
                <p className="text-sm text-gray-400">No line items on this quotation.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="pb-2 font-medium">Part No.</th><th className="pb-2 text-right font-medium">Qty</th><th className="pb-2 text-right font-medium">Unit Price</th><th className="pb-2 text-right font-medium">Total</th><th className="pb-2 pl-4 font-medium">Costing Sheet</th>
                  </tr></thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <tr key={li.id} className="border-b border-gray-50">
                        <td className="py-2.5 font-mono text-indigo-600">{li.part_number ?? '—'}</td>
                        <td className="py-2.5 text-right">{li.quantity ?? '—'}</td>
                        <td className="py-2.5 text-right font-mono">{li.unit_price != null ? formatINR(li.unit_price) : '—'}</td>
                        <td className="py-2.5 text-right font-mono">{li.total_price != null ? formatINR(li.total_price) : '—'}</td>
                        <td className="py-2.5 pl-4">{li.costing_sheet_id ? <F.Badge text="Linked" tone="green" /> : <span className="text-xs text-gray-400">None</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="mt-4"><F.PlaceholderNote>Detailed AI cost build-up (material, machining, tooling, overheads and confidence) is stored per line item in the Costing module and linked via the costing sheet above.</F.PlaceholderNote></div>
              <F.Footer><button className={F.btnPrimary} onClick={() => setActiveStage(6)}>Review Pricing →</button></F.Footer>
            </F.Card>
          </>
        )}

        {/* ── Stage 6 · Commercial Pricing ── */}
        {viewStage === 6 && (
          <>
            <F.StageHeader n={6} group="COSTING & PRICING" title="Commercial Pricing"
              desc="Selling price per line, quotation totals and commercial terms."
              meta={<>
                <F.MetaChip label="Grand Total" value={formatINR(grandTotal)} tone="green" />
                <F.MetaChip label="Payment Terms" value={quotation.payment_terms != null ? `${quotation.payment_terms} Days` : '—'} />
                <F.MetaChip label="Lead Time" value={quotation.delivery_lead_days != null ? `${quotation.delivery_lead_days} Days` : '—'} />
              </>} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <F.Card title="Line Pricing" right={isEditable ? <button className={F.btnGhost + ' !py-1.5 !px-3 !text-xs'} onClick={() => { resetLineForm(); setShowAddLine(true) }}>+ Add line</button> : <F.Badge text="Read-only" tone="gray" />}>
                {isEditable && (showAddLine || editingLineId) && (
                  <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-2">
                    <label className="text-[11px] font-medium text-gray-500">Link to Item / Part Master</label>
                    <ItemPicker
                      value={lineForm.item_id}
                      onSelect={(sel: ItemPickerSelection | null) => setLineForm((p) => ({
                        ...p,
                        item_id: sel?.item_id ?? null,
                        part_number: sel?.part_number ?? p.part_number,
                        drawing_number: sel?.drawing_number ?? p.drawing_number,
                      }))}
                    />
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400"><th className="pb-2 font-medium">Part No.</th><th className="pb-2 font-medium">Drawing</th><th className="pb-2 text-right font-medium">Qty</th><th className="pb-2 text-right font-medium">Unit Price</th><th className="pb-2 text-right font-medium">Total</th>{isEditable && <th className="pb-2" />}</tr></thead>
                  <tbody>
                    {lineItems.map((li) => (
                      editingLineId === li.id ? (
                        <tr key={li.id} className="border-b border-gray-50 bg-indigo-50/40">
                          <td className="py-1.5 pr-2"><input value={lineForm.part_number} onChange={(e) => setLineForm((p) => ({ ...p, part_number: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Part No." /></td>
                          <td className="py-1.5 pr-2"><input value={lineForm.drawing_number} onChange={(e) => setLineForm((p) => ({ ...p, drawing_number: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Drawing" /></td>
                          <td className="py-1.5 pr-2"><input type="number" value={lineForm.quantity} onChange={(e) => setLineForm((p) => ({ ...p, quantity: e.target.value }))} className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-xs" /></td>
                          <td className="py-1.5 pr-2"><input type="number" value={lineForm.unit_price} onChange={(e) => setLineForm((p) => ({ ...p, unit_price: e.target.value }))} className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-xs" /></td>
                          <td className="py-1.5 text-right font-mono text-gray-400">{(lineForm.quantity && lineForm.unit_price) ? formatINR(Number(lineForm.quantity) * Number(lineForm.unit_price)) : '—'}</td>
                          <td className="py-1.5 pl-2 text-right whitespace-nowrap">
                            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50" disabled={lineBusy} onClick={() => handleUpdateLine(li.id)}>Save</button>
                            <button className="ml-2 text-xs text-gray-500 hover:text-gray-700" onClick={resetLineForm}>Cancel</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={li.id} className="border-b border-gray-50">
                          <td className="py-2.5 font-mono text-indigo-600">{li.part_number ?? '—'}</td>
                          <td className="py-2.5 font-mono text-gray-500">{li.drawing_number ?? '—'}</td>
                          <td className="py-2.5 text-right">{li.quantity ?? '—'}</td>
                          <td className="py-2.5 text-right font-mono">{li.unit_price != null ? formatINR(li.unit_price) : '—'}</td>
                          <td className="py-2.5 text-right font-mono">{li.total_price != null ? formatINR(li.total_price) : '—'}</td>
                          {isEditable && (
                            <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                              <button className="text-xs text-indigo-600 hover:text-indigo-800" onClick={() => startEditLine(li)}>Edit</button>
                              <button className="ml-2 text-xs text-rose-500 hover:text-rose-700 disabled:opacity-50" disabled={lineBusy} onClick={() => handleDeleteLine(li.id)}>Delete</button>
                            </td>
                          )}
                        </tr>
                      )
                    ))}
                    {isEditable && showAddLine && (
                      <tr className="border-b border-gray-50 bg-emerald-50/40">
                        <td className="py-1.5 pr-2"><input value={lineForm.part_number} onChange={(e) => setLineForm((p) => ({ ...p, part_number: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Part No." /></td>
                        <td className="py-1.5 pr-2"><input value={lineForm.drawing_number} onChange={(e) => setLineForm((p) => ({ ...p, drawing_number: e.target.value }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Drawing" /></td>
                        <td className="py-1.5 pr-2"><input type="number" value={lineForm.quantity} onChange={(e) => setLineForm((p) => ({ ...p, quantity: e.target.value }))} className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-xs" placeholder="Qty" /></td>
                        <td className="py-1.5 pr-2"><input type="number" value={lineForm.unit_price} onChange={(e) => setLineForm((p) => ({ ...p, unit_price: e.target.value }))} className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-xs" placeholder="Price" /></td>
                        <td className="py-1.5 text-right font-mono text-gray-400">{(lineForm.quantity && lineForm.unit_price) ? formatINR(Number(lineForm.quantity) * Number(lineForm.unit_price)) : '—'}</td>
                        <td className="py-1.5 pl-2 text-right whitespace-nowrap">
                          <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50" disabled={lineBusy} onClick={handleAddLine}>Add</button>
                          <button className="ml-2 text-xs text-gray-500 hover:text-gray-700" onClick={resetLineForm}>Cancel</button>
                        </td>
                      </tr>
                    )}
                    {lineItems.length === 0 && !showAddLine && (
                      <tr><td colSpan={isEditable ? 6 : 5} className="py-6 text-center text-sm text-gray-400">No line items yet.{isEditable ? ' Click “+ Add line”.' : ''}</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-sm font-bold"><span>Grand Total</span><span className="font-mono text-indigo-600">{formatINR(grandTotal)}</span></div>
                {!isEditable && <div className="mt-3"><F.PlaceholderNote>Line items are editable only while the quotation is in Draft or Revision Requested.</F.PlaceholderNote></div>}
              </F.Card>
              <F.Card title="Commercial Terms">
                <div className="divide-y divide-gray-100">
                  <F.Row label="Validity" value={quotation.validity_date ? formatDate(quotation.validity_date) : '—'} />
                  <F.Row label="Payment Terms" value={quotation.payment_terms != null ? `${quotation.payment_terms} Days` : '—'} />
                  <F.Row label="Delivery Lead Time" value={quotation.delivery_lead_days != null ? `${quotation.delivery_lead_days} Days` : '—'} />
                  <F.Row label="Customer" value={customerLabel} />
                </div>
                <div className="mt-4"><F.PlaceholderNote>Margin vs. cost base is computed from the linked costing sheets; a summarised margin indicator will show here once cost-base roll-up is exposed on the quotation API.</F.PlaceholderNote></div>
                <F.Footer><button className={F.btnPrimary} onClick={() => setActiveStage(7)}>Go to Approval →</button></F.Footer>
              </F.Card>
            </div>
          </>
        )}

        {/* ── Stage 7 · Approval Workflow ── */}
        {viewStage === 7 && (
          <>
            <F.StageHeader n={7} group="APPROVAL & RELEASE" title="Approval Workflow"
              desc="Quotation routed for approval before release to the customer."
              meta={<>
                <F.MetaChip label="Status" value={quotation.status} tone={quotation.status === 'Approved' ? 'green' : 'amber'} />
                <F.MetaChip label="Grand Total" value={formatINR(grandTotal)} tone="indigo" />
                <F.MetaChip label="Revision" value={String(quotation.revision)} />
              </>} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <F.Card title="Approval Timeline" right={<F.Badge text={quotation.status} tone={quotation.status === 'Approved' ? 'green' : 'amber'} />}>
                <div className="space-y-1">
                  <div className="flex gap-3 pb-3"><span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckCircle size={14} /></span><div><div className="text-sm font-semibold text-gray-800">Prepared</div><div className="font-mono text-xs text-gray-400">{formatDateTime(quotation.created_at)}</div></div></div>
                  <div className="flex gap-3 pb-3"><span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${quotation.approved_at ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}><CheckCircle size={14} /></span><div><div className="text-sm font-semibold text-gray-800">Approved</div><div className="font-mono text-xs text-gray-400">{quotation.approved_at ? formatDateTime(quotation.approved_at) : 'Pending'}</div></div></div>
                  <div className="flex gap-3"><span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${quotation.sent_at ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}><Send size={13} /></span><div><div className="text-sm font-semibold text-gray-800">Released</div><div className="font-mono text-xs text-gray-400">{quotation.sent_at ? formatDateTime(quotation.sent_at) : 'Pending'}</div></div></div>
                </div>
                <F.Footer>
                  {isEditable ? (
                    <button className={F.btnPrimary} onClick={handleSubmitForApproval} disabled={actionLoading === 'submit'}>{actionLoading === 'submit' ? 'Submitting…' : 'Submit for Approval →'}</button>
                  ) : canApprove ? (
                    <button className={F.btnSuccess} onClick={handleApprove} disabled={actionLoading === 'approve'}>{actionLoading === 'approve' ? 'Approving…' : 'Approve & Release →'}</button>
                  ) : (
                    <button className={F.btnPrimary} onClick={() => setActiveStage(8)} disabled={!['Approved', 'Sent', 'Won'].includes(quotation.status)}>View Released Quote →</button>
                  )}
                </F.Footer>
              </F.Card>
              <F.Card title="Automatic Approval Matrix">
                {(() => {
                  const tiers = [
                    { range: '≥ 25%', role: 'Sales Manager' },
                    { range: '20 – 24.99%', role: 'Business Head' },
                    { range: '15 – 19.99%', role: 'CEO' },
                    { range: '< 15%', role: 'CEO + Finance' },
                  ]
                  const req = quotation.required_approval_level
                  return (
                    <>
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Quotation margin</span>
                        <span className="font-semibold">{quotation.margin_pct != null ? `${quotation.margin_pct.toFixed(2)}%` : 'Not costed'}</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400"><th className="pb-2 font-medium">Margin</th><th className="pb-2 font-medium">Required Approval</th></tr></thead>
                        <tbody>
                          {tiers.map((t) => {
                            const active = req === t.role
                            return (
                              <tr key={t.role} className={`border-b border-gray-50 ${active ? 'bg-indigo-50' : ''}`}>
                                <td className="py-2">{t.range}</td>
                                <td className={`py-2 font-medium ${active ? 'text-indigo-700' : 'text-gray-700'}`}>{t.role}{active && ' ←'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      <div className="mt-3 divide-y divide-gray-100">
                        <F.Row label="Required approval" value={req ? <span className="font-semibold text-indigo-700">{req}</span> : '—'} />
                        <F.Row label="Approver" value={quotation.approved_by ?? <span className="text-gray-400">Not yet approved</span>} />
                        <F.Row label="Approved at" value={quotation.approved_at ? formatDateTime(quotation.approved_at) : '—'} />
                      </div>
                      {quotation.margin_pct == null && (
                        <div className="mt-3"><F.PlaceholderNote>Margin is derived from the costing sheets linked to the quotation's line items. Link a costing sheet (from the AI costing engine) to route approval automatically.</F.PlaceholderNote></div>
                      )}
                    </>
                  )
                })()}
              </F.Card>
            </div>
          </>
        )}

        {/* ── Stage 8 · Quotation Released ── */}
        {viewStage === 8 && (
          <>
            <F.StageHeader n={8} group="APPROVAL & RELEASE" title="Quotation Released"
              desc="Formal quotation document. Generate/send the PDF and track acknowledgement."
              meta={<>
                <F.MetaChip label="Quotation No." value={quotation.quotation_number} />
                <F.MetaChip label="Validity" value={quotation.validity_date ? formatDate(quotation.validity_date) : '—'} />
                <F.MetaChip label="Grand Total" value={formatINR(grandTotal)} tone="indigo" />
              </>} />
            <F.Card>
              <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                <div><div className="text-xl font-bold text-gray-900">Quotation</div><div className="text-sm text-gray-400">{quotation.status}{quotation.sent_at ? ` · Sent ${formatDate(quotation.sent_at)}` : ''}</div></div>
                <div className="text-right text-sm"><div className="font-mono font-semibold text-gray-800">{quotation.quotation_number}</div><div className="text-gray-500">Rev {quotation.revision}</div>{quotation.validity_date && <div className="text-gray-500">Valid till {formatDate(quotation.validity_date)}</div>}</div>
              </div>
              <div className="grid grid-cols-2 gap-6 py-4 text-sm">
                <div><div className="text-xs uppercase tracking-wide text-gray-400">Bill To</div><div className="mt-1 text-gray-800">{customerLabel}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-gray-400">Commercial Terms</div><div className="mt-1 text-gray-600">Payment: {quotation.payment_terms != null ? `${quotation.payment_terms} Days` : '—'} · Delivery: {quotation.delivery_lead_days != null ? `${quotation.delivery_lead_days} Days` : '—'}</div></div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400"><th className="px-3 py-2 font-medium">Sr#</th><th className="px-3 py-2 font-medium">Part No.</th><th className="px-3 py-2 font-medium">Drawing</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Unit Price</th><th className="px-3 py-2 text-right font-medium">Total</th></tr></thead>
                <tbody>{lineItems.map((li, i) => <tr key={li.id} className="border-b border-gray-50"><td className="px-3 py-2.5 text-gray-500">{i + 1}</td><td className="px-3 py-2.5 font-mono">{li.part_number ?? '—'}</td><td className="px-3 py-2.5 font-mono text-gray-500">{li.drawing_number ?? '—'}</td><td className="px-3 py-2.5 text-right">{li.quantity ?? '—'}</td><td className="px-3 py-2.5 text-right font-mono">{li.unit_price != null ? formatINR(li.unit_price) : '—'}</td><td className="px-3 py-2.5 text-right font-mono">{li.total_price != null ? formatINR(li.total_price) : '—'}</td></tr>)}</tbody>
              </table>
              <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-sm font-bold"><span>Grand Total (INR)</span><span className="font-mono text-indigo-600">{formatINR(grandTotal)}</span></div>
              <F.Footer>
                <button className={F.btnGhost} onClick={handleSend} disabled={actionLoading === 'send'}><Download size={14} /> {actionLoading === 'send' ? 'Generating…' : 'Download / Send PDF'}</button>
                <button className={F.btnPrimary} onClick={() => setActiveStage(9)}>Track Response →</button>
              </F.Footer>
            </F.Card>
          </>
        )}

        {/* ── Stage 9 · Negotiation / Revision ── */}
        {viewStage === 9 && (
          <>
            <F.StageHeader n={9} group="CUSTOMER RESPONSE" title="Negotiation / Revision"
              desc="Customer negotiation tracked against the released quote. New revisions are logged with their own price and terms."
              meta={<>
                <F.MetaChip label="Current Rev" value={String(quotation.revision)} />
                <F.MetaChip label="Status" value={quotation.status} tone={quotation.status === 'Revision Requested' ? 'amber' : 'gray'} />
                <F.MetaChip label="Value" value={formatINR(grandTotal)} />
              </>} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <F.Card title="Revision" right={<button className={F.btnGhost + ' !py-1.5 !px-3 !text-xs'} onClick={() => setShowRevisions(true)}>View History</button>}>
                <div className="divide-y divide-gray-100">
                  <F.Row label="Revision Number" value={String(quotation.revision)} />
                  <F.Row label="Parent Quotation" value={quotation.parent_id ? <span className="font-mono">{quotation.parent_id}</span> : <span className="text-gray-400">Original</span>} />
                  <F.Row label="Current Value" value={formatINR(grandTotal)} />
                </div>
              </F.Card>
              <F.Card title="Next Action">
                {canRevise ? (
                  <>
                    <p className="text-sm text-gray-600">Create a new revision of this quotation to log a renegotiated price. The current quotation is preserved in the revision history.</p>
                    <F.Footer><button className={F.btnPrimary} onClick={() => setShowReviseConfirm(true)} disabled={actionLoading === 'revise'}>{actionLoading === 'revise' ? 'Creating…' : 'Create Revision →'}</button></F.Footer>
                  </>
                ) : (
                  <F.PlaceholderNote>Revisions can be created once the quotation has been Approved or Sent.</F.PlaceholderNote>
                )}
              </F.Card>
            </div>
          </>
        )}

        {/* ── Stage 10 · Customer PO Received ── */}
        {viewStage === 10 && (
          <>
            <F.StageHeader n={10} group="CUSTOMER RESPONSE" title="Customer PO Received"
              desc="Convert the accepted quotation into a Customer PO. The PO is then compared line-by-line against this quotation."
              meta={<>
                <F.MetaChip label="Quotation" value={quotation.quotation_number} />
                <F.MetaChip label="Status" value={quotation.status} tone={quotation.status === 'Won' ? 'green' : 'gray'} />
                <F.MetaChip label="Value" value={formatINR(grandTotal)} tone="indigo" />
              </>} />
            <F.Card title="Convert to Customer PO">
              {canConvert ? (
                <>
                  <p className="text-sm text-gray-600">Create a Customer PO skeleton from this quotation. Line-by-line PO-vs-quote comparison and deviation review happen on the Customer PO page.</p>
                  <F.Footer>
                    <button className={F.btnGhost} onClick={() => navigate('/sales/customer-pos')}>Open Customer POs</button>
                    <button className={F.btnPrimary} onClick={() => setShowConvertConfirm(true)} disabled={actionLoading === 'convert'}>{actionLoading === 'convert' ? 'Converting…' : 'Convert to Customer PO →'}</button>
                  </F.Footer>
                </>
              ) : (
                <F.PlaceholderNote>Conversion to a Customer PO becomes available once the quotation is Approved, Sent or Won.</F.PlaceholderNote>
              )}
            </F.Card>
          </>
        )}

        {/* ── Stage 11 · Contract Review ── */}
        {viewStage === 11 && (
          <>
            <F.StageHeader n={11} group="ORDER EXECUTION" title="Contract Review"
              desc="Commercial, technical and quality terms on the customer PO are reviewed before acceptance."
              meta={<>
                <F.MetaChip label="Quotation" value={quotation.quotation_number} />
                <F.MetaChip label="Status" value={quotation.status} />
              </>} />
            <F.Card title="Contract Review">
              <F.PlaceholderNote>PO-stage contract review is performed against the Customer PO created from this quotation — open it on the Customer PO page. (A PO-scoped review type is a known backend gap; today the contract-review panel is RFQ-scoped.)</F.PlaceholderNote>
              <F.Footer><button className={F.btnGhost} onClick={() => navigate('/sales/customer-pos')}>Open Customer POs →</button></F.Footer>
            </F.Card>
          </>
        )}

        {/* ── Stage 12 · Sales Order ── */}
        {viewStage === 12 && (
          <>
            <F.StageHeader n={12} group="ORDER EXECUTION" title="Sales Order"
              desc="Once the contract is accepted, a Sales Order is created from the Customer PO and handed to production planning."
              meta={<>
                <F.MetaChip label="Quotation" value={quotation.quotation_number} />
                <F.MetaChip label="Status" value={quotation.status} />
              </>} />
            <F.Card title="Sales Order">
              <F.PlaceholderNote>The Sales Order is created downstream from the Customer PO (Customer PO → Convert to Sales Order). Open the Sales Orders list to view or create it.</F.PlaceholderNote>
              <F.Footer><button className={F.btnGhost} onClick={() => navigate('/sales/sales-orders')}>Open Sales Orders →</button></F.Footer>
            </F.Card>
          </>
        )}
      </div>

      {/* -- Quotation details (always visible) -------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Quotation Details</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<GitBranch size={14} />} onClick={() => setShowRevisions(true)}>Revisions</Button>
            {canRevise && <Button variant="ghost" size="sm" onClick={() => setShowReviseConfirm(true)}>Revise</Button>}
            {canConvert && <Button variant="secondary" size="sm" onClick={() => setShowConvertConfirm(true)}>Convert to Customer PO</Button>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">Quotation No.</p><p className="font-mono font-semibold text-gray-900 mt-0.5">{quotation.quotation_number}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p><p className="text-gray-900 mt-0.5">{customerLabel}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">Status</p><div className="mt-0.5"><Badge variant={statusVariant(quotation.status)} size="sm">{quotation.status}</Badge></div></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wide">Grand Total</p><p className="font-semibold text-gray-900 mt-0.5">{formatINR(grandTotal)}</p></div>
        </div>
      </div>

      {/* -- Audit Trail --------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AuditTrailPanel entries={auditEntries} title="Audit Trail" />
      </div>

      {/* -- Revise confirm modal ------------------------------------ */}
      <Modal open={showReviseConfirm} onClose={() => setShowReviseConfirm(false)} title="Create Revision">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Create a new revision of {quotation.quotation_number}? The current quotation is preserved and a new editable revision is created.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowReviseConfirm(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={actionLoading === 'revise'} onClick={handleRevise}>Create Revision</Button>
          </div>
        </div>
      </Modal>

      {/* -- Convert confirm modal ----------------------------------- */}
      <Modal open={showConvertConfirm} onClose={() => setShowConvertConfirm(false)} title="Convert to Customer PO">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Convert {quotation.quotation_number} into a Customer PO skeleton? You'll be taken to the new Customer PO.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowConvertConfirm(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={actionLoading === 'convert'} onClick={handleConvertToCPO}>Convert</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
