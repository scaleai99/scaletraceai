/**
 * AuditTrailPage - Global Audit Trail (cross-module compliance view).
 *
 * Read-only view over every already-instrumented module's audit events,
 * categorized by the same groups as the left nav. Administrator-only on
 * the backend (no dedicated Auditor role exists yet).
 *
 * Deliberately does NOT use the useDemoFallback/demo-data pattern some
 * other list pages use (e.g. SupplierListPage.tsx) -- for a compliance
 * audit trail, showing synthetic rows in place of a failed real fetch
 * would be actively misleading, not a convenience. A failed fetch shows
 * a real error banner and an empty table, never fabricated entries.
 *
 * Pagination is server-side (offset/limit against the API's real total),
 * not the shared Table component's built-in client-side slicing -- audit
 * history is expected to grow past what's reasonable to fetch in one shot.
 */

import { useEffect, useState } from 'react'
import { Table, Column, Select, DateInput, Button } from '../../components/ui'
import { listAuditTrail, listAuditModules, AuditTrailItem, AuditModuleSummary } from '../../api/auditApi'
import { formatDateTime } from '../../lib/utils'

type AuditRow = AuditTrailItem & Record<string, unknown>

const LIMIT = 50

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'ACTIVATE', label: 'Activate' },
  { value: 'DEACTIVATE', label: 'Deactivate' },
]

const ACTION_CLASSES: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700 border-green-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  ACTIVATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DEACTIVATE: 'bg-amber-50 text-amber-700 border-amber-200',
}

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_CLASSES[action] ?? 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {action}
    </span>
  )
}

function detailSummary(row: AuditTrailItem): string {
  if (row.action === 'CREATE') return 'New record created'
  if (row.action === 'DELETE') return 'Record deleted'
  if (row.changed_fields && row.changed_fields.length > 0) return row.changed_fields.join(', ')
  return '-'
}

export function AuditTrailPage() {
  // Filters
  const [navGroup, setNavGroup] = useState('')
  const [recordType, setRecordType] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [offset, setOffset] = useState(0)

  // Filter panel data (module/page counts)
  const [modules, setModules] = useState<AuditModuleSummary[]>([])
  const [modulesError, setModulesError] = useState<string | null>(null)

  // Page data
  const [items, setItems] = useState<AuditTrailItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    listAuditModules()
      .then(r => setModules(Array.isArray(r) ? r : []))
      .catch((err: unknown) => {
        const axErr = err as { response?: { data?: { detail?: string } } }
        setModulesError(axErr?.response?.data?.detail ?? 'Failed to load module list')
        setModules([])
      })
  }, [])

  // Reset to the first page whenever a filter changes (not on pure paging).
  useEffect(() => { setOffset(0) }, [navGroup, recordType, action, dateFrom, dateTo])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setLoadError(null)
    listAuditTrail({
      nav_group: navGroup || undefined,
      record_type: recordType || undefined,
      action: action || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      limit: LIMIT,
      offset,
    })
      .then((page) => {
        if (cancelled) return
        setItems(Array.isArray(page?.items) ? page.items : [])
        setTotal(typeof page?.total === 'number' ? page.total : 0)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const axErr = err as { response?: { data?: { detail?: string } } }
        setLoadError(axErr?.response?.data?.detail ?? 'Failed to load audit trail. Only an Administrator can view this page.')
        setItems([]); setTotal(0)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [navGroup, recordType, action, dateFrom, dateTo, offset])

  const navGroupOptions = [
    { value: '', label: 'All modules' },
    ...Array.from(new Set(modules.map((m) => m.nav_group))).sort().map((g) => ({ value: g, label: g })),
  ]
  const recordTypeOptions = [
    { value: '', label: 'All record types' },
    ...modules
      .filter((m) => !navGroup || m.nav_group === navGroup)
      .sort((a, b) => a.page_label.localeCompare(b.page_label))
      .map((m) => ({ value: m.record_type, label: `${m.page_label} — ${m.record_type} (${m.count})` })),
  ]

  const columns: Column<AuditRow>[] = [
    { key: 'timestamp', header: 'Date / Time', render: (row) => <span className="whitespace-nowrap">{formatDateTime(row.timestamp)}</span> },
    {
      key: 'user_name',
      header: 'User',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-800">{row.user_name}</div>
          {row.user_role && <div className="text-[11px] text-gray-400">{row.user_role}</div>}
        </div>
      ),
    },
    {
      key: 'page_label',
      header: 'Module / Page',
      render: (row) => (
        <div>
          <div className="text-gray-800">{row.nav_group}</div>
          <div className="text-[11px] text-gray-400">{row.page_label}</div>
        </div>
      ),
    },
    { key: 'action', header: 'Action', render: (row) => <ActionBadge action={row.action} /> },
    { key: 'record_type', header: 'Record Type' },
    { key: 'changed_fields', header: 'Details', render: (row) => <span className="text-gray-600">{detailSummary(row)}</span> },
  ]

  const rangeStart = total === 0 ? 0 : offset + 1
  const rangeEnd = Math.min(offset + LIMIT, total)

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every recorded change across the ERP, categorized by module
            <span className="text-gray-400"> &middot; {total} event{total === 1 ? '' : 's'}</span>
          </p>
        </div>
      </div>

      {modulesError && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Module filter list unavailable: {modulesError}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Select
          label="Module"
          options={navGroupOptions}
          value={navGroup}
          onChange={(e) => { setNavGroup(e.target.value); setRecordType('') }}
        />
        <Select
          label="Record Type"
          options={recordTypeOptions}
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
        />
        <Select
          label="Action"
          options={ACTION_OPTIONS}
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
        <DateInput label="From" value={dateFrom} onChange={setDateFrom} />
        <DateInput label="To" value={dateTo} onChange={setDateTo} />
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading audit trail...
        </div>
      ) : (
        <>
          <Table<AuditRow>
            data={items as AuditRow[]}
            columns={columns}
            searchable={false}
            pageSize={Math.max(LIMIT, 1)}
            pageSizeOptions={[LIMIT]}
            rowKey={(row) => row.event_id}
            exportable
            exportFilename="audit-trail"
            emptyMessage={loadError ? 'Unable to load audit trail.' : 'No audit events match these filters.'}
          />
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>{total === 0 ? 'No events' : `Showing ${rangeStart}-${rangeEnd} of ${total}`}</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={rangeEnd >= total} onClick={() => setOffset((o) => o + LIMIT)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
