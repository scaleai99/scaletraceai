/**
 * CustomerListPage - Module 02: Customer Master list view.
 *
 * Features:
 * - Table with columns: Customer Code (sortable), Customer Name (sortable),
 *   Tier (badge), Status (StateMachineBadge), GSTIN, Contact
 * - Search bar filters across all displayed columns
 *  "New Customer" button -> /masters/customers/new
 * - Row click -> /masters/customers/:id
 * - Fetches from GET /api/v1/customers via axios
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Table, Column, Badge, StateMachineBadge, Button, Select } from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import { listCustomers, deleteCustomer, Customer } from '../../api/customerApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_CUSTOMERS } from '../../lib/demoData'

// Table component requires Record<string, unknown> - use this local alias for column definitions
type CustomerRow = Customer & Record<string, unknown>

// ---------------------------------------------------------------------------
// Tier badge colour mapping
// ---------------------------------------------------------------------------
const TIER_VARIANT: Record<string, 'info' | 'warning' | 'purple'> = {
  OEM: 'info',
  'Tier-1': 'warning',
  Direct: 'purple',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: Column<CustomerRow>[] = [
  {
    key: 'customer_code',
    header: 'Customer Code',
    sortable: true,
    className: 'font-mono text-xs',
  },
  {
    key: 'customer_name',
    header: 'Customer Name',
    sortable: true,
  },
  {
    key: 'customer_tier',
    header: 'Tier',
    render: (row) =>
      row.customer_tier ? (
        <Badge variant={TIER_VARIANT[row.customer_tier as string] ?? 'default'}>
          {row.customer_tier as string}
        </Badge>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
  },
  {
    key: 'gstin',
    header: 'GSTIN',
    className: 'font-mono text-xs',
    render: (row) => (
      <span className="text-gray-600">{(row.gstin as string) ?? '-'}</span>
    ),
  },
  {
    key: 'contact_name',
    header: 'Contact',
    render: (row) => (
      <div className="flex flex-col gap-0.5">
        {row.contact_name && (
          <span className="text-sm">{row.contact_name as string}</span>
        )}
        {row.contact_mobile && (
          <span className="text-xs text-gray-500">{row.contact_mobile as string}</span>
        )}
        {!row.contact_name && !row.contact_mobile && (
          <span className="text-gray-400">-</span>
        )}
      </div>
    ),
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CustomerListPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: customers, isDemo, loading, error, refetch } = useDemoFallback(
    () => listCustomers({
      search: search || undefined,
      status: statusFilter || undefined,
      limit: 200,
    }),
    DEMO_CUSTOMERS,
    [search, statusFilter]
  )

  const handleRowClick = (row: CustomerRow) => {
    navigate(`/masters/customers/${row.id}`)
  }

  const handleNewCustomer = () => {
    navigate('/masters/customers/new')
  }

  const handleDelete = async (row: CustomerRow) => {
    if (!window.confirm(`Delete customer "${row.customer_name}" (${row.customer_code})?\n\nThis removes it from the list.`)) return
    try {
      await deleteCustomer(row.id as string)
      refetch()
    } catch {
      alert('Failed to delete customer.')
    }
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 02 - Customer profiles, sites, quality requirements
            <span className="text-gray-400"> &middot; {customers?.length ?? 0} customer{(customers?.length ?? 0) === 1 ? '' : 's'}</span>
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewCustomer}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <input
            type="search"
            placeholder="Search by code, name or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-400"
          />
        </div>
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

      {/* Demo banner */}
      {isDemo && <DemoBanner />}

      {/* Loading skeleton */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading customers...
        </div>
      ) : (
        <Table<CustomerRow>
          data={customers as CustomerRow[]}
          columns={columns}
          searchable={false}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="customers"
          emptyMessage="No customers found - click 'New Customer' to add one."
          actions={(row) => (
            <button
              type="button"
              title="Delete customer"
              onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        />
      )}
    </div>
  )
}
