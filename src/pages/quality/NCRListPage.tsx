/**
 * NCRListPage - Module 21: Non-Conformance Report list view.
 *
 * Features:
 * - Table: ncr_number, part_number, detection_stage (badge), status (StateMachineBadge), age_days, overdue
 * - "New NCR" button opens a modal form
 * - Status filter dropdown
 * - Row click †' /quality/ncrs/:id
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
import { formatDate } from '../../lib/utils'
import { listNCRs, createNCR, NCR } from '../../api/qualityApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_NCRS } from '../../lib/demoData'
import { DemoBanner } from '../../components/ui/DemoBanner'

type NCRRow = NCR & Record<string, unknown>

// ---------------------------------------------------------------------------
// Detection stage badge colours
// ---------------------------------------------------------------------------
const STAGE_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  Incoming: 'info',
  'In-Process': 'warning',
  'Final Inspection': 'warning',
  Customer: 'danger',
  Supplier: 'default',
}

const DETECTION_STAGES = [
  'Incoming',
  'In-Process',
  'Final Inspection',
  'Customer',
  'Supplier',
]

// ---------------------------------------------------------------------------
// Helper: compute age in days from created_at
// ---------------------------------------------------------------------------
function ageDays(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: Column<NCRRow>[] = [
  {
    key: 'ncr_number',
    header: 'NCR Number',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-red-700">
        {row.ncr_number as string}
      </span>
    ),
  },
  {
    key: 'part_number',
    header: 'Part Number',
    render: (row) => (
      <span className="text-sm text-gray-800">
        {(row.part_number as string | null) ?? <span className="text-gray-400">""</span>}
      </span>
    ),
  },
  {
    key: 'detection_stage',
    header: 'Detection Stage',
    render: (row) => (
      <Badge
        variant={STAGE_VARIANT[row.detection_stage as string] ?? 'default'}
        size="sm"
      >
        {row.detection_stage as string}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
  },
  {
    key: 'created_at',
    header: 'Age',
    sortable: true,
    render: (row) => {
      const age = ageDays(row.created_at as string)
      const isOpen = row.status === 'Open'
      const overdue = isOpen && age > 5
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{age}d</span>
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
    key: 'closed_at',
    header: 'Closed',
    render: (row) => (
      <span className="text-sm text-gray-500">
        {row.closed_at ? formatDate(row.closed_at as string) : '""'}
      </span>
    ),
  },
]

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Open', value: 'Open' },
  { label: 'Awaiting Approval', value: 'Awaiting Approval' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Closed', value: 'Closed' },
]

// ---------------------------------------------------------------------------
// New NCR Modal
// ---------------------------------------------------------------------------
interface NewNCRModalProps {
  onCreated: () => void
  onClose: () => void
}

function NewNCRModal({ onCreated, onClose }: NewNCRModalProps) {
  const [partNumber, setPartNumber] = useState('')
  const [drawingNumber, setDrawingNumber] = useState('')
  const [detectionStage, setDetectionStage] = useState('In-Process')
  const [description, setDescription] = useState('')
  const [disposition, setDisposition] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createNCR({
        part_number: partNumber || null,
        drawing_number: drawingNumber || null,
        detection_stage: detectionStage,
        description: description.trim(),
        disposition: disposition || null,
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create NCR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Part Number"
          placeholder="e.g. KSI-123456"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
        />
        <Input
          label="Drawing Number"
          placeholder="e.g. DWG-001"
          value={drawingNumber}
          onChange={(e) => setDrawingNumber(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Detection Stage <span className="text-red-500">*</span>
        </label>
        <Select
          options={DETECTION_STAGES.map((s) => ({ label: s, value: s }))}
          value={detectionStage}
          onChange={(e) => setDetectionStage(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the non-conformance..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Disposition
        </label>
        <Select
          options={[
            { label: '"" select ""', value: '' },
            { label: 'Use As Is', value: 'Use As Is' },
            { label: 'Rework', value: 'Rework' },
            { label: 'Scrap', value: 'Scrap' },
            { label: 'Return to Supplier', value: 'Return to Supplier' },
            { label: 'Concession', value: 'Concession' },
          ]}
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
          Create NCR
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NCRListPage() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  const { data: ncrs, isDemo, loading, error, refetch } = useDemoFallback(
    () => listNCRs({ status: statusFilter || undefined, limit: 200 }),
    DEMO_NCRS,
    [statusFilter]
  )

  const handleRowClick = (row: NCRRow) => {
    navigate(`/quality/ncrs/${row.id as string}`)
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Non-Conformance Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 21 - NCR lifecycle, AS9100D 8.7
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={refetch}
            icon={<RefreshCw size={14} />}
            title="Refresh"
          />
          <Button
            variant="primary"
            onClick={() => setShowNewModal(true)}
            icon={<Plus size={16} />}
          >
            New NCR
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
          Loading NCRs...
        </div>
      ) : (
        <Table<NCRRow>
          data={ncrs as NCRRow[]}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="ncrs"
          emptyMessage="No NCRs found - click 'New NCR' to create one."
        />
      )}

      {/* New NCR Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New NCR"
        size="md"
      >
        <NewNCRModal
          onCreated={refetch}
          onClose={() => setShowNewModal(false)}
        />
      </Modal>
    </div>
  )
}
