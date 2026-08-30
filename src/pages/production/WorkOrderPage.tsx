/**
 * WorkOrderPage - Module 19: Work Order list view (MES)
 *
 * Features:
 * - Stat cards: Open | In Progress | Completed | Scrapped (total qty)
 * - Table: JC Number, Part Number, SO link, Status badge, Batch Qty, Total Cost
 * - Row click navigates to /production/work-orders/:id
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Package, RefreshCw, Wrench } from 'lucide-react'
import { Button, Select, StateMachineBadge, Table } from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import type { Column } from '../../components/ui'
import { formatDate, formatINR } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_WORK_ORDERS } from '../../lib/demoData'
import { listWorkOrders, type WorkOrder } from '../../api/productionApi'

type WORow = WorkOrder & Record<string, unknown>

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
// Table columns
// ---------------------------------------------------------------------------
function buildColumns(): Column<WORow>[] {
  return [
    {
      key: 'jc_number',
      header: 'JC Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700">
          {row.jc_number as string}
        </span>
      ),
    },
    {
      key: 'part_number',
      header: 'Part Number',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-800">{(row.part_number as string) ?? '-'}</span>
      ),
    },
    {
      key: 'so_id',
      header: 'SO Reference',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600">{(row.so_id as string) ?? '-'}</span>
      ),
    },
    {
      key: 'drawing_number',
      header: 'Drawing',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {(row.drawing_number as string) ?? '-'}
          {row.drawing_revision ? ` Rev ${row.drawing_revision as string}` : ''}
        </span>
      ),
    },
    {
      key: 'batch_quantity',
      header: 'Batch Qty',
      render: (row) => (
        <span className="text-sm font-mono text-gray-700">{row.batch_quantity as number}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: 'total_actual_cost',
      header: 'Actual Cost',
      render: (row) => {
        const cost = row.total_actual_cost as number
        return (
          <span className="text-sm font-mono text-gray-700">
            {cost > 0 ? `‚¹${formatINR(cost)}` : '-'}
          </span>
        )
      },
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

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Released', value: 'Released' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Closed', value: 'Closed' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WorkOrderPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const { data: workOrders, isDemo, loading, error, refetch } = useDemoFallback(
    () => listWorkOrders({ status: statusFilter || undefined, limit: 200 }),
    DEMO_WORK_ORDERS,
    [statusFilter]
  )

  const fetchOrders = () => refetch()

  // Stats
  const openCount = workOrders.filter((w) => w.status === 'Released').length
  const inProgressCount = workOrders.filter((w) => w.status === 'In Progress').length
  const completedCount = workOrders.filter((w) => w.status === 'Completed').length
  const totalScrapped = workOrders.reduce((sum, wo) => {
    return sum + (wo.operations ?? []).reduce((s, op) => s + (op.qty_scrapped ?? 0), 0)
  }, 0)

  const columns = buildColumns()

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 19 "" MES job cards, operation time tracking
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchOrders}
          icon={<RefreshCw size={14} />}
          title="Refresh"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Released"
          value={openCount}
          icon={<Package size={18} className="text-blue-500" />}
          colour="bg-blue-50"
          sub="Ready to start"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={<Wrench size={18} className="text-amber-600" />}
          colour="bg-amber-50"
          sub="Active WOs"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={<BarChart3 size={18} className="text-green-600" />}
          colour="bg-green-50"
          sub="This period"
        />
        <StatCard
          label="Total Scrapped"
          value={totalScrapped}
          icon={<Package size={18} className="text-red-400" />}
          colour="bg-red-50"
          sub="Units across all WOs"
        />
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isDemo && <DemoBanner />}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading work orders...
        </div>
      ) : (
        <Table<WORow>
          data={workOrders as WORow[]}
          columns={columns}
          onRowClick={(row) => navigate(`/production/work-orders/${row.id as string}`)}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="work-orders"
          emptyMessage="No work orders found."
        />
      )}
    </div>
  )
}
