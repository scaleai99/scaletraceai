/**
 * SalesOrderListPage - Module 14: Sales Order list view.
 *
 * Features:
 * - 4 stat cards: Open Orders | Overdue | Pending Dispatch | Monthly Revenue (0)
 * - Table: SO Number, Customer, Status badge, Line Items count, Total Value
 * - Fetches from GET /api/v1/sales-orders
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { Badge, Button, Select, StateMachineBadge, Table, Column } from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import { formatDate, formatINR } from '../../lib/utils'
import { listSalesOrders, SalesOrder } from '../../api/salesApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_SALES_ORDERS } from '../../lib/demoData'

type SORow = SalesOrder & Record<string, unknown>

// ---------------------------------------------------------------------------
// Status badge variant helper
// ---------------------------------------------------------------------------
function soStatusVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'default' | 'info' {
  switch (status) {
    case 'Open': return 'default'
    case 'In Production': return 'warning'
    case 'Partially Dispatched': return 'info'
    case 'Completed': return 'success'
    case 'Cancelled': return 'danger'
    default: return 'default'
  }
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
// Column definitions
// ---------------------------------------------------------------------------
function buildColumns(navigate: (path: string) => void): Column<SORow>[] {
  return [
    {
      key: 'so_number',
      header: 'SO Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700 hover:text-amber-900">
          {row.so_number as string}
        </span>
      ),
    },
    {
      key: 'customer_id',
      header: 'Customer',
      render: (row) => (
        <span className="text-sm text-gray-800">
          {(row as SalesOrder & { customer_name?: string }).customer_name ?? (row.customer_id as string)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={soStatusVariant(row.status as string)} size="sm">
          {row.status as string}
        </Badge>
      ),
    },
    {
      key: 'line_items',
      header: 'Lines',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {((row.line_items ?? []) as unknown[]).length}
        </span>
      ),
    },
    {
      key: 'total_value',
      header: 'Total Value',
      render: (row) => {
        const total = ((row.line_items ?? []) as SalesOrder['line_items']).reduce((sum, li) => {
          const price = Number(li.agreed_unit_price ?? 0)
          const qty = Number(li.quantity ?? 0)
          return sum + price * qty
        }, 0)
        return (
          <span className="text-sm font-mono text-gray-800">
            {total > 0 ? formatINR(total) : '-'}
          </span>
        )
      },
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
}

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const SO_STATUSES = ['Open', 'In Production', 'Partially Dispatched', 'Completed', 'Cancelled']

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  ...SO_STATUSES.map((s) => ({ label: s, value: s })),
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SalesOrderListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: orders, isDemo, loading, error, refetch } = useDemoFallback(
    () => listSalesOrders({ status: statusFilter || undefined, limit: 200 }),
    DEMO_SALES_ORDERS,
    [statusFilter]
  )

  const fetchOrders = () => refetch()

  // Compute stat card values
  const openOrders = orders.filter((o) => o.status === 'Open').length
  const pendingDispatch = orders.filter((o) =>
    ['Approved', 'Partially Dispatched', 'In Production'].includes(o.status as string)
  ).length
  const overdueOrders = orders.filter((o) => {
    if (!['Open', 'In Production', 'Partially Dispatched'].includes(o.status as string)) return false
    const lineItems = (o.line_items ?? []) as SalesOrder['line_items']
    return lineItems.some(
      (li) => li.delivery_date && new Date(li.delivery_date) < new Date()
    )
  }).length

  // Monthly revenue: sum all Completed SO values this month
  const now = new Date()
  const monthlyRevenue = orders
    .filter((o) => {
      if (o.status !== 'Completed') return false
      const created = new Date(o.created_at as string)
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    })
    .reduce((sum, o) => {
      const total = ((o.line_items ?? []) as SalesOrder['line_items']).reduce((s, li) => {
        return s + Number(li.agreed_unit_price ?? 0) * Number(li.quantity ?? 0)
      }, 0)
      return sum + total
    }, 0)

  const columns = buildColumns(navigate)

  const handleRowClick = (row: SORow) => {
    navigate(`/sales/sales-orders/${row.id as string}`)
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 14 - Confirmed orders from customer POs
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchOrders()}
          icon={<RefreshCw size={14} />}
          title="Refresh"
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Open Orders"
          value={openOrders}
          icon={<ShoppingCart size={18} className="text-amber-600" />}
          colour="bg-amber-50"
          sub="Active SOs"
        />
        <StatCard
          label="Overdue"
          value={overdueOrders}
          icon={<AlertTriangle size={18} className="text-red-500" />}
          colour="bg-red-50"
          sub="Past delivery date"
        />
        <StatCard
          label="Pending Dispatch"
          value={pendingDispatch}
          icon={<Truck size={18} className="text-blue-500" />}
          colour="bg-blue-50"
          sub="Ready to dispatch"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatINR(monthlyRevenue)}
          icon={<BarChart3 size={18} className="text-green-600" />}
          colour="bg-green-50"
          sub={`${now.toLocaleString('en-IN', { month: 'short', year: 'numeric' })}`}
        />
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
          Loading sales orders...
        </div>
      ) : (
        <Table<SORow>
          data={orders as SORow[]}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="sales-orders"
          emptyMessage="No sales orders found."
        />
      )}
    </div>
  )
}
