/**
 * CAPAListPage - Module 30: Corrective & Preventive Action list view.
 *
 * Features:
 * - Table: capa_number, title, root_cause_method (badge), status (StateMachineBadge),
 *          target_date (overdue in red if past target and not Closed), created_at
 * - "New CAPA" button opens modal with ncr_id, title, root_cause_method, target_date
 * - Status filter dropdown
 * - Row click †' /quality/capas/:id
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import {
  Table,
  Column,
  Badge,
  StateMachineBadge,
  Button,
  Select,
  Modal,
  Input,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import { formatDate } from '../../lib/utils'
import { listCAPAs, createCAPA, CAPA } from '../../api/qualityApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_CAPAS } from '../../lib/demoData'

type CAPARow = CAPA & Record<string, unknown>

// ---------------------------------------------------------------------------
// RCA method badge colours
// ---------------------------------------------------------------------------
const RCA_VARIANT: Record<string, 'warning' | 'info' | 'default'> = {
  '5-Why': 'warning',
  Ishikawa: 'info',
  FTA: 'default',
}

const RCA_METHODS = ['5-Why', 'Ishikawa', 'FTA']

// ---------------------------------------------------------------------------
// Helper: check if target_date is overdue
// ---------------------------------------------------------------------------
function isOverdue(targetDate: string | null, status: string): boolean {
  if (!targetDate || status === 'Closed') return false
  return new Date(targetDate) < new Date()
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: Column<CAPARow>[] = [
  {
    key: 'capa_number',
    header: 'CAPA Number',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-amber-700">
        {row.capa_number as string}
      </span>
    ),
  },
  {
    key: 'title',
    header: 'Title',
    render: (row) => (
      <span className="text-sm text-gray-800 line-clamp-1">{row.title as string}</span>
    ),
  },
  {
    key: 'root_cause_method',
    header: 'RCA Method',
    render: (row) => {
      const method = row.root_cause_method as string | null
      if (!method) return <span className="text-sm text-gray-400">""</span>
      return (
        <Badge variant={RCA_VARIANT[method] ?? 'default'} size="sm">
          {method}
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
    key: 'target_date',
    header: 'Target Date',
    sortable: true,
    render: (row) => {
      const targetDate = row.target_date as string | null
      const status = row.status as string
      const overdue = isOverdue(targetDate, status)
      if (!targetDate) return <span className="text-sm text-gray-400">""</span>
      return (
        <div className="flex items-center gap-2">
          <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
            {formatDate(targetDate)}
          </span>
          {overdue && (
            <Badge variant="danger" size="sm">
              <AlertCircle size={10} className="mr-0.5 inline" />
              Overdue
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    render: (row) => (
      <span className="text-sm text-gray-500">{formatDate(row.created_at as string)}</span>
    ),
  },
]

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Open', value: 'Open' },
  { label: 'Root Cause Analysis', value: 'Root Cause Analysis' },
  { label: 'Action In Progress', value: 'Action In Progress' },
  { label: 'Verification', value: 'Verification' },
  { label: 'Closed', value: 'Closed' },
]

// ---------------------------------------------------------------------------
// New CAPA Modal
// ---------------------------------------------------------------------------
interface NewCAPAModalProps {
  onCreated: () => void
  onClose: () => void
}

function NewCAPAModal({ onCreated, onClose }: NewCAPAModalProps) {
  const [ncrId, setNcrId] = useState('')
  const [title, setTitle] = useState('')
  const [rcaMethod, setRcaMethod] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!ncrId.trim()) {
      setError('NCR ID is required')
      return
    }
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createCAPA({
        ncr_id: ncrId.trim() || null,
        title: title.trim(),
        root_cause_method: rcaMethod || null,
        target_date: targetDate || null,
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create CAPA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        label="NCR ID"
        placeholder="UUID of the linked NCR"
        value={ncrId}
        onChange={(e) => setNcrId(e.target.value)}
        required
      />

      <Input
        label="Title"
        placeholder="Brief description of the CAPA"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Root Cause Method
        </label>
        <Select
          options={[
            { label: '"" select ""', value: '' },
            ...RCA_METHODS.map((m) => ({ label: m, value: m })),
          ]}
          value={rcaMethod}
          onChange={(e) => setRcaMethod(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Date
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
          Create CAPA
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CAPAListPage() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  const { data: capas, isDemo, loading, error, refetch } = useDemoFallback<CAPARow>(
    () => listCAPAs({ status: statusFilter || undefined, limit: 200 }) as Promise<CAPARow[]>,
    DEMO_CAPAS as unknown as CAPARow[],
    [statusFilter],
  )

  const fetchCAPAs = (_status?: string) => refetch()

  const handleRowClick = (row: CAPARow) => {
    navigate(`/quality/capas/${row.id as string}`)
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CAPA Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 30 - Corrective &amp; Preventive Actions, AS9100D 10.2
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            icon={<RefreshCw size={14} />}
            title="Refresh"
          />
          <Button
            variant="primary"
            onClick={() => setShowNewModal(true)}
            icon={<Plus size={16} />}
          >
            New CAPA
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-52">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Demo banner */}
      {isDemo && <DemoBanner />}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading CAPAs...
        </div>
      ) : (
        <Table<CAPARow>
          data={capas}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="capas"
          emptyMessage="No CAPAs found - click 'New CAPA' to create one."
        />
      )}

      {/* New CAPA Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New CAPA"
        size="md"
      >
        <NewCAPAModal
          onCreated={() => fetchCAPAs(statusFilter || undefined)}
          onClose={() => setShowNewModal(false)}
        />
      </Modal>
    </div>
  )
}
