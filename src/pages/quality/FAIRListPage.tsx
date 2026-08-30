/**
 * FAIRListPage - Module 22: First Article Inspection Report list view.
 *
 * Features:
 * - Table: fair_number, part_number, drawing_number, drawing_revision, status
 * - "New FAIR" button opens a modal form
 * - Status filter dropdown: All / Draft / Approved
 * - Loads from GET /api/v1/fai/
 * - Row click †' /quality/fairs/:id
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import axios from 'axios'
import {
  Table,
  Column,
  StateMachineBadge,
  Button,
  Select,
  Modal,
  Input,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import { useDemoFallback } from '../../lib/useDemoFallback'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FAIR {
  id: string
  fair_number: string
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  so_id: string | null
  status: string
  created_at: string
}

type FAIRRow = FAIR & Record<string, unknown>

const FAIR_BASE = '/api/v1/fai'

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: Column<FAIRRow>[] = [
  {
    key: 'fair_number',
    header: 'FAIR Number',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-blue-700">
        {row.fair_number as string}
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
    key: 'drawing_number',
    header: 'Drawing Number',
    render: (row) => (
      <span className="font-mono text-sm text-gray-700">
        {(row.drawing_number as string | null) ?? '""'}
      </span>
    ),
  },
  {
    key: 'drawing_revision',
    header: 'Revision',
    render: (row) => (
      <span className="text-sm text-gray-700">
        {(row.drawing_revision as string | null) ?? '""'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
  },
]

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Approved', value: 'Approved' },
]

// ---------------------------------------------------------------------------
// Inline demo data
// ---------------------------------------------------------------------------
const DEMO_FAIRS_INLINE: FAIRRow[] = [
  { id: 'demo-fair-001', fair_number: 'FAIR-2025-0001', part_number: 'HA-2024-PP-01', drawing_number: '23-70-00006-00', drawing_revision: 'B', so_id: null, status: 'Open', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'demo-fair-002', fair_number: 'FAIR-2025-0002', part_number: 'KA-2025-001', drawing_number: 'DWG-2025-042', drawing_revision: 'A', so_id: null, status: 'Completed', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// New FAIR Modal
// ---------------------------------------------------------------------------
interface NewFAIRModalProps {
  onCreated: () => void
  onClose: () => void
}

function NewFAIRModal({ onCreated, onClose }: NewFAIRModalProps) {
  const [soId, setSoId] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [drawingNumber, setDrawingNumber] = useState('')
  const [drawingRevision, setDrawingRevision] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await axios.post(FAIR_BASE + '/', {
        so_id: soId || null,
        part_number: partNumber || null,
        drawing_number: drawingNumber || null,
        drawing_revision: drawingRevision || null,
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create FAIR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        label="Sales Order ID"
        placeholder="e.g. SO-2024-001"
        value={soId}
        onChange={(e) => setSoId(e.target.value)}
      />
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
        <Input
          label="Drawing Revision"
          placeholder="e.g. A"
          value={drawingRevision}
          onChange={(e) => setDrawingRevision(e.target.value)}
          maxLength={10}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
          Create FAIR
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function FAIRListPage() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  const { data: fairs, isDemo, loading, error, refetch } = useDemoFallback<FAIRRow>(
    () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      return axios.get<FAIRRow[]>(FAIR_BASE + '/', { params }).then(({ data }) => data)
    },
    DEMO_FAIRS_INLINE,
    [statusFilter],
  )

  const handleRowClick = (row: FAIRRow) => {
    navigate(`/quality/fairs/${row.id as string}`)
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">First Article Inspection Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 22 - AS9102B FAIR Form 1/2/3 with AI balloon extraction
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
            New FAIR
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
          Loading FAIRs...
        </div>
      ) : (
        <Table<FAIRRow>
          data={fairs}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="fairs"
          emptyMessage="No FAIRs found - click 'New FAIR' to create one."
        />
      )}

      {/* New FAIR Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New FAIR"
        size="md"
      >
        <NewFAIRModal
          onCreated={() => refetch()}
          onClose={() => setShowNewModal(false)}
        />
      </Modal>
    </div>
  )
}
