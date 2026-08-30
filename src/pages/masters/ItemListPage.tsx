/**
 * ItemListPage - Module 05: Item Master list view.
 *
 * Features:
 * - Table with columns: Item Code, Item Name, Item Type, Category, Status, UOM, Material
 * - Search bar filters across all displayed columns
 * - "New Item" button -> /masters/items/new
 * - Row click -> /masters/items/:id
 * - Fetches from GET /api/v1/items via axios
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, Trash2 } from 'lucide-react'
import { Table, Column, Badge, StateMachineBadge, Button, Select } from '../../components/ui'
import { listItems, deleteItem, ItemRecord } from '../../api/itemApi'

// Table component requires Record<string, unknown>
type ItemRow = ItemRecord & Record<string, unknown>

// Item Type badge mapping
const ITEM_TYPE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'purple' | 'default'> = {
  FG: 'success',
  RM: 'info',
  SFG: 'warning',
  CONS: 'purple',
  TOOL: 'default',
  PKG: 'default',
  SPARE: 'warning',
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  FG: 'Finished Good',
  RM: 'Raw Material',
  SFG: 'Semi Finished',
  CONS: 'Consumable',
  TOOL: 'Tool/Fixture',
  PKG: 'Packaging',
  SPARE: 'Spare Part',
}

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'FG', label: 'Finished Good' },
  { value: 'RM', label: 'Raw Material' },
  { value: 'SFG', label: 'Semi Finished' },
  { value: 'CONS', label: 'Consumable' },
  { value: 'TOOL', label: 'Tool/Fixture' },
  { value: 'PKG', label: 'Packaging' },
  { value: 'SPARE', label: 'Spare Part' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Obsolete', label: 'Obsolete' },
]

// Column definitions
const columns: Column<ItemRow>[] = [
  {
    key: 'item_code',
    header: 'Item Code',
    sortable: true,
    className: 'font-mono text-xs',
  },
  {
    key: 'item_name',
    header: 'Item Name',
    sortable: true,
    render: (row) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-gray-900">{row.item_name || row.part_name || '-'}</span>
        {row.part_number && (
          <span className="text-xs text-gray-500">PN: {row.part_number}</span>
        )}
      </div>
    ),
  },
  {
    key: 'item_type',
    header: 'Type',
    render: (row) =>
      row.item_type ? (
        <Badge variant={ITEM_TYPE_VARIANT[row.item_type as string] ?? 'default'}>
          {ITEM_TYPE_LABELS[row.item_type as string] || row.item_type}
        </Badge>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    key: 'item_category',
    header: 'Category',
    className: 'text-xs',
    render: (row) => (
      <span className="text-gray-600">{(row.item_category as string) ?? '-'}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
  },
  {
    key: 'base_uom',
    header: 'UOM',
    className: 'text-xs font-mono',
    render: (row) => (
      <span className="text-gray-600">{row.base_uom || row.unit_of_measure || '-'}</span>
    ),
  },
  {
    key: 'material',
    header: 'Material',
    className: 'text-xs',
    render: (row) => (
      <span className="text-gray-600">{row.material || row.material_spec || '-'}</span>
    ),
  },
  {
    key: 'certifications',
    header: 'Certifications',
    render: (row) => (
      <div className="flex items-center gap-1">
        {row.as9100_applicable === 'Yes' && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#204577] text-white rounded">
            AS9100
          </span>
        )}
        {row.nadcap_applicable === 'Yes' && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-900 text-white rounded">
            NADCAP
          </span>
        )}
        {row.as9100_applicable !== 'Yes' && row.nadcap_applicable !== 'Yes' && (
          <span className="text-gray-400">-</span>
        )}
      </div>
    ),
  },
]

export function ItemListPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Authoritative real-data fetch. A successful empty response shows an empty
  // list (NOT demo rows) so saved records are never masked or appear "erased".
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listItems({
        q: search || undefined,
        item_type: typeFilter || undefined,
        status: statusFilter || undefined,
      })
      setItems(Array.isArray(rows) ? rows : [])
    } catch {
      setItems([])
      setError('Could not load items from the server. Make sure the backend is running, then retry.')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleRowClick = (row: ItemRow) => {
    navigate(`/masters/items/${row.id}`)
  }

  const handleNewItem = () => {
    navigate('/masters/items/new')
  }

  const handleDelete = async (row: ItemRow) => {
    if (!window.confirm(`Delete item "${row.item_name || row.item_code}" (${row.item_code})?\n\nThis removes it from the list.`)) return
    try {
      await deleteItem(row.id as string)
      fetchItems()
    } catch {
      alert('Failed to delete item.')
    }
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#204577] flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Module 05 - Parts, materials, and inventory items
              <span className="text-gray-400"> &middot; {items?.length ?? 0} item{(items?.length ?? 0) === 1 ? '' : 's'}</span>
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleNewItem}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <input
            type="search"
            placeholder="Search by code, name, part or drawing..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#204577] focus:border-[#204577] placeholder:text-gray-400"
          />
        </div>
        <div className="w-44">
          <Select options={TYPE_OPTIONS} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
        </div>
        <div className="w-40">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading items...
        </div>
      ) : (
        <Table<ItemRow>
          data={items as ItemRow[]}
          columns={columns}
          searchable={false}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="items"
          emptyMessage="No items found - click 'New Item' to add one."
          actions={(row) => (
            <button
              type="button"
              title="Delete item"
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
