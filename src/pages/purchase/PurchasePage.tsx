/**
 * PurchasePage - Module 17: Purchase (tabbed)
 *
 * Tabs:
 * - PRs: table + New PR modal
 * - Purchase Orders: table, row click †' inline detail with GST breakdown + Receive Goods
 * - GRNs: table
 */

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, RefreshCw, ShoppingCart, Truck } from 'lucide-react'
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  StateMachineBadge,
  SupplierPicker,
  Table,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import type { Column } from '../../components/ui'
import { formatDate, formatINR } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_PRS, DEMO_POS } from '../../lib/demoData'
import {
  createPO,
  createPR,
  listGRNs,
  listPOs,
  listPRs,
  receivePO,
  type GRN,
  type POCreatePayload,
  type POLineCreatePayload,
  type PurchaseOrder,
  type PurchaseRequisition,
} from '../../api/purchaseApi'

type PRRow = PurchaseRequisition & Record<string, unknown>
type PORow = PurchaseOrder & Record<string, unknown>
type GRNRow = GRN & Record<string, unknown>

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------
type TabKey = 'prs' | 'pos' | 'grns'

interface TabBarProps {
  active: TabKey
  onChange: (t: TabKey) => void
  prCount: number
  poCount: number
  grnCount: number
}

function TabBar({ active, onChange, prCount, poCount, grnCount }: TabBarProps) {
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'prs', label: 'Purchase Requisitions', count: prCount },
    { key: 'pos', label: 'Purchase Orders', count: poCount },
    { key: 'grns', label: 'GRNs', count: grnCount },
  ]

  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors mr-1 ${
            active === t.key
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t.label}
          {t.count > 0 && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  colour: string
  sub?: string
}

function StatCard({ label, value, icon, colour, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colour}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New PR Modal
// ---------------------------------------------------------------------------
interface NewPRModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function NewPRModal({ open, onClose, onCreated }: NewPRModalProps) {
  const [form, setForm] = useState({
    item_code: '',
    description: '',
    quantity: '',
    uom: 'EA',
    required_date: '',
    priority: 'Normal',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!form.item_code || !form.quantity) {
      setError('Item Code and Quantity are required.')
      return
    }
    setSaving(true)
    setError(null)
    createPR({
      item_code: form.item_code,
      description: form.description || undefined,
      quantity: parseFloat(form.quantity),
      uom: form.uom,
      required_date: form.required_date || undefined,
      priority: form.priority,
    })
      .then(() => {
        onCreated()
        onClose()
        setForm({ item_code: '', description: '', quantity: '', uom: 'EA', required_date: '', priority: 'Normal' })
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create PR')
      })
      .finally(() => setSaving(false))
  }

  const priorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Normal', value: 'Normal' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Purchase Requisition"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Create PR
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Item Code"
          value={form.item_code}
          onChange={(e) => setForm((f) => ({ ...f, item_code: e.target.value }))}
          placeholder="e.g. RAW-AL6061"
          required
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Material description"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            required
          />
          <Input
            label="UOM"
            value={form.uom}
            onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))}
            placeholder="EA / KG / M"
          />
        </div>
        <Input
          label="Required Date"
          type="date"
          value={form.required_date}
          onChange={(e) => setForm((f) => ({ ...f, required_date: e.target.value }))}
        />
        <Select
          label="Priority"
          options={priorityOptions}
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Receive Goods modal
// ---------------------------------------------------------------------------
interface ReceiveGoodsModalProps {
  open: boolean
  po: PurchaseOrder | null
  onClose: () => void
  onReceived: () => void
}

