/**
 * DispatchPage - Module 23: Dispatch (tabbed)
 *
 * Tabs:
 * - Delivery Challans: table + New Challan modal + inline detail panel
 * - Ready to Dispatch: stub
 */

import { useEffect, useState } from 'react'
import { Package, RefreshCw, Truck } from 'lucide-react'
import {
  Badge,
  Button,
  Input,
  Modal,
  StateMachineBadge,
  Table,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import type { Column } from '../../components/ui'
import { formatDate, formatINR } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_CHALLANS } from '../../lib/demoData'
import {
  createChallan,
  listChallans,
  type DeliveryChallan,
} from '../../api/dispatchApi'

type DCRow = DeliveryChallan & Record<string, unknown>

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------
type TabKey = 'challans' | 'ready'

interface TabBarProps {
  active: TabKey
  onChange: (t: TabKey) => void
}

function TabBar({ active, onChange }: TabBarProps) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'challans', label: 'Delivery Challans' },
    { key: 'ready', label: 'Ready to Dispatch' },
  ]

  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors mr-1 ${
            active === t.key
              ? 'border-blue-500 text-blue-700'
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
// New Challan Modal
// ---------------------------------------------------------------------------
interface NewChallanModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function NewChallanModal({ open, onClose, onCreated }: NewChallanModalProps) {
  const [form, setForm] = useState({
    so_id: '',
    customer_id: '',
    dispatch_date: '',
    transporter: '',
    lr_number: '',
    state_from: '',
    state_to: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        so_id: '',
        customer_id: '',
        dispatch_date: new Date().toISOString().split('T')[0],
        transporter: '',
        lr_number: '',
        state_from: '',
        state_to: '',
      })
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    if (!form.customer_id || !form.dispatch_date) {
      setError('Customer ID and Dispatch Date are required.')
      return
    }
    setSaving(true)
    setError(null)
    createChallan({
      so_id: form.so_id || undefined,
      customer_id: form.customer_id,
      dispatch_date: form.dispatch_date,
      transporter: form.transporter || undefined,
      lr_number: form.lr_number || undefined,
      state_from: form.state_from || undefined,
      state_to: form.state_to || undefined,
    })
      .then(() => {
        onCreated()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create challan')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Delivery Challan"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Create Challan
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
            label="Sales Order ID (optional)"
            value={form.so_id}
            onChange={(e) => setForm((f) => ({ ...f, so_id: e.target.value }))}
            placeholder="SO-XXXX"
          />
          <Input
            label="Customer ID"
            value={form.customer_id}
            onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
            placeholder="CUST-XXXX"
            required
          />
        </div>
        <Input
          label="Dispatch Date"
          type="date"
          value={form.dispatch_date}
          onChange={(e) => setForm((f) => ({ ...f, dispatch_date: e.target.value }))}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Transporter"
            value={form.transporter}
            onChange={(e) => setForm((f) => ({ ...f, transporter: e.target.value }))}
            placeholder="e.g. DTDC"
          />
          <Input
            label="LR Number"
            value={form.lr_number}
            onChange={(e) => setForm((f) => ({ ...f, lr_number: e.target.value }))}
            placeholder="Lorry Receipt No."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="State (From)"
            value={form.state_from}
            onChange={(e) => setForm((f) => ({ ...f, state_from: e.target.value }))}
            placeholder="e.g. Maharashtra"
          />
          <Input
            label="State (To)"
            value={form.state_to}
            onChange={(e) => setForm((f) => ({ ...f, state_to: e.target.value }))}
            placeholder="e.g. Karnataka"
          />
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// DC Detail Panel
// ---------------------------------------------------------------------------
function DCDetailPanel({
  dc,
  onClose,
}: {
  dc: DeliveryChallan
  onClose: () => void
}) {
  const gstTotal = dc.cgst_amount + dc.sgst_amount + dc.igst_amount

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 font-mono">{dc.dc_number}</h3>
          <p className="text-xs text-gray-500">
            Customer: {dc.customer_id}
            {dc.so_id ? ` | SO: ${dc.so_id}` : ''}
            {' | '}Dispatch: {formatDate(dc.dispatch_date)}
          </p>
          {(dc.transporter || dc.lr_number) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {dc.transporter && `Transporter: ${dc.transporter}`}
              {dc.transporter && dc.lr_number && ' | '}
              {dc.lr_number && `LR: ${dc.lr_number}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StateMachineBadge state={dc.status} size="sm" />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Line items */}
      {dc.line_items && dc.line_items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Item Code', 'Description', 'HSN', 'Qty', 'Unit Price', 'Amount'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dc.line_items.map((li) => (
                <tr key={li.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-gray-800">{li.item_code ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{li.description ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-600">{li.hsn_code ?? '-'}</td>
                  <td className="px-3 py-2 font-mono">{li.quantity ?? 0}</td>
                  <td className="px-3 py-2 font-mono">‚¹{formatINR(li.unit_price ?? 0)}</td>
                  <td className="px-3 py-2 font-mono">
                    ‚¹{formatINR((li.quantity ?? 0) * (li.unit_price ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GST breakdown */}
      <div className="border-t border-gray-200 pt-4 flex justify-end">
        <dl className="space-y-1 text-sm w-64">
          <div className="flex justify-between">
            <dt className="text-gray-500">Taxable Value</dt>
            <dd className="font-mono text-gray-800">‚¹{formatINR(dc.taxable_value)}</dd>
          </div>
          {dc.cgst_amount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">CGST</dt>
              <dd className="font-mono text-gray-800">‚¹{formatINR(dc.cgst_amount)}</dd>
            </div>
          )}
          {dc.sgst_amount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">SGST</dt>
              <dd className="font-mono text-gray-800">‚¹{formatINR(dc.sgst_amount)}</dd>
            </div>
          )}
          {dc.igst_amount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">IGST</dt>
              <dd className="font-mono text-gray-800">‚¹{formatINR(dc.igst_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
            <dt className="text-gray-800">Grand Total</dt>
            <dd className="font-mono text-gray-900">
              ‚¹{formatINR(dc.taxable_value + gstTotal)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Challans tab columns
// ---------------------------------------------------------------------------
function buildDCColumns(): Column<DCRow>[] {
  return [
    {
      key: 'dc_number',
      header: 'DC Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-blue-700">
          {row.dc_number as string}
        </span>
      ),
    },
    {
      key: 'dispatch_date',
      header: 'Dispatch Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-700">{formatDate(row.dispatch_date as string)}</span>
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
      key: 'total_value',
      header: 'Total Value',
      render: (row) => (
        <span className="text-sm font-mono text-gray-700">
          ‚¹{formatINR((row.total_value as number) ?? 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: 'line_items',
      header: 'Items',
      render: (row) => {
        const items = row.line_items as DeliveryChallan['line_items']
        return (
          <Badge variant="default" size="sm">
            {items?.length ?? 0}
          </Badge>
        )
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Challans Tab
// ---------------------------------------------------------------------------
interface ChallansTabProps {
  challans: DCRow[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function ChallansTab({ challans, loading, error, onRefresh }: ChallansTabProps) {
  const [showNew, setShowNew] = useState(false)
  const [selectedDC, setSelectedDC] = useState<DeliveryChallan | null>(null)
  const columns = buildDCColumns()

  const totalValue = challans.reduce((sum, dc) => sum + ((dc.total_value as number) ?? 0), 0)
  const pendingCount = challans.filter((dc) =>
    ['Draft', 'Pending'].includes(dc.status as string)
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <StatCard
            label="Total Challans"
            value={challans.length}
            icon={<Truck size={16} className="text-blue-600" />}
            colour="bg-blue-50"
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={<Package size={16} className="text-amber-600" />}
            colour="bg-amber-50"
          />
          <StatCard
            label="Total Dispatch Value"
            value={`‚¹${formatINR(totalValue)}`}
            icon={<Truck size={16} className="text-green-600" />}
            colour="bg-green-50"
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            + New Challan
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {selectedDC && (
        <DCDetailPanel dc={selectedDC} onClose={() => setSelectedDC(null)} />
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading delivery challans...
        </div>
      ) : (
        <Table<DCRow>
          data={challans}
          columns={columns}
          onRowClick={(row) => setSelectedDC(row as unknown as DeliveryChallan)}
          rowKey={(r) => r.id as string}
          exportable
          exportFilename="delivery-challans"
          emptyMessage="No delivery challans found."
        />
      )}

      <NewChallanModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => {
          setShowNew(false)
          onRefresh()
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ready to Dispatch Tab (stub)
// ---------------------------------------------------------------------------
function ReadyToDispatchTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <Truck size={24} className="text-blue-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-2">No Batches Ready</h3>
      <p className="text-sm text-gray-400 max-w-sm mx-auto">
        Batches ready for dispatch will appear here after Final Inspection acceptance.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function DispatchPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('challans')

  const {
    data: challans,
    isDemo: challansIsDemo,
    loading: loadingChallans,
    error: errorChallans,
    refetch: fetchChallans,
  } = useDemoFallback(() => listChallans({ limit: 200 }), DEMO_CHALLANS, [])

  useEffect(() => {
    // useDemoFallback fetches on mount; nothing extra needed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dispatch</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 23 "" Delivery Challans, GST computation, e-way bill
        </p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'challans' && (
        <>
          {challansIsDemo && <DemoBanner />}
          <ChallansTab
            challans={challans as DCRow[]}
            loading={loadingChallans}
            error={errorChallans}
            onRefresh={fetchChallans}
          />
        </>
      )}
      {activeTab === 'ready' && <ReadyToDispatchTab />}
    </div>
  )
}
