/**
 * RFQListPage - Module 04: RFQ list view.
 *
 * Features:
 * - Table: RFQ Number (link), Customer Name, Due Date, Priority (badge), Status, Owner
 * - Priority colour: High=red, Medium=amber, Low=grey
 * - Search bar + status dropdown filter
 *  "New RFQ" button -> /sales/rfqs/new
 * - Fetches from GET /api/v1/rfqs
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import {
  Table,
  Column,
  Badge,
  StateMachineBadge,
  Button,
  Select,
} from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { listRFQs, RFQ } from '../../api/rfqApi'
import { RFQ_STATES } from '../../lib/rfqConstants'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_RFQS } from '../../lib/demoData'
import { DemoBanner } from '../../components/ui/DemoBanner'

type RFQRow = RFQ & Record<string, unknown>

// ---------------------------------------------------------------------------
// Priority badge colours
// ---------------------------------------------------------------------------
const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'default'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'default',
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: Column<RFQRow>[] = [
  {
    key: 'rfq_number',
    header: 'RFQ Number',
    sortable: true,
    className: 'font-mono text-xs font-semibold text-amber-700',
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-amber-700 hover:text-amber-900">
        {row.rfq_number as string}
      </span>
    ),
  },
  {
    key: 'customer_id',
    header: 'Customer',
    render: (row) => (
      <span className="text-sm text-gray-800">{(row as RFQ & { customer_name?: string }).customer_name ?? (row.customer_id as string)}</span>
    ),
  },
  {
    key: 'quotation_due_date',
    header: 'Due Date',
    sortable: true,
    render: (row) => (
      <span className="text-sm text-gray-700">
        {formatDate(row.quotation_due_date as string)}
      </span>
    ),
  },
  {
    key: 'priority',
    header: 'Priority',
    render: (row) => (
      <Badge variant={PRIORITY_VARIANT[row.priority as string] ?? 'default'} size="sm">
        {row.priority as string}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <StateMachineBadge state={row.status as string} size="sm" />
    ),
  },
]

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  ...RFQ_STATES.map((s) => ({ label: s, value: s })),
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RFQListPage() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')

  const { data: rfqs, isDemo, loading, error, refetch } = useDemoFallback(
    () => listRFQs({ status: statusFilter || undefined, limit: 200 }),
    DEMO_RFQS,
    [statusFilter]
  )

  const handleRowClick = (row: RFQRow) => {
    navigate(`/sales/rfqs/${row.id as string}`)
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 04 - Request for Quotation with drawing upload and AI extraction
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
            onClick={() => navigate('/sales/rfqs/new')}
            icon={<Plus size={16} />}
          >
            New RFQ
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

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading RFQs...
        </div>
      ) : (
        <Table<RFQRow>
          data={rfqs as RFQRow[]}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="rfqs"
          emptyMessage="No RFQs found - click 'New RFQ' to create one."
        />
      )}
    </div>
  )
}
