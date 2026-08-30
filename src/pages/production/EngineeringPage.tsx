/**
 * EngineeringPage - Module 15: Engineering Releases
 *
 * Features:
 * - List view: ER number, SO, part number, drawing number, status badge
 * - Detail view: BOM table (inline-editable), Process Route table, approve button
 * - New ER modal form
 */

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, ChevronLeft, FileText, Plus, RefreshCw, Wrench } from 'lucide-react'
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  StateMachineBadge,
  Table,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import type { Column } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_ENGINEERING } from '../../lib/demoData'
import {
  approveEngineeringRelease,
  createEngineeringRelease,
  getEngineeringRelease,
  listEngineeringReleases,
  listMachines,
  updateEngineeringRelease,
  type EngineeringRelease,
  type Machine,
} from '../../api/productionApi'

// ---------------------------------------------------------------------------
// Types for BOM and Process Route rows
// ---------------------------------------------------------------------------

interface BOMRow {
  item_no: string
  part_no: string
  description: string
  qty: number
  uom: string
  make_buy: string
}

interface ProcessRouteRow {
  op_sequence: number
  op_name: string
  machine_id: string
  mhr: number
  cycle_time_min: number
  setup_time_min: number
}

type ERRow = EngineeringRelease & Record<string, unknown>

// ---------------------------------------------------------------------------
// Status badge for ER
// ---------------------------------------------------------------------------
function erStatusVariant(status: string): 'default' | 'success' | 'danger' {
  if (status === 'Approved') return 'success'
  if (status === 'Superseded') return 'danger'
  return 'default'
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  colour: string
}

function StatCard({ label, value, icon, colour }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colour}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New ER form modal
// ---------------------------------------------------------------------------
interface NewERModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

