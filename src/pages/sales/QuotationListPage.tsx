/**
 * QuotationListPage - Module 10: Quotation list view.
 *
 * Features:
 * - Table: QT Number, Customer, Total Value (INR formatted), Status badge, Validity Date
 * - Filter by status
 *  "New Quotation" button
 * - Fetches from GET /api/v1/quotations
 */

import { useEffect, useState } from 'react'
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
import { DemoBanner } from '../../components/ui/DemoBanner'
import { formatDate, formatINR } from '../../lib/utils'
import { listQuotations, Quotation } from '../../api/quotationApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_QUOTATIONS } from '../../lib/demoData'

type QuotationRow = Quotation & Record<string, unknown>

// ---------------------------------------------------------------------------
// Status badge variant helper
// ---------------------------------------------------------------------------
function getStatusVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'default' | 'info' {
  switch (status) {
    case 'Draft':
      return 'default'
    case 'Pending Approval':
      return 'warning'
    case 'Approved':
    case 'Won':
      return 'success'
    case 'Sent':
      return 'info'
    case 'Lost':
      return 'danger'
    case 'Revision Requested':
      return 'warning'
    default:
      return 'default'
  }
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: Column<QuotationRow>[] = [
  {
    key: 'quotation_number',
    header: 'QT Number',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-amber-700 hover:text-amber-900">
        {row.quotation_number as string}
        {(row.revision as number) > 0 && (
          <span className="ml-1.5 text-xs font-normal text-gray-400">
            Rev {row.revision as number}
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'customer_id',
    header: 'Customer',
    render: (row) => (
      <span className="text-sm text-gray-800">
        {(row as Quotation & { customer_name?: string }).customer_name ?? (row.customer_id as string)}
      </span>
    ),
  },
  {
    key: 'total_value',
    header: 'Total Value',
    sortable: true,
    render: (row) => (
      <span className="text-sm font-mono text-gray-800">
        {row.total_value != null ? formatINR(row.total_value as number) : '-'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge variant={getStatusVariant(row.status as string)} size="sm">
        {row.status as string}
      </Badge>
    ),
  },
  {
    key: 'validity_date',
    header: 'Validity Date',
    sortable: true,
    render: (row) => (
      <span className="text-sm text-gray-700">
        {row.validity_date ? formatDate(row.validity_date as string) : '-'}
      </span>
    ),
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    render: (row) => (
      <span className="text-xs text-gray-500">{formatDate(row.created_at as string)}</span>
    ),
  },
]

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const QUOTATION_STATUSES = [
  'Draft',
  'Pending Approval',
  'Approved',
  'Sent',
  'Won',
  'Lost',
  'Revision Requested',
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  ...QUOTATION_STATUSES.map((s) => ({ label: s, value: s })),
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function QuotationListPage() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')

  const { data: quotations, isDemo, loading, error, refetch } = useDemoFallback(
    () => listQuotations({ status: statusFilter || undefined, limit: 200 }),
    DEMO_QUOTATIONS,
    [statusFilter]
  )

  const fetchQuotations = () => refetch()

  const handleRowClick = (row: QuotationRow) => {
    navigate(`/sales/quotations/${row.id as string}`)
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 10 - Quotation creation, revision chain, approval workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchQuotations()}
            icon={<RefreshCw size={14} />}
            title="Refresh"
          />
          <Button
            variant="primary"
            onClick={() => navigate('/sales/quotations/new')}
            icon={<Plus size={16} />}
          >
            New Quotation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-56">
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
          Loading quotations...
        </div>
      ) : (
        <Table<QuotationRow>
          data={quotations as QuotationRow[]}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="quotations"
          emptyMessage="No quotations found - click 'New Quotation' to create one."
        />
      )}
    </div>
  )
}
