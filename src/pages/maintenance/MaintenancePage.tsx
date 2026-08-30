/**
 * MaintenancePage - Module 25: Maintenance (tabbed)
 *
 * Tabs:
 * - Dashboard: stat cards (PM Due in 7 days, Under Breakdown, Avg Availability %, Total Records),
 *              recent maintenance records table
 * - Records: full table with type/status filters, "New Record" modal
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarClock, RefreshCw, Wrench } from 'lucide-react'
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
import { formatDate } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_MAINTENANCE } from '../../lib/demoData'
import {
  createMaintenanceRecord,
  getMaintenanceDashboard,
  listMaintenanceRecords,
  type MaintenanceDashboard,
  type MaintenanceRecord,
} from '../../api/maintenanceApi'

type MRow = MaintenanceRecord & Record<string, unknown>

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------
type TabKey = 'dashboard' | 'records'

function TabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'records', label: 'Records' },
  ]
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors mr-1 ${
            active === t.key
              ? 'border-orange-500 text-orange-700'
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
  valueClass?: string
  sub?: string
}

function StatCard({ label, value, icon, colour, valueClass, sub }: StatCardProps) {
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
// New Maintenance Record Modal
// ---------------------------------------------------------------------------
interface NewRecordModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const MAINT_TYPE_OPTIONS = [
  { label: 'Planned', value: 'Planned' },
  { label: 'Breakdown', value: 'Breakdown' },
]

const STATUS_OPTIONS_MODAL = [
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
]

function NewRecordModal({ open, onClose, onCreated }: NewRecordModalProps) {
  const [form, setForm] = useState({
    maintenance_type: 'Planned',
    description: '',
    scheduled_date: '',
    next_due_date: '',
    status: 'Scheduled',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        maintenance_type: 'Planned',
        description: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        status: 'Scheduled',
      })
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    setSaving(true)
    setError(null)
    createMaintenanceRecord({
      maintenance_type: form.maintenance_type,
      description: form.description || null,
      scheduled_date: form.scheduled_date || null,
      next_due_date: form.next_due_date || null,
      status: form.status,
    })
      .then(() => {
        onCreated()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create record')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Maintenance Record"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Create Record
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Maintenance Type
            </label>
            <Select
              options={MAINT_TYPE_OPTIONS}
              value={form.maintenance_type}
              onChange={(e) => setForm((f) => ({ ...f, maintenance_type: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <Select
              options={STATUS_OPTIONS_MODAL}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the maintenance task..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Scheduled Date"
            type="date"
            value={form.scheduled_date}
            onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
          />
          <Input
            label="Next Due Date"
            type="date"
            value={form.next_due_date}
            onChange={(e) => setForm((f) => ({ ...f, next_due_date: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------
function buildColumns(): Column<MRow>[] {
  return [
    {
      key: 'maintenance_type',
      header: 'Type',
      render: (row) => (
        <Badge
          variant={row.maintenance_type === 'Breakdown' ? 'danger' : 'info'}
          size="sm"
        >
          {row.maintenance_type as string}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className="text-sm text-gray-700 max-w-xs truncate block">
          {(row.description as string) ?? '-'}
        </span>
      ),
    },
    {
      key: 'scheduled_date',
      header: 'Scheduled',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.scheduled_date as string)}
        </span>
      ),
    },
    {
      key: 'completed_date',
      header: 'Completed',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.completed_date as string)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: 'downtime_hours',
      header: 'Downtime (hrs)',
      render: (row) => (
        <span className="text-sm font-mono text-gray-700">
          {row.downtime_hours != null ? String(row.downtime_hours) : '-'}
        </span>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Dashboard Tab
// ---------------------------------------------------------------------------
interface DashboardTabProps {
  dashboard: MaintenanceDashboard | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function DashboardTab({ dashboard, loading, error, onRefresh }: DashboardTabProps) {
  const columns = buildColumns()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Maintenance Overview</h2>
        <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading dashboard...
        </div>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="PM Due in 7 Days"
              value={dashboard.pm_due_within_7_days ?? 0}
              icon={<CalendarClock size={16} className="text-orange-600" />}
              colour="bg-orange-50"
              valueClass={(dashboard.pm_due_within_7_days ?? 0) > 0 ? 'text-orange-700' : 'text-gray-900'}
            />
            <StatCard
              label="Under Breakdown"
              value={dashboard.machines_under_breakdown ?? 0}
              icon={<AlertTriangle size={16} className="text-red-600" />}
              colour="bg-red-50"
              valueClass={(dashboard.machines_under_breakdown ?? 0) > 0 ? 'text-red-700' : 'text-gray-900'}
            />
            <StatCard
              label="Avg Availability"
              value={`${(dashboard.avg_availability_pct ?? 0).toFixed(1)}%`}
              icon={<Wrench size={16} className="text-green-600" />}
              colour="bg-green-50"
              valueClass="text-green-700"
            />
            <StatCard
              label="Total Records"
              value={dashboard.total_records ?? 0}
              icon={<Wrench size={16} className="text-blue-600" />}
              colour="bg-blue-50"
            />
          </div>

          {(dashboard.recent_records ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Records</h3>
              <Table<MRow>
                data={(dashboard.recent_records ?? []) as MRow[]}
                columns={columns}
                rowKey={(r) => r.id as string}
                emptyMessage="No recent records."
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          No dashboard data available.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Records Tab
// ---------------------------------------------------------------------------
interface RecordsTabProps {
  records: MRow[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

const TYPE_FILTER_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Planned', value: 'Planned' },
  { label: 'Breakdown', value: 'Breakdown' },
]

const STATUS_FILTER_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
]

function RecordsTab({ records, loading, error, onRefresh }: RecordsTabProps) {
  const [showNew, setShowNew] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = records.filter((r) => {
    if (typeFilter && r.maintenance_type !== typeFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  const columns = buildColumns()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600 shrink-0">Type:</label>
          <div className="w-40">
            <Select
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <label className="text-xs font-medium text-gray-600 shrink-0">Status:</label>
          <div className="w-44">
            <Select
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          {(typeFilter || statusFilter) && (
            <Badge variant="info" size="sm">
              {filtered.length} shown
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            + New Record
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading maintenance records...
        </div>
      ) : (
        <Table<MRow>
          data={filtered}
          columns={columns}
          rowKey={(r) => r.id as string}
          exportable
          exportFilename="maintenance-records"
          emptyMessage="No maintenance records found."
        />
      )}

      <NewRecordModal
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
// Main page
// ---------------------------------------------------------------------------
export function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  const [dashboard, setDashboard] = useState<MaintenanceDashboard | null>(null)
  const [loadingDash, setLoadingDash] = useState(false)
  const [errorDash, setErrorDash] = useState<string | null>(null)

  const {
    data: records,
    isDemo: recordsIsDemo,
    loading: loadingRecs,
    error: errorRecs,
    refetch: fetchRecords,
  } = useDemoFallback(() => listMaintenanceRecords({ limit: 500 }), DEMO_MAINTENANCE, [])

  const fetchDashboard = () => {
    setLoadingDash(true)
    setErrorDash(null)
    getMaintenanceDashboard()
      .then((d) => setDashboard(d))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setErrorDash(e?.response?.data?.detail ?? e?.message ?? 'Failed to load dashboard')
      })
      .finally(() => setLoadingDash(false))
  }

  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboard) fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 25 "" Preventive &amp; Breakdown Maintenance, Machine Availability
        </p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'dashboard' && (
        <DashboardTab
          dashboard={dashboard}
          loading={loadingDash}
          error={errorDash}
          onRefresh={fetchDashboard}
        />
      )}
      {activeTab === 'records' && (
        <>
          {recordsIsDemo && <DemoBanner />}
          <RecordsTab
            records={records as MRow[]}
            loading={loadingRecs}
            error={errorRecs}
            onRefresh={fetchRecords}
          />
        </>
      )}
    </div>
  )
}