function ReceiveGoodsModal({ open, po, onClose, onReceived }: ReceiveGoodsModalProps) {
  const [receiptDate, setReceiptDate] = useState('')
  const [heatCert, setHeatCert] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setReceiptDate(new Date().toISOString().split('T')[0])
      setHeatCert('')
    }
  }, [open])

  const handleSubmit = () => {
    if (!po || !receiptDate) {
      setError('Receipt date is required.')
      return
    }
    setSaving(true)
    setError(null)
    receivePO(po.id, { receipt_date: receiptDate, heat_cert_number: heatCert || undefined })
      .then(() => {
        onReceived()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to receive goods')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Receive Goods "" ${po?.po_number ?? ''}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={saving}
            icon={<CheckCircle size={14} />}
          >
            Confirm Receipt
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Receipt Date"
          type="date"
          value={receiptDate}
          onChange={(e) => setReceiptDate(e.target.value)}
          required
        />
        <Input
          label="Heat Certificate Number (optional)"
          value={heatCert}
          onChange={(e) => setHeatCert(e.target.value)}
          placeholder="e.g. CERT-2024-001"
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// PR Tab
// ---------------------------------------------------------------------------
function buildPRColumns(): Column<PRRow>[] {
  return [
    {
      key: 'pr_number',
      header: 'PR Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700">{row.pr_number as string}</span>
      ),
    },
    {
      key: 'item_code',
      header: 'Item Code',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-800">{(row.item_code as string) ?? '-'}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className="text-sm text-gray-600 truncate block max-w-xs">
          {(row.description as string) ?? '-'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (row) => (
        <span className="text-sm font-mono text-gray-700">
          {row.quantity as number} {row.uom as string}
        </span>
      ),
    },
    {
      key: 'required_date',
      header: 'Required Date',
      sortable: true,
      render: (row) => {
        const isOverdue =
          row.required_date &&
          new Date(row.required_date as string) < new Date() &&
          !['Ordered', 'Closed'].includes(row.status as string)
        return (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {row.required_date ? formatDate(row.required_date as string) : '-'}
            {isOverdue && ' š '}
          </span>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => {
        const p = row.priority as string
        const variant =
          p === 'Urgent' ? 'danger' : p === 'High' ? 'warning' : p === 'Normal' ? 'info' : 'default'
        return (
          <Badge variant={variant} size="sm">
            {p}
          </Badge>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: 'pr_date',
      header: 'Created',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-400">{formatDate(row.pr_date as string)}</span>,
    },
  ]
}

interface PRTabProps {
  onRefresh?: () => void
}

function PRTab({ onRefresh }: PRTabProps) {
  const { data: prs, isDemo, loading, error, refetch } = useDemoFallback(
    () => listPRs({ limit: 200 }),
    DEMO_PRS
  )

  const handleRefresh = () => {
    refetch()
    onRefresh?.()
  }

  const [showNew, setShowNew] = useState(false)
  const columns = buildPRColumns()
  const openCount = prs.filter((p) => p.status === 'Open').length
  const urgentCount = prs.filter((p) => p.priority === 'Urgent').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <StatCard
            label="Open PRs"
            value={openCount}
            icon={<ShoppingCart size={16} className="text-amber-600" />}
            colour="bg-amber-50"
          />
          <StatCard
            label="Urgent"
            value={urgentCount}
            icon={<Package size={16} className="text-red-500" />}
            colour="bg-red-50"
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="secondary" size="sm" onClick={handleRefresh} icon={<RefreshCw size={13} />} />
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            + New PR
          </Button>
        </div>
      </div>

      {isDemo && <DemoBanner />}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading PRs...
        </div>
      ) : (
        <Table<PRRow>
          data={prs as PRRow[]}
          columns={columns}
          rowKey={(r) => r.id as string}
          exportable
          exportFilename="purchase-requisitions"
          emptyMessage="No purchase requisitions found."
        />
      )}

      <NewPRModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={handleRefresh}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PO detail panel
// ---------------------------------------------------------------------------
function PODetailPanel({
  po,
  onReceive,
  onClose,
}: {
  po: PurchaseOrder
  onReceive: () => void
  onClose: () => void
}) {
  const lineTotal = po.line_items.reduce(
    (sum, li) => sum + (li.quantity ?? 0) * (li.unit_price ?? 0),
    0
  )
  const gstTotal = po.cgst_amount + po.sgst_amount + po.igst_amount
  const grandTotal = lineTotal + gstTotal

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 font-mono">{po.po_number}</h3>
          <p className="text-xs text-gray-500">
            Supplier: {po.supplier_id} | Date: {formatDate(po.po_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['Sent', 'Partially Received'].includes(po.status) && (
            <Button variant="primary" size="sm" icon={<Truck size={13} />} onClick={onReceive}>
              Receive Goods
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Line items */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'Item Code', 'Description', 'HSN', 'Qty', 'Unit Price', 'GST %', 'Amount', 'Received'].map(
                (h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.line_items.map((li) => (
              <tr key={li.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{li.line_number}</td>
                <td className="px-3 py-2 font-mono text-gray-800">{li.item_code ?? '-'}</td>
                <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{li.description ?? '-'}</td>
                <td className="px-3 py-2 text-gray-600">{li.hsn_code ?? '-'}</td>
                <td className="px-3 py-2 font-mono">{li.quantity ?? 0}</td>
                <td className="px-3 py-2 font-mono">‚¹{formatINR(li.unit_price ?? 0)}</td>
                <td className="px-3 py-2">{li.gst_rate ?? 0}%</td>
                <td className="px-3 py-2 font-mono">
                  ‚¹{formatINR((li.quantity ?? 0) * (li.unit_price ?? 0))}
                </td>
                <td className="px-3 py-2 font-mono">
                  <span
                    className={`${li.received_qty >= (li.quantity ?? 0) ? 'text-green-600 font-semibold' : 'text-amber-600'}`}
                  >
                    {li.received_qty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GST breakdown */}
      <div className="border-t border-gray-200 pt-4 flex justify-end">
        <dl className="space-y-1 text-sm w-64">
          <div className="flex justify-between">
            <dt className="text-gray-500">Taxable Value</dt>
            <dd className="font-mono text-gray-800">‚¹{formatINR(lineTotal)}</dd>
          </div>
          {po.cgst_amount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">CGST</dt>
              <dd className="font-mono text-gray-800">‚¹{formatINR(po.cgst_amount)}</dd>
            </div>
          )}
          {po.sgst_amount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">SGST</dt>
              <dd className="font-mono text-gray-800">‚¹{formatINR(po.sgst_amount)}</dd>
            </div>
          )}
          {po.igst_amount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">IGST</dt>
              <dd className="font-mono text-gray-800">‚¹{formatINR(po.igst_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
            <dt className="text-gray-800">Grand Total</dt>
            <dd className="font-mono text-gray-900">‚¹{formatINR(grandTotal)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New PO Modal
// ---------------------------------------------------------------------------
interface POLineForm {
  item_code: string
  description: string
  quantity: string
  unit_price: string
  gst_rate: string
  hsn_code: string
  delivery_date: string
}

const EMPTY_PO_LINE: POLineForm = {
  item_code: '', description: '', quantity: '', unit_price: '', gst_rate: '18', hsn_code: '', delivery_date: '',
}

interface NewPOModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function NewPOModal({ open, onClose, onCreated }: NewPOModalProps) {
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [lines, setLines] = useState<POLineForm[]>([{ ...EMPTY_PO_LINE }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setSupplierId(null); setDeliveryAddress(''); setPaymentTerms('')
    setLines([{ ...EMPTY_PO_LINE }]); setError(null)
  }

  const setLine = (i: number, patch: Partial<POLineForm>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_PO_LINE }])
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i))

  // Live estimate — final CGST/SGST vs IGST split is computed on the backend from state codes.
  const taxable = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0)
  const estTax = lines.reduce((sum, l) => {
    const base = (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0)
    return sum + base * ((parseFloat(l.gst_rate) || 0) / 100)
  }, 0)
  const estTotal = taxable + estTax

  const handleSubmit = () => {
    const validLines = lines.filter((l) => l.quantity.trim() && l.unit_price.trim())
    if (!supplierId) { setError('Select a supplier (only Active suppliers can receive a PO).'); return }
    if (validLines.length === 0) { setError('Add at least one line item with quantity and unit price.'); return }
    const payloadLines: POLineCreatePayload[] = validLines.map((l) => ({
      item_code: l.item_code.trim() || undefined,
      description: l.description.trim() || undefined,
      quantity: parseFloat(l.quantity),
      unit_price: parseFloat(l.unit_price),
      gst_rate: l.gst_rate.trim() ? parseFloat(l.gst_rate) : undefined,
      hsn_code: l.hsn_code.trim() || undefined,
      delivery_date: l.delivery_date || undefined,
    }))
    const payload: POCreatePayload = {
      supplier_id: supplierId,
      delivery_address: deliveryAddress.trim() || undefined,
      payment_terms: paymentTerms.trim() ? parseInt(paymentTerms, 10) : undefined,
      line_items: payloadLines,
    }
    setSaving(true); setError(null)
    createPO(payload)
      .then(() => { onCreated(); onClose(); reset() })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create purchase order')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Purchase Order"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Create PO</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SupplierPicker label="Supplier" value={supplierId} onChange={(id) => setSupplierId(id)} required />
          <Input label="Payment Terms (days)" type="number" min={0} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30" />
          <Input label="Delivery Address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Ship-to location" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
            <Button variant="secondary" size="sm" onClick={addLine}>+ Add Line</Button>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <th className="px-2 py-2 text-left font-medium">Item Code</th>
                  <th className="px-2 py-2 text-left font-medium">Description</th>
                  <th className="px-2 py-2 text-left font-medium">Qty *</th>
                  <th className="px-2 py-2 text-left font-medium">Unit Price *</th>
                  <th className="px-2 py-2 text-left font-medium">GST %</th>
                  <th className="px-2 py-2 text-left font-medium">HSN</th>
                  <th className="px-2 py-2 text-left font-medium">Delivery</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-2 py-1.5"><input value={l.item_code} onChange={(e) => setLine(i, { item_code: e.target.value })} className="w-24 border border-gray-200 rounded px-2 py-1" placeholder="RAW-AL6061" /></td>
                    <td className="px-2 py-1.5"><input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} className="w-40 border border-gray-200 rounded px-2 py-1" placeholder="Material" /></td>
                    <td className="px-2 py-1.5"><input type="number" min={0} value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} className="w-20 border border-gray-200 rounded px-2 py-1" /></td>
                    <td className="px-2 py-1.5"><input type="number" min={0} value={l.unit_price} onChange={(e) => setLine(i, { unit_price: e.target.value })} className="w-24 border border-gray-200 rounded px-2 py-1" /></td>
                    <td className="px-2 py-1.5"><input type="number" min={0} value={l.gst_rate} onChange={(e) => setLine(i, { gst_rate: e.target.value })} className="w-16 border border-gray-200 rounded px-2 py-1" /></td>
                    <td className="px-2 py-1.5"><input value={l.hsn_code} onChange={(e) => setLine(i, { hsn_code: e.target.value })} className="w-20 border border-gray-200 rounded px-2 py-1" placeholder="7601" /></td>
                    <td className="px-2 py-1.5"><input type="date" value={l.delivery_date} onChange={(e) => setLine(i, { delivery_date: e.target.value })} className="w-32 border border-gray-200 rounded px-2 py-1" /></td>
                    <td className="px-2 py-1.5 text-center">
                      {lines.length > 1 && (
                        <button type="button" onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500" title="Remove line">×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <dl className="space-y-1 text-sm w-64">
            <div className="flex justify-between"><dt className="text-gray-500">Taxable Value</dt><dd className="font-mono text-gray-800">₹{formatINR(taxable)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Estimated GST</dt><dd className="font-mono text-gray-800">₹{formatINR(estTax)}</dd></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold"><dt className="text-gray-800">Estimated Total</dt><dd className="font-mono text-gray-900">₹{formatINR(estTotal)}</dd></div>
          </dl>
        </div>
        <p className="text-[11px] text-gray-400 text-right">Estimate only — final CGST/SGST vs IGST split is computed on save from the supplier and plant state codes.</p>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// PO Tab
// ---------------------------------------------------------------------------
function buildPOColumns(): Column<PORow>[] {
  return [
    {
      key: 'po_number',
      header: 'PO Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700">{row.po_number as string}</span>
      ),
    },
    {
      key: 'supplier_id',
      header: 'Supplier',
      render: (row) => (
        <span className="text-sm text-gray-800">{(row.supplier_name as string | null) ?? (row.supplier_id as string | null) ?? '\u2014'}</span>
      ),
    },
    {
      key: 'total_value',
      header: 'Total Value',
      render: (row) => (
        <span className="text-sm font-mono text-gray-700">
          {row.total_value != null ? `‚¹${formatINR(row.total_value as number)}` : '-'}
        </span>
      ),
    },
    {
      key: 'cgst_amount',
      header: 'CGST',
      render: (row) => (
        <span className="text-xs font-mono text-gray-600">
          {(row.cgst_amount as number) > 0 ? `‚¹${formatINR(row.cgst_amount as number)}` : '-'}
        </span>
      ),
    },
    {
      key: 'sgst_amount',
      header: 'SGST',
      render: (row) => (
        <span className="text-xs font-mono text-gray-600">
          {(row.sgst_amount as number) > 0 ? `‚¹${formatINR(row.sgst_amount as number)}` : '-'}
        </span>
      ),
    },
    {
      key: 'igst_amount',
      header: 'IGST',
      render: (row) => (
        <span className="text-xs font-mono text-gray-600">
          {(row.igst_amount as number) > 0 ? `‚¹${formatINR(row.igst_amount as number)}` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: 'po_date',
      header: 'PO Date',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-400">{formatDate(row.po_date as string)}</span>,
    },
  ]
}

interface POTabProps {
  onRefresh?: () => void
}

function POTab({ onRefresh }: POTabProps) {
  const { data: pos, isDemo, loading, error, refetch } = useDemoFallback(
    () => listPOs({ limit: 200 }),
    DEMO_POS
  )

  const handleRefresh = () => {
    refetch()
    onRefresh?.()
  }

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [receiveModal, setReceiveModal] = useState(false)
  const [showNewPO, setShowNewPO] = useState(false)
  const columns = buildPOColumns()

  const openCount = pos.filter((p) => ['Sent', 'Partially Received'].includes(p.status)).length
  const totalValue = pos.reduce((sum, p) => sum + (p.total_value ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <StatCard
            label="Open POs"
            value={openCount}
            icon={<ShoppingCart size={16} className="text-blue-500" />}
            colour="bg-blue-50"
          />
          <StatCard
            label="Total PO Value"
            value={`‚¹${formatINR(totalValue)}`}
            icon={<Package size={16} className="text-green-600" />}
            colour="bg-green-50"
          />
        </div>
        <div className="ml-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowNewPO(true)}>+ New PO</Button>
          <Button variant="secondary" size="sm" onClick={handleRefresh} icon={<RefreshCw size={13} />} />
        </div>
      </div>

      {isDemo && <DemoBanner />}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PO detail panel */}
      {selectedPO && (
        <PODetailPanel
          po={selectedPO}
          onReceive={() => setReceiveModal(true)}
          onClose={() => setSelectedPO(null)}
        />
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading purchase orders...
        </div>
      ) : (
        <Table<PORow>
          data={pos as PORow[]}
          columns={columns}
          onRowClick={(row) => setSelectedPO(row as unknown as PurchaseOrder)}
          rowKey={(r) => r.id as string}
          exportable
          exportFilename="purchase-orders"
          emptyMessage="No purchase orders found."
        />
      )}

      {/* Receive goods modal */}
      <ReceiveGoodsModal
        open={receiveModal}
        po={selectedPO}
        onClose={() => setReceiveModal(false)}
        onReceived={() => {
          setReceiveModal(false)
          setSelectedPO(null)
          handleRefresh()
        }}
      />

      {/* New PO modal */}
      <NewPOModal
        open={showNewPO}
        onClose={() => setShowNewPO(false)}
        onCreated={handleRefresh}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// GRN Tab
// ---------------------------------------------------------------------------
function buildGRNColumns(): Column<GRNRow>[] {
  return [
    {
      key: 'grn_number',
      header: 'GRN Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700">{row.grn_number as string}</span>
      ),
    },
    {
      key: 'po_id',
      header: 'PO Reference',
      render: (row) => (
        <span className="font-mono text-xs text-gray-700">{row.po_id as string}</span>
      ),
    },
    {
      key: 'receipt_date',
      header: 'Receipt Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-700">{formatDate(row.receipt_date as string)}</span>
      ),
    },
    {
      key: 'inspection_status',
      header: 'Inspection',
      render: (row) => {
        const s = row.inspection_status as string
        const variant =
          s === 'Accepted' ? 'success' : s === 'Rejected' ? 'danger' : s === 'Conditional' ? 'warning' : 'default'
        return (
          <Badge variant={variant} size="sm">
            {s}
          </Badge>
        )
      },
    },
    {
      key: 'heat_cert_number',
      header: 'Heat Cert',
      render: (row) => (
        <span className="text-xs text-gray-600 font-mono">
          {(row.heat_cert_number as string) ?? '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-400">{formatDate(row.created_at as string)}</span>
      ),
    },
  ]
}

interface GRNTabProps {
  grns: GRNRow[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function GRNTab({ grns, loading, error, onRefresh }: GRNTabProps) {
  const columns = buildGRNColumns()
  const acceptedCount = grns.filter((g) => g.inspection_status === 'Accepted').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <StatCard
            label="Total GRNs"
            value={grns.length}
            icon={<Truck size={16} className="text-green-600" />}
            colour="bg-green-50"
          />
          <StatCard
            label="Accepted"
            value={acceptedCount}
            icon={<CheckCircle size={16} className="text-green-600" />}
            colour="bg-green-50"
          />
        </div>
        <div className="ml-4">
          <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading GRNs...
        </div>
      ) : (
        <Table<GRNRow>
          data={grns}
          columns={columns}
          rowKey={(r) => r.id as string}
          exportable
          exportFilename="grns"
          emptyMessage="No GRNs found."
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function PurchasePage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [grns, setGRNs] = useState<GRNRow[]>([])
  const [loadingGRNs, setLoadingGRNs] = useState(false)
  const [errorGRNs, setErrorGRNs] = useState<string | null>(null)

  // Derive active tab from current URL path
  const getTabFromPath = (path: string): TabKey => {
    if (path.includes('/orders')) return 'pos'
    if (path.includes('/grns')) return 'grns'
    return 'prs' // default: /purchase/requisitions or /purchase
  }

  const activeTab = getTabFromPath(location.pathname)

  const handleTabChange = (tab: TabKey) => {
    const paths: Record<TabKey, string> = {
      prs: '/purchase/requisitions',
      pos: '/purchase/orders',
      grns: '/purchase/grns',
    }
    navigate(paths[tab])
  }

  const fetchGRNs = () => {
    setLoadingGRNs(true)
    setErrorGRNs(null)
    listGRNs()
      .then((data) => setGRNs(data as GRNRow[]))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setErrorGRNs(e?.response?.data?.detail ?? e?.message ?? 'Failed to load GRNs')
      })
      .finally(() => setLoadingGRNs(false))
  }

  // Load GRNs lazily when their tab is active
  useEffect(() => {
    if (activeTab === 'grns' && grns.length === 0) fetchGRNs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Redirect /purchase to /purchase/requisitions
  if (location.pathname === '/purchase' || location.pathname === '/purchase/') {
    navigate('/purchase/requisitions', { replace: true })
    return null
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 17 "" Requisitions, Purchase Orders, Goods Receipt Notes
        </p>
      </div>

      <TabBar
        active={activeTab}
        onChange={handleTabChange}
        prCount={0}
        poCount={0}
        grnCount={grns.length}
      />

      {activeTab === 'prs' && <PRTab />}
      {activeTab === 'pos' && <POTab />}
      {activeTab === 'grns' && (
        <GRNTab grns={grns} loading={loadingGRNs} error={errorGRNs} onRefresh={fetchGRNs} />
      )}
    </div>
  )
}
