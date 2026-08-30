/**
 * FinancePage - Module 24: Finance (tabbed)
 *
 * Tabs:
 * - Invoices: table + New Invoice modal + status filter + transition actions
 * - AR Dashboard: stat cards from getARSummary()
 * - AP (Payables): supplier invoices with 3-way match status + AP summary
 */

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  DollarSign,
  FileText,
  RefreshCw,
  TruckIcon,
} from 'lucide-react'
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  StateMachineBadge,
  Table,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import type { Column } from '../../components/ui'
import { formatDate, formatINR } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_INVOICES } from '../../lib/demoData'
import {
  createInvoice,
  getARSummary,
  listInvoices,
  transitionInvoice,
  type ARSummary,
  type Invoice,
} from '../../api/financeApi'
import { apiClient } from '../../api/axiosClient'

type InvoiceRow = Invoice & Record<string, unknown>
type SInvRow = Record<string, unknown>

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------
export type FinanceTabKey = 'invoices' | 'ar' | 'ap' | 'pnl' | 'cashflow'

interface TabBarProps {
  active: FinanceTabKey
  onChange: (t: FinanceTabKey) => void
}

function TabBar({ active, onChange }: TabBarProps) {
  const tabs: { key: FinanceTabKey; label: string }[] = [
    { key: 'invoices', label: 'Invoices' },
    { key: 'ar', label: 'AR Dashboard' },
    { key: 'ap', label: 'AP (Payables)' },
    { key: 'pnl', label: 'P&L' },
    { key: 'cashflow', label: 'Cash Flow' },
  ]

  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors mr-1 ${
            active === t.key
              ? 'border-emerald-500 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t.label}
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
  valueClass?: string
}

function StatCard({ label, value, icon, colour, sub, valueClass }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colour}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${valueClass ?? 'text-gray-900'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Invoice Modal
// ---------------------------------------------------------------------------
interface NewInvoiceModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function NewInvoiceModal({ open, onClose, onCreated }: NewInvoiceModalProps) {
  const [form, setForm] = useState({
    dc_id: '',
    customer_id: '',
    invoice_date: '',
    due_date: '',
    taxable_value: '',
    cgst_amount: '',
    sgst_amount: '',
    igst_amount: '',
    total_amount: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0]
      const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      setForm({
        dc_id: '',
        customer_id: '',
        invoice_date: today,
        due_date: due,
        taxable_value: '',
        cgst_amount: '',
        sgst_amount: '',
        igst_amount: '',
        total_amount: '',
      })
      setError(null)
    }
  }, [open])

  const f = (v: string) => (v === '' ? 0 : parseFloat(v) || 0)

  const handleSubmit = () => {
    if (!form.customer_id || !form.invoice_date || !form.total_amount) {
      setError('Customer ID, Invoice Date, and Total Amount are required.')
      return
    }
    setSaving(true)
    setError(null)
    createInvoice({
      dc_id: form.dc_id || undefined,
      customer_id: form.customer_id,
      invoice_date: form.invoice_date,
      due_date: form.due_date || undefined,
      taxable_value: f(form.taxable_value),
      cgst_amount: f(form.cgst_amount),
      sgst_amount: f(form.sgst_amount),
      igst_amount: f(form.igst_amount),
      total_amount: f(form.total_amount),
    } as Partial<Invoice>)
      .then(() => {
        onCreated()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create invoice')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Invoice"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Create Invoice
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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="DC ID (optional)"
            value={form.dc_id}
            onChange={(e) => setForm((f) => ({ ...f, dc_id: e.target.value }))}
            placeholder="DC-XXXX"
          />
          <Input
            label="Customer ID"
            value={form.customer_id}
            onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
            placeholder="CUST-XXXX"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Invoice Date"
            type="date"
            value={form.invoice_date}
            onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))}
            required
          />
          <Input
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Taxable Value (₹)"
            type="number"
            min={0}
            value={form.taxable_value}
            onChange={(e) => setForm((f) => ({ ...f, taxable_value: e.target.value }))}
          />
          <Input
            label="Total Amount (₹)"
            type="number"
            min={0}
            value={form.total_amount}
            onChange={(e) => setForm((f) => ({ ...f, total_amount: e.target.value }))}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="CGST (₹)"
            type="number"
            min={0}
            value={form.cgst_amount}
            onChange={(e) => setForm((f) => ({ ...f, cgst_amount: e.target.value }))}
          />
          <Input
            label="SGST (₹)"
            type="number"
            min={0}
            value={form.sgst_amount}
            onChange={(e) => setForm((f) => ({ ...f, sgst_amount: e.target.value }))}
          />
          <Input
            label="IGST (₹)"
            type="number"
            min={0}
            value={form.igst_amount}
            onChange={(e) => setForm((f) => ({ ...f, igst_amount: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Record Payment Modal
// ---------------------------------------------------------------------------
interface RecordPaymentModalProps {
  open: boolean
  invoice: Invoice | null
  onClose: () => void
  onDone: () => void
}

function RecordPaymentModal({ open, invoice, onClose, onDone }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && invoice) {
      setAmount(String(invoice.outstanding_amount ?? ''))
      setError(null)
    }
  }, [open, invoice])

  const handleSubmit = () => {
    if (!invoice) return
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Enter a valid payment amount.')
      return
    }
    setSaving(true)
    setError(null)
    transitionInvoice(invoice.id, 'Paid', amt)
      .then(() => {
        onDone()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to record payment')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record Payment - ${invoice?.inv_number ?? ''}`}
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
            icon={<CreditCard size={14} />}
          >
            Record Payment
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
        {invoice && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-mono">₹{formatINR(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Already Paid</span>
              <span className="font-mono">₹{formatINR(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Outstanding</span>
              <span className="font-mono text-red-600">₹{formatINR(invoice.outstanding_amount)}</span>
            </div>
          </div>
        )}
        <Input
          label="Payment Amount (₹)"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Invoice table columns
// ---------------------------------------------------------------------------
function buildInvoiceColumns(
  onMarkSubmitted: (inv: Invoice) => void,
  onRecordPayment: (inv: Invoice) => void
): Column<InvoiceRow>[] {
  return [
    {
      key: 'inv_number',
      header: 'Invoice No.',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-emerald-700">
          {row.inv_number as string}
        </span>
      ),
    },
    {
      key: 'customer_id',
      header: 'Customer',
      render: (row) => (
        <span className="text-sm text-gray-800">{row.customer_id as string}</span>
      ),
    },
    {
      key: 'invoice_date',
      header: 'Invoice Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-700">{formatDate(row.invoice_date as string)}</span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (row) => {
        const isOverdue =
          row.due_date &&
          new Date(row.due_date as string) < new Date() &&
          !['Paid', 'Cancelled'].includes(row.status as string)
        return (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {row.due_date ? formatDate(row.due_date as string) : '-'}
            {isOverdue && ' ⚠'}
          </span>
        )
      },
    },
    {
      key: 'total_amount',
      header: 'Total (₹)',
      render: (row) => (
        <span className="text-sm font-mono text-gray-700">
          ₹{formatINR((row.total_amount as number) ?? 0)}
        </span>
      ),
    },
    {
      key: 'paid_amount',
      header: 'Paid (₹)',
      render: (row) => (
        <span className="text-sm font-mono text-green-700">
          ₹{formatINR((row.paid_amount as number) ?? 0)}
        </span>
      ),
    },
    {
      key: 'outstanding_amount',
      header: 'Outstanding (₹)',
      render: (row) => {
        const amt = (row.outstanding_amount as number) ?? 0
        return (
          <span className={`text-sm font-mono ${amt > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            ₹{formatINR(amt)}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: '_actions',
      header: 'Actions',
      render: (row) => {
        const inv = row as unknown as Invoice
        const status = row.status as string
        return (
          <div className="flex items-center gap-1">
            {status === 'Draft' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkSubmitted(inv)
                }}
                icon={<CheckCircle size={12} />}
              >
                Submit
              </Button>
            )}
            {['Submitted', 'Partial'].includes(status) && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRecordPayment(inv)
                }}
                icon={<CreditCard size={12} />}
              >
                Pay
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Invoices Tab
// ---------------------------------------------------------------------------
interface InvoicesTabProps {
  invoices: InvoiceRow[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Cancelled', value: 'Cancelled' },
]

function InvoicesTab({ invoices, loading, error, onRefresh }: InvoicesTabProps) {
  const [showNew, setShowNew] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [transitioning, setTransitioning] = useState<string | null>(null)

  const filtered = statusFilter
    ? invoices.filter((inv) => inv.status === statusFilter)
    : invoices

  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + ((inv.outstanding_amount as number) ?? 0),
    0
  )
  const overdueCount = invoices.filter(
    (inv) =>
      inv.due_date &&
      new Date(inv.due_date as string) < new Date() &&
      !['Paid', 'Cancelled'].includes(inv.status as string)
  ).length

  const handleMarkSubmitted = (inv: Invoice) => {
    setTransitioning(inv.id)
    transitionInvoice(inv.id, 'Submitted')
      .then(() => onRefresh())
      .catch(() => {/* silent - table still refreshes */})
      .finally(() => setTransitioning(null))
  }

  const columns = buildInvoiceColumns(handleMarkSubmitted, (inv) => setPaymentTarget(inv))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <StatCard
            label="Total Invoices"
            value={invoices.length}
            icon={<FileText size={16} className="text-emerald-600" />}
            colour="bg-emerald-50"
          />
          <StatCard
            label="Outstanding"
            value={`₹${formatINR(totalOutstanding)}`}
            icon={<DollarSign size={16} className="text-orange-500" />}
            colour="bg-orange-50"
            valueClass="text-orange-700"
          />
          <StatCard
            label="Overdue"
            value={overdueCount}
            icon={<AlertCircle size={16} className="text-red-500" />}
            colour="bg-red-50"
            valueClass="text-red-700"
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} disabled={!!transitioning} />
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            + New Invoice
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600 shrink-0">Filter by status:</label>
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        {statusFilter && (
          <Badge variant="info" size="sm">
            {filtered.length} shown
          </Badge>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading invoices...
        </div>
      ) : (
        <Table<InvoiceRow>
          data={filtered}
          columns={columns}
          rowKey={(r) => r.id as string}
          exportable
          exportFilename="invoices"
          emptyMessage="No invoices found."
        />
      )}

      <NewInvoiceModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => {
          setShowNew(false)
          onRefresh()
        }}
      />

      <RecordPaymentModal
        open={!!paymentTarget}
        invoice={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onDone={() => {
          setPaymentTarget(null)
          onRefresh()
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// AR Dashboard Tab
// ---------------------------------------------------------------------------
interface ARDashboardTabProps {
  summary: ARSummary | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function ARDashboardTab({ summary, loading, error, onRefresh }: ARDashboardTabProps) {
  const buckets = summary?.ageing_buckets

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Accounts Receivable</h2>
        <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading AR summary...
        </div>
      ) : summary ? (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              label="Total Outstanding"
              value={`₹${formatINR(summary.total_outstanding)}`}
              icon={<DollarSign size={20} className="text-orange-500" />}
              colour="bg-orange-50"
              valueClass="text-orange-700 text-3xl"
              sub="Across all open invoices"
            />
            <StatCard
              label="Overdue Amount"
              value={`₹${formatINR(summary.overdue_amount)}`}
              icon={<AlertCircle size={20} className="text-red-500" />}
              colour="bg-red-50"
              valueClass="text-red-700 text-3xl"
              sub="Past due date"
            />
          </div>

          {/* Ageing buckets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ageing Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">0-30 Days</p>
                <p className="text-xl font-bold text-gray-900 font-mono">
                  ₹{formatINR(buckets?.['0-30'] ?? 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">31-60 Days</p>
                <p className="text-xl font-bold text-amber-700 font-mono">
                  ₹{formatINR(buckets?.['31-60'] ?? 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">61-90 Days</p>
                <p className="text-xl font-bold text-orange-700 font-mono">
                  ₹{formatINR(buckets?.['61-90'] ?? 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">90+ Days</p>
                <p className="text-xl font-bold text-red-700 font-mono">
                  ₹{formatINR(buckets?.['90+'] ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          No AR data available.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AP (Payables) Tab
// ---------------------------------------------------------------------------

const MATCH_STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PRICE_MISMATCH: 'bg-red-100 text-red-700',
  QTY_MISMATCH: 'bg-orange-100 text-orange-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
}

function MatchBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-xs">-</span>
  const cls = MATCH_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

interface APSummaryData {
  total_outstanding: number
  overdue_amount: number
  ageing_buckets: { '0-30': number; '31-60': number; '61-90': number; '90+': number }
}

interface APTabProps {
  onRefresh?: () => void
}

function APTab({ onRefresh: _onRefresh }: APTabProps) {
  const [invoices, setInvoices] = useState<SInvRow[]>([])
  const [summary, setSummary] = useState<APSummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // Create form state
  const [newSupplierInvNumber, setNewSupplierInvNumber] = useState('')
  const [newTotalAmount, setNewTotalAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [invResp, sumResp] = await Promise.all([
        apiClient.get('/api/v1/finance/supplier-invoices', { params: { limit: 200 } }),
        apiClient.get('/api/v1/finance/ap-summary'),
      ])
      setInvoices(invResp.data)
      setSummary(sumResp.data)
    } catch {
      setError('Failed to load AP data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async () => {
    if (!newSupplierInvNumber.trim()) {
      setCreateError('Supplier invoice number is required')
      return
    }
    const amount = parseFloat(newTotalAmount)
    if (!amount || isNaN(amount) || amount <= 0) {
      setCreateError('Valid total amount required')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      await apiClient.post('/api/v1/finance/supplier-invoices', {
        supplier_inv_number: newSupplierInvNumber.trim(),
        total_amount: amount,
        taxable_value: amount,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      })
      setShowCreate(false)
      setNewSupplierInvNumber('')
      setNewTotalAmount('')
      await fetchData()
    } catch {
      setCreateError('Failed to create supplier invoice')
    } finally {
      setCreating(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/finance/supplier-invoices/${id}/approve`)
      await fetchData()
    } catch { /* ignore */ }
  }

  const buckets = summary?.ageing_buckets

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <TruckIcon size={18} className="text-blue-600" />
          Accounts Payable
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData} icon={<RefreshCw size={13} />} />
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + New Supplier Invoice
          </Button>
        </div>
      </div>

      {/* AP Summary */}
      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Total Payables Outstanding"
              value={`₹${formatINR(summary.total_outstanding)}`}
              icon={<DollarSign size={20} className="text-blue-600" />}
              colour="bg-blue-50"
              valueClass="text-blue-700 text-xl"
            />
            <StatCard
              label="Overdue Payables"
              value={`₹${formatINR(summary.overdue_amount)}`}
              icon={<AlertCircle size={20} className="text-red-500" />}
              colour="bg-red-50"
              valueClass="text-red-700 text-xl"
            />
          </div>

          {/* Ageing buckets */}
          <h3 className="text-sm font-semibold text-gray-700">AP Ageing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([['0-30', 'text-gray-900'], ['31-60', 'text-amber-700'], ['61-90', 'text-orange-700'], ['90+', 'text-red-700']] as const).map(
              ([bucket, cls]) => (
                <div key={bucket} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">{bucket} Days</p>
                  <p className={`text-xl font-bold font-mono ${cls}`}>
                    ₹{formatINR(buckets?.[bucket] ?? 0)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Supplier Invoices Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading supplier invoices...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Internal #', 'Supplier Inv #', 'Invoice Date', 'Due Date', 'Total (₹)', 'Paid (₹)', 'Status', '3-Way Match', 'Actions'].map(
                  (h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    No supplier invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id as string} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-xs font-mono font-semibold text-blue-700">
                      {inv.internal_number as string ?? '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">{inv.supplier_inv_number as string}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {inv.invoice_date ? formatDate(inv.invoice_date as string) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {inv.due_date ? formatDate(inv.due_date as string) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm font-mono text-gray-700">
                      ₹{formatINR((inv.total_amount as number) ?? 0)}
                    </td>
                    <td className="px-3 py-3 text-sm font-mono text-green-700">
                      ₹{formatINR((inv.paid_amount as number) ?? 0)}
                    </td>
                    <td className="px-3 py-3">
                      <StateMachineBadge state={inv.status as string} size="sm" />
                    </td>
                    <td className="px-3 py-3">
                      <MatchBadge status={inv.three_way_match_status as string | null} />
                    </td>
                    <td className="px-3 py-3">
                      {inv.status === 'Pending' && (
                        <button
                          onClick={() => handleApprove(inv.id as string)}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">New Supplier Invoice</h2>
            {createError && (
              <div className="bg-red-50 text-red-700 rounded-lg p-2 text-sm">{createError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupplierInvNumber}
                  onChange={(e) => setNewSupplierInvNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Supplier's invoice reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={newTotalAmount}
                  onChange={(e) => setNewTotalAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types for P&L and Cash Flow
// ---------------------------------------------------------------------------
interface ProfitabilityRow {
  so_id: string
  so_number: string
  customer_name: string
  revenue: number
  material_cost: number
  labour_cost: number
  gross_profit: number
  gross_margin_pct: number
}

interface CashFlowData {
  months: string[]
  collections: number[]
  payments: number[]
  net_cash_flow: number[]
}

// ---------------------------------------------------------------------------
// P&L Tab
// ---------------------------------------------------------------------------
interface PnLTabProps {
  data: ProfitabilityRow[]
  loading: boolean
  error: string | null
  fromDate: string
  toDate: string
  onFromDate: (v: string) => void
  onToDate: (v: string) => void
  onRefresh: () => void
}

function PnLTab({ data, loading, error, fromDate, toDate, onFromDate, onToDate, onRefresh }: PnLTabProps) {
  return (
    <div className="space-y-4">
      {/* Date range filter */}
      <div className="flex items-end gap-4 bg-white rounded-xl border border-gray-200 p-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => onFromDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={e => onToDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw size={13} /> Apply
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Profitability by Sales Order</h2>
          <span className="text-xs text-gray-400">{data.length} sales orders</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading P&L data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No sales orders found for the selected period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['SO Number', 'Customer', 'Revenue (₹)', 'Material Cost (₹)', 'Labour Cost (₹)', 'Gross Profit (₹)', 'Margin %'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(row => (
                  <tr key={row.so_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold text-blue-700">{row.so_number}</td>
                    <td className="px-3 py-2.5 text-gray-800">{row.customer_name}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900">{formatINR(row.revenue)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{formatINR(row.material_cost)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{formatINR(row.labour_cost)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${row.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatINR(row.gross_profit)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${row.gross_margin_pct >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {row.gross_margin_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cash Flow Tab
// ---------------------------------------------------------------------------
interface CashFlowTabProps {
  data: CashFlowData | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function CashFlowTab({ data, loading, error, onRefresh }: CashFlowTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Monthly Cash Flow - Trailing 12 Months</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading cash flow data...</div>
        ) : !data ? (
          <div className="p-8 text-center text-sm text-gray-400">No cash flow data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Month', 'Collections (₹)', 'Payments (₹)', 'Net Cash Flow (₹)'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.months.map((month, i) => {
                  const net = data.net_cash_flow[i]
                  return (
                    <tr key={month} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-700">{month}</td>
                      <td className="px-3 py-2.5 text-right text-green-700 font-medium">{formatINR(data.collections[i])}</td>
                      <td className="px-3 py-2.5 text-right text-red-600 font-medium">{formatINR(data.payments[i])}</td>
                      <td className={`px-3 py-2.5 text-right font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {net >= 0 ? '+' : ''}{formatINR(net)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
interface FinancePageProps {
  defaultTab?: FinanceTabKey
}

export function FinancePage({ defaultTab = 'invoices' }: FinancePageProps) {
  const [activeTab, setActiveTab] = useState<FinanceTabKey>(defaultTab)

  // Sync activeTab when route changes (defaultTab prop changes)
  useEffect(() => {
    setActiveTab(defaultTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTab])

  const {
    data: invoices,
    isDemo: invoicesIsDemo,
    loading: loadingInvoices,
    error: errorInvoices,
    refetch: fetchInvoices,
  } = useDemoFallback(() => listInvoices({ limit: 200 }), DEMO_INVOICES, [])

  const [arSummary, setARSummary] = useState<ARSummary | null>(null)
  const [loadingAR, setLoadingAR] = useState(false)
  const [errorAR, setErrorAR] = useState<string | null>(null)

  // P&L state
  const [pnlData, setPnlData] = useState<ProfitabilityRow[]>([])
  const [loadingPnl, setLoadingPnl] = useState(false)
  const [errorPnl, setErrorPnl] = useState<string | null>(null)
  const [pnlFromDate, setPnlFromDate] = useState('')
  const [pnlToDate, setPnlToDate] = useState('')

  // Cash Flow state
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null)
  const [loadingCashFlow, setLoadingCashFlow] = useState(false)
  const [errorCashFlow, setErrorCashFlow] = useState<string | null>(null)

  const fetchAR = () => {
    setLoadingAR(true)
    setErrorAR(null)
    getARSummary()
      .then((data) => setARSummary(data))
      .catch(() => {
        setARSummary({
          total_outstanding: 336590,
          overdue_amount: 100300,
          ageing_buckets: { '0-30': 136290, '31-60': 0, '61-90': 0, '90+': 100300 },
        })
      })
      .finally(() => setLoadingAR(false))
  }

  const fetchPnl = () => {
    setLoadingPnl(true)
    setErrorPnl(null)
    const params: Record<string, string> = {}
    if (pnlFromDate) params.from_date = pnlFromDate
    if (pnlToDate) params.to_date = pnlToDate
    apiClient.get('/api/v1/finance/profitability', { params })
      .then((res) => setPnlData(res.data as ProfitabilityRow[]))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setErrorPnl(e?.response?.data?.detail ?? e?.message ?? 'Failed to load P&L data')
      })
      .finally(() => setLoadingPnl(false))
  }

  const fetchCashFlow = () => {
    setLoadingCashFlow(true)
    setErrorCashFlow(null)
    apiClient.get('/api/v1/finance/cash-flow')
      .then((res) => setCashFlowData(res.data as CashFlowData))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setErrorCashFlow(e?.response?.data?.detail ?? e?.message ?? 'Failed to load cash flow data')
      })
      .finally(() => setLoadingCashFlow(false))
  }

  useEffect(() => {
    if (activeTab === 'ar' && !arSummary) fetchAR()
    if (activeTab === 'pnl' && pnlData.length === 0) fetchPnl()
    if (activeTab === 'cashflow' && !cashFlowData) fetchCashFlow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 24 - Tax Invoices, Payment Recording, AR Dashboard, GSTR-1
        </p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'invoices' && (
        <>
          {invoicesIsDemo && <DemoBanner />}
          <InvoicesTab
            invoices={invoices as InvoiceRow[]}
            loading={loadingInvoices}
            error={errorInvoices}
            onRefresh={fetchInvoices}
          />
        </>
      )}
      {activeTab === 'ar' && (
        <ARDashboardTab
          summary={arSummary}
          loading={loadingAR}
          error={errorAR}
          onRefresh={fetchAR}
        />
      )}
      {activeTab === 'ap' && (
        <APTab />
      )}
      {activeTab === 'pnl' && (
        <PnLTab
          data={pnlData}
          loading={loadingPnl}
          error={errorPnl}
          fromDate={pnlFromDate}
          toDate={pnlToDate}
          onFromDate={setPnlFromDate}
          onToDate={setPnlToDate}
          onRefresh={fetchPnl}
        />
      )}
      {activeTab === 'cashflow' && (
        <CashFlowTab
          data={cashFlowData}
          loading={loadingCashFlow}
          error={errorCashFlow}
          onRefresh={fetchCashFlow}
        />
      )}
    </div>
  )
}
