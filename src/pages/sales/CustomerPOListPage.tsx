/**
 * CustomerPOListPage - Module 11: Customer PO list view.
 *
 * Features:
 * - Page title: "Customer Purchase Orders" + Module 11 subtitle
 * - Table columns: Internal Ref, PO Number, Customer ID, PO Date, Status, Line Items count
 * - Filter by status dropdown
 * - Row click -> navigate to /sales/customer-pos/:id
 *  "New CPO" button with workflow guidance message
 * - Fetch from GET /api/v1/customer-pos
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Plus, RefreshCw } from 'lucide-react'
import { Button, Modal, Select, StateMachineBadge, Table, Column } from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import { formatDate } from '../../lib/utils'
import { listCustomerPOs, CustomerPO } from '../../api/salesApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_CUSTOMER_POS } from '../../lib/demoData'

type CPORow = CustomerPO & Record<string, unknown>

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------
const CPO_STATUSES = [
  'Received',
  'Registration',
  'Document Upload',
  'Contract Review-2',
  'Configuration Review-2',
  'Engineering/Technical Review',
  'Sales Order',
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  ...CPO_STATUSES.map((s) => ({ label: s, value: s })),
]

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
function buildColumns(): Column<CPORow>[] {
  return [
    {
      key: 'internal_ref',
      header: 'Internal Ref',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700 hover:text-amber-900">
          {row.internal_ref as string}
        </span>
      ),
    },
    {
      key: 'po_number',
      header: 'PO Number',
      sortable: true,
      render: (row) => (
        <span className="text-sm font-medium text-gray-800">{row.po_number as string}</span>
      ),
    },
    {
      key: 'customer_id',
      header: 'Customer ID',
      render: (row) => (
        <span className="text-sm text-gray-700 font-mono text-xs">{row.customer_id as string}</span>
      ),
    },
    {
      key: 'po_date',
      header: 'PO Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.po_date as string)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: 'line_items',
      header: 'Line Items',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {((row.line_items as unknown[]) ?? []).length}
        </span>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CustomerPOListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [showNewCPOModal, setShowNewCPOModal] = useState(false)

  const { data: cpos, isDemo, loading, error, refetch } = useDemoFallback(
    () => listCustomerPOs({ status: statusFilter || undefined, limit: 200 }),
    DEMO_CUSTOMER_POS,
    [statusFilter]
  )

  const fetchCPOs = () => refetch()

  const columns = buildColumns()

  const handleRowClick = (row: CPORow) => {
    navigate(`/sales/customer-pos/${row.id as string}`)
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 11 - CPO ingestion, PO vs Quotation diff, Sales Order conversion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchCPOs()}
            icon={<RefreshCw size={14} />}
            title="Refresh"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewCPOModal(true)}
            icon={<Plus size={14} />}
          >
            New CPO
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

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading customer purchase orders...
        </div>
      ) : (
        <Table<CPORow>
          data={cpos as CPORow[]}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="customer-pos"
          emptyMessage="No customer purchase orders found."
        />
      )}

      {/* New CPO guidance modal */}
      <Modal
        open={showNewCPOModal}
        onClose={() => setShowNewCPOModal(false)}
        title="Create Customer PO"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowNewCPOModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowNewCPOModal(false)
                navigate('/sales/quotations')
              }}
            >
              Go to Quotations
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-medium text-gray-900">CPOs are created from approved Quotations</p>
            <p>
              The correct workflow is: once a Quotation is in <span className="font-medium">Approved</span> or{' '}
              <span className="font-medium">Sent</span> state, navigate to the Quotation detail page
              and use the <span className="font-semibold">Convert to Customer PO</span> action.
            </p>
            <p>
              This ensures the CPO is linked to the correct quotation and enables automatic
              PO vs Quotation difference detection.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