function NewERModal({ open, onClose, onCreated }: NewERModalProps) {
  const [form, setForm] = useState({
    so_id: '',
    part_number: '',
    drawing_number: '',
    drawing_revision: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setSaving(true)
    setError(null)
    createEngineeringRelease(form)
      .then(() => {
        onCreated()
        onClose()
        setForm({ so_id: '', part_number: '', drawing_number: '', drawing_revision: '' })
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create Engineering Release')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Engineering Release"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Create ER
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Sales Order ID"
          value={form.so_id}
          onChange={(e) => setForm((f) => ({ ...f, so_id: e.target.value }))}
          placeholder="SO-YYYY-NNNN"
        />
        <Input
          label="Part Number"
          value={form.part_number}
          onChange={(e) => setForm((f) => ({ ...f, part_number: e.target.value }))}
          placeholder="e.g. PART-001"
          required
        />
        <Input
          label="Drawing Number"
          value={form.drawing_number}
          onChange={(e) => setForm((f) => ({ ...f, drawing_number: e.target.value }))}
          placeholder="e.g. DRW-2024-001"
        />
        <Input
          label="Drawing Revision"
          value={form.drawing_revision}
          onChange={(e) => setForm((f) => ({ ...f, drawing_revision: e.target.value }))}
          placeholder="e.g. A"
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// BOM Table (inline edit)
// ---------------------------------------------------------------------------
interface BOMTableProps {
  rows: BOMRow[]
  onChange: (rows: BOMRow[]) => void
  readOnly?: boolean
}

function BOMTable({ rows, onChange, readOnly = false }: BOMTableProps) {
  const addRow = () =>
    onChange([...rows, { item_no: String(rows.length + 1), part_no: '', description: '', qty: 1, uom: 'EA', make_buy: 'Buy' }])

  const update = (i: number, field: keyof BOMRow, value: string | number) => {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    onChange(updated)
  }

  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Item #', 'Part No', 'Description', 'Qty', 'UOM', 'Make/Buy', ''].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm">
                  No BOM rows. Click "Add Row" to begin.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-1.5">
                  <input
                    className="w-10 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.item_no}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'item_no', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    className="w-24 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.part_no}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'part_no', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    className="w-40 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.description}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'description', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-14 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.qty}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'qty', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    className="w-14 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.uom}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'uom', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.make_buy}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'make_buy', e.target.value)}
                  >
                    <option>Make</option>
                    <option>Buy</option>
                    <option>Sub-contract</option>
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  {!readOnly && (
                    <button
                      onClick={() => remove(i)}
                      className="text-red-400 hover:text-red-600 text-xs font-medium"
                    >
                      œ•
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={addRow}>
          + Add Row
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Process Route Table (inline edit)
// ---------------------------------------------------------------------------
interface ProcessRouteTableProps {
  rows: ProcessRouteRow[]
  machines: Machine[]
  onChange: (rows: ProcessRouteRow[]) => void
  readOnly?: boolean
}

function ProcessRouteTable({ rows, machines, onChange, readOnly = false }: ProcessRouteTableProps) {
  const addRow = () =>
    onChange([
      ...rows,
      {
        op_sequence: (rows.length + 1) * 10,
        op_name: '',
        machine_id: '',
        mhr: 0,
        cycle_time_min: 0,
        setup_time_min: 0,
      },
    ])

  const update = (i: number, field: keyof ProcessRouteRow, value: string | number) => {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    onChange(updated)
  }

  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  const machineOptions = [
    { label: '-- Select Machine --', value: '' },
    ...machines.map((m) => ({ label: `${m.machine_code} - ${m.machine_name}`, value: m.id })),
  ]

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Seq', 'Operation', 'Machine', 'MHR (‚¹/hr)', 'Cycle (min)', 'Setup (min)', ''].map(
                (h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm">
                  No operations. Click "Add Row" to begin.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-14 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.op_sequence}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'op_sequence', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    className="w-36 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.op_name}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'op_name', e.target.value)}
                    placeholder="e.g. Turning"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.machine_id}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'machine_id', e.target.value)}
                  >
                    {machineOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.mhr}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'mhr', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.cycle_time_min}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'cycle_time_min', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50"
                    value={row.setup_time_min}
                    disabled={readOnly}
                    onChange={(e) => update(i, 'setup_time_min', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  {!readOnly && (
                    <button
                      onClick={() => remove(i)}
                      className="text-red-400 hover:text-red-600 text-xs font-medium"
                    >
                      œ•
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={addRow}>
          + Add Row
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------
interface ERDetailProps {
  er: EngineeringRelease
  machines: Machine[]
  onBack: () => void
  onRefresh: () => void
}

function ERDetail({ er, machines, onBack, onRefresh }: ERDetailProps) {
  const [bom, setBom] = useState<BOMRow[]>((er.bom as BOMRow[]) ?? [])
  const [route, setRoute] = useState<ProcessRouteRow[]>((er.process_route as ProcessRouteRow[]) ?? [])
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isApproved = er.status === 'Approved'

  const handleSave = () => {
    setSaving(true)
    setError(null)
    updateEngineeringRelease(er.id, { bom, process_route: route })
      .then(() => {
        setSuccess('Changes saved.')
        setTimeout(() => setSuccess(null), 3000)
        onRefresh()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Save failed')
      })
      .finally(() => setSaving(false))
  }

  const handleApprove = () => {
    setApproving(true)
    setError(null)
    approveEngineeringRelease(er.id)
      .then(() => {
        setSuccess('Engineering Release approved.')
        setTimeout(() => setSuccess(null), 3000)
        onRefresh()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Approve failed')
      })
      .finally(() => setApproving(false))
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ChevronLeft size={14} />}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{er.er_number}</h1>
              <Badge variant={erStatusVariant(er.status)}>{er.status}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Part: {er.part_number ?? '-'} | Drawing: {er.drawing_number ?? '-'} Rev {er.drawing_revision ?? '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isApproved && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              loading={saving}
            >
              Save Changes
            </Button>
          )}
          {!isApproved && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle size={14} />}
              onClick={handleApprove}
              loading={approving}
            >
              Approve (QM)
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}
      {isApproved && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          This Engineering Release is approved and locked. Approved by {er.approved_by ?? '""'} on {formatDate(er.approved_at)}.
        </div>
      )}

      {/* BOM */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Bill of Materials</h2>
        <BOMTable rows={bom} onChange={setBom} readOnly={isApproved} />
      </div>

      {/* Process Route */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Process Route</h2>
        <ProcessRouteTable rows={route} machines={machines} onChange={setRoute} readOnly={isApproved} />
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500 font-medium">SO Reference</dt>
            <dd className="text-gray-900 font-mono">{er.so_id ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 font-medium">Drawing Number</dt>
            <dd className="text-gray-900">{er.drawing_number ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 font-medium">Revision</dt>
            <dd className="text-gray-900">{er.drawing_revision ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 font-medium">Created</dt>
            <dd className="text-gray-900">{formatDate(er.created_at)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// List view columns
// ---------------------------------------------------------------------------
function buildColumns(): Column<ERRow>[] {
  return [
    {
      key: 'er_number',
      header: 'ER Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700">{row.er_number as string}</span>
      ),
    },
    {
      key: 'so_id',
      header: 'SO Reference',
      render: (row) => (
        <span className="font-mono text-xs text-gray-700">{(row.so_id as string) ?? '-'}</span>
      ),
    },
    {
      key: 'part_number',
      header: 'Part Number',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-800">{(row.part_number as string) ?? '-'}</span>,
    },
    {
      key: 'drawing_number',
      header: 'Drawing Number',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {(row.drawing_number as string) ?? '-'}{' '}
          {row.drawing_revision ? (
            <span className="text-xs text-gray-500">Rev {row.drawing_revision as string}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={erStatusVariant(row.status as string)} size="sm">
          {row.status as string}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (row) => <span className="text-xs text-gray-500">{formatDate(row.created_at as string)}</span>,
    },
  ]
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export function EngineeringPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: releases, isDemo, loading, error, refetch } = useDemoFallback(
    () => listEngineeringReleases({ status: statusFilter || undefined, limit: 200 }),
    DEMO_ENGINEERING,
    [statusFilter]
  )
  const [machines, setMachines] = useState<Machine[]>([])
  const [showNew, setShowNew] = useState(false)
  const [selectedER, setSelectedER] = useState<EngineeringRelease | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchReleases = useCallback(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    listMachines()
      .then(setMachines)
      .catch(() => {}) // non-critical
  }, [])

  const handleRowClick = (row: ERRow) => {
    setDetailLoading(true)
    getEngineeringRelease(row.id as string)
      .then((er) => setSelectedER(er))
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }

  const handleRefresh = () => {
    if (selectedER) {
      getEngineeringRelease(selectedER.id)
        .then((er) => setSelectedER(er))
        .catch(() => {})
    }
    fetchReleases()
  }

  // Stats
  const draft = releases.filter((r) => r.status === 'Draft').length
  const approved = releases.filter((r) => r.status === 'Approved').length
  const superseded = releases.filter((r) => r.status === 'Superseded').length

  const columns = buildColumns()

  const STATUS_OPTIONS = [
    { label: 'All Statuses', value: '' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Superseded', value: 'Superseded' },
  ]

  // Show detail if selected
  if (selectedER) {
    if (detailLoading) {
      return (
        <div className="p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading Engineering Release...
        </div>
      )
    }
    return (
      <ERDetail
        er={selectedER}
        machines={machines}
        onBack={() => setSelectedER(null)}
        onRefresh={handleRefresh}
      />
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Engineering Releases</h1>
          <p className="text-sm text-gray-500 mt-0.5">Module 15 "" BOM, process routes, approval workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchReleases()}
            icon={<RefreshCw size={14} />}
            title="Refresh"
          />
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowNew(true)}>
            New Engineering Release
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total ERs"
          value={releases.length}
          icon={<FileText size={18} className="text-amber-600" />}
          colour="bg-amber-50"
        />
        <StatCard
          label="Draft"
          value={draft}
          icon={<Wrench size={18} className="text-gray-500" />}
          colour="bg-gray-50"
        />
        <StatCard
          label="Approved"
          value={approved}
          icon={<CheckCircle size={18} className="text-green-600" />}
          colour="bg-green-50"
        />
        <StatCard
          label="Superseded"
          value={superseded}
          icon={<FileText size={18} className="text-red-400" />}
          colour="bg-red-50"
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
          Loading engineering releases...
        </div>
      ) : (
        <Table<ERRow>
          data={releases as ERRow[]}
          columns={columns}
          onRowClick={handleRowClick}
          rowKey={(row) => row.id as string}
          exportable
          exportFilename="engineering-releases"
          emptyMessage="No engineering releases found."
        />
      )}

      {/* New ER modal */}
      <NewERModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => fetchReleases()}
      />
    </div>
  )
}
