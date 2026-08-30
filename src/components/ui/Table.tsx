import { useState, useMemo, ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Download, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  /** Enable search bar. Default true. */
  searchable?: boolean
  /** Default page size. Default 25. */
  pageSize?: number
  /** Allowed page sizes. Default [10, 25, 50]. */
  pageSizeOptions?: number[]
  onRowClick?: (row: T) => void
  /** Row actions slot (rendered in last column) */
  actions?: (row: T) => ReactNode
  emptyMessage?: string
  /** Custom key extractor to use instead of row index */
  rowKey?: (row: T) => string | number
  /** Additional className for the container */
  className?: string
  /** Show CSV export button */
  exportable?: boolean
  exportFilename?: string
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  pageSize: defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50],
  onRowClick,
  actions,
  emptyMessage = 'No records found',
  rowKey,
  className,
  exportable = false,
  exportFilename = 'export',
}: TableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  }, [data, search])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof T]
      const bv = b[sortKey as keyof T]
      // Numeric sort
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const as = String(av ?? '')
      const bs = String(bv ?? '')
      const cmp = as.localeCompare(bs, 'en-IN', { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  // Reset to page 1 when filter changes
  const clampedPage = Math.min(page, totalPages)
  const paged = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const exportCSV = () => {
    const headers = columns.map((c) => c.header)
    const rows = sorted.map((row) =>
      columns.map((col) => {
        const v = col.render ? '' : String(row[col.key as keyof T] ?? '')
        return `"${v.replace(/"/g, '""')}"`
      })
    )
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={11} className="text-gray-400" />
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-amber-600" />
      : <ChevronDown size={11} className="text-amber-600" />
  }

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Toolbar */}
      {(searchable || exportable) && (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}
          <span className="text-xs text-gray-500 ml-auto">{sorted.length} records</span>
          {exportable && (
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export CSV"
            >
              <Download size={13} />
              Export
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && toggleSort(String(col.key))}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap',
                    col.sortable && 'cursor-pointer hover:text-gray-900 select-none',
                    col.headerClassName
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon colKey={String(col.key)} />}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn('px-4 py-3 text-gray-700', col.className)}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? '-')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {(totalPages > 1 || pageSizeOptions.length > 1) && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-4 flex-wrap text-xs text-gray-600">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Page nav */}
          <div className="flex items-center gap-2">
            <span>
              {((clampedPage - 1) * pageSize) + 1}-{Math.min(clampedPage * pageSize, sorted.length)} of {sorted.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={clampedPage === 1}
                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                aria-label="First page"
              ><ChevronsLeft size={14} /></button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage === 1}
                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              ><ChevronLeft size={14} /></button>
              <span className="px-2 py-1 text-gray-700 font-medium">
                {clampedPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={clampedPage === totalPages}
                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              ><ChevronRight size={14} /></button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={clampedPage === totalPages}
                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                aria-label="Last page"
              ><ChevronsRight size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
