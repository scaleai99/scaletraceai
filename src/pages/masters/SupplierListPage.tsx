/**
 * SupplierListPage - Module 03: Supplier Master list view.
 *
 * Features:
 * - Table columns: Supplier Code, Supplier Name, Category, MSME,
 *   ASL Status (StateMachineBadge), Last Audit Score (colour-coded)
 * - Search bar + ASL status filter dropdown
 *  "New Supplier" button -> /masters/suppliers/new
 * - Row click -> /masters/suppliers/:id
 * - Fetches GET /api/v1/suppliers
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle, Trash2 } from 'lucide-react'
import { Table, Column, Badge, StateMachineBadge, Button, Select } from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import { listSuppliers, deleteSupplier, Supplier } from '../../api/supplierApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_SUPPLIERS } from '../../lib/demoData'

type SupplierRow = Supplier & Record<string, unknown>

// ---------------------------------------------------------------------------
// ASL status filter options
// ---------------------------------------------------------------------------
const ASL_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Active', label: 'Active' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Delisted', label: 'Delisted' },
]

// ---------------------------------------------------------------------------
// Audit score colour helper
// ---------------------------------------------------------------------------
function AuditScoreCell({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-gray-400">-</span>
  if (score >= 80) return <span className="text-green-700 font-semibold">{score}</span>
  if (score >= 60) return <span className="text-amber-600 font-semibold">{score}</span>
  return <span className="text-red-600 font-semibold">{score}</span>
}

// ---------------------------------------------------------------------------
// Supply category badge colours
// ---------------------------------------------------------------------------
const CATEGORY_VARIANT: Record<string, 'info' | 'warning' | 'purple' | 'default' | 'success'> = {
  'Raw Material': 'info',
  'Special Process': 'warning',
  'Sub-contract Machining': 'purple',
  Consumable: 'default',
  Tooling: 'success',
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const columns: Column<SupplierRow>[] = [
  {
    key: 'supplier_code',
    header: 'Supplier Code',
    sortable: true,
    className: 'font-mono text-xs',
  },
  {
    key: 'supplier_name',
    header: 'Supplier Name',
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span>{row.supplier_name as string}</span>
        {row.audit_overdue && (
          <span title="Audit overdue (no completed audit in 12 months)">
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'supply_category',
    header: 'Category',
    render: (row) =>
      row.supply_category ? (
        <Badge
          variant={CATEGORY_VARIANT[row.supply_category as string] ?? 'default'}
          size="sm"
        >
          {row.supply_category as string}
        </Badge>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    key: 'msme_category',
    header: 'MSME',
    render: (row) =>
      row.msme_category ? (
        <span className="text-sm text-gray-600">{row.msme_category as string}</span>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    key: 'asl_status',
    header: 'ASL Status',
    render: (row) => <StateMachineBadge state={row.asl_status as string} size="sm" />,
  },
  {
    key: 'last_audit_score',
    header: 'Last Audit Score',
    render: (row) => (
      <AuditScoreCell score={row.last_audit_score as number | null | undefined} />
    ),
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SupplierListPage() {
  const navigate = useNavigate()

  // Filter state
  const [search, setSearch] = useState('')
  const [aslStatus, setAslStatus] = useState('')

  const { data: suppliers, isDemo, loading, error, refetch } = useDemoFallback(
    () => listSuppliers({
      search: search || undefined,
      asl_status: aslStatus || undefined,
      limit: 200,
    }),
    DEMO_SUPPLIERS,
    [search, aslStatus]
  )

  const handleRowClick = (row: SupplierRow) => {
    navigate(`/masters/suppliers/${row.id}`)
  }

  const handleDelete = async (row: SupplierRow) => {
    if (!window.confirm(`Delete supplier "${row.supplier_name}" (${row.supplier_code})?\n\nThis removes it from the list.`)) return
    try {
      await deleteSupplier(row.id as string)
      refetch()
    } catch {
      alert('Failed to delete supplier. Only an Administrator can delete suppliers.')
    }
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 03 - Approved Vendor List, audits, capabilities
            <span className="text-gray-400"> &middot; {suppliers?.length ?? 0} supplier{(suppliers?.length ?? 0) === 1 ? '' : 's'}</span>
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/masters/suppliers/new')}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Supplier
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
            options={ASL_STATUS_OPTIONS}
            value={aslStatus}
            onChange={(e) => setAslStatus(e.target.value)}
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
          Loading suppliers...
        </div>
      ) : (
        <Table<SupplierRow>
          data={suppliers as SupplierRow[]}
          columns={columns}
          searchable={false}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="suppliers"
          emptyMessage="No suppliers found - click 'New Supplier' to add one."
          actions={(row) => (
            <button
              type="button"
              title="Delete supplier"
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
