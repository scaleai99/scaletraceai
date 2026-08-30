/**
 * ProductionPlanningPage - Module 16: MPS + Machine Loading
 *
 * Features:
 * - Master Production Schedule table: SO, part, planned start/end, status
 * - Machine Loading bar chart built with divs (no library):
 *   [Machine Name] [====bar====] XX% (X hrs / Y hrs)
 *   Red when utilisation > 85%
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, BarChart3, Calendar, RefreshCw } from 'lucide-react'
import { Button, StateMachineBadge, Table } from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import type { Column } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_PRODUCTION } from '../../lib/demoData'
import {
  getMachineLoading,
  getMPS,
  type MachineLoading,
  type ProductionOrder,
} from '../../api/productionApi'

type MPSRow = ProductionOrder & Record<string, unknown>

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
// Machine loading bar
// ---------------------------------------------------------------------------
interface MachineBarProps {
  loading: MachineLoading
}

function MachineBar({ loading: ml }: MachineBarProps) {
  const pct = Math.min(Math.max(ml.utilisation_pct, 0), 100)
  const overloaded = pct > 85
  const barWidth = `${pct}%`

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      {/* Machine name */}
      <div className="w-40 shrink-0">
        <span className="text-sm font-medium text-gray-700 truncate block">
          {ml.machine_name}
        </span>
        <span className="text-xs text-gray-400">{ml.machine_code}</span>
      </div>

      {/* Bar */}
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all ${overloaded ? 'bg-red-500' : 'bg-amber-400'}`}
          style={{ width: barWidth }}
        />
        {/* 85% marker */}
        <div
          className="absolute top-0 h-full w-px bg-orange-400 opacity-70"
          style={{ left: '85%' }}
          title="85% threshold"
        />
      </div>

      {/* Labels */}
      <div className="w-36 shrink-0 text-right">
        <span
          className={`text-sm font-semibold ${overloaded ? 'text-red-600' : 'text-gray-700'}`}
        >
          {pct.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-400 ml-1.5">
          ({ml.planned_hours.toFixed(1)} / {ml.available_hours.toFixed(1)} hrs)
        </span>
        {overloaded && (
          <span className="ml-1">
            <AlertTriangle size={12} className="inline text-red-500" />
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MPS table columns
// ---------------------------------------------------------------------------
function buildMPSColumns(): Column<MPSRow>[] {
  return [
    {
      key: 'so_id',
      header: 'SO Reference',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-700">
          {(row.so_id as string) ?? '-'}
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
      key: 'planned_qty',
      header: 'Planned Qty',
      render: (row) => (
        <span className="text-sm text-gray-700 font-mono">{row.planned_qty as number}</span>
      ),
    },
    {
      key: 'planned_start',
      header: 'Planned Start',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.planned_start ? formatDate(row.planned_start as string) : '-'}
        </span>
      ),
    },
    {
      key: 'planned_end',
      header: 'Planned End',
      sortable: true,
      render: (row) => {
        const isOverdue =
          row.planned_end &&
          new Date(row.planned_end as string) < new Date() &&
          !['Completed', 'Cancelled'].includes(row.status as string)
        return (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {row.planned_end ? formatDate(row.planned_end as string) : '-'}
            {isOverdue && ' š '}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StateMachineBadge state={row.status as string} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => (
        <span className="text-xs text-gray-400">{formatDate(row.created_at as string)}</span>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ProductionPlanningPage() {
  const { data: mps, isDemo, loading: loadingMPS, error: errorMPS, refetch: refetchMPS } = useDemoFallback(
    () => getMPS(),
    DEMO_PRODUCTION
  )
  const [machineLoading, setMachineLoading] = useState<MachineLoading[]>([])
  const [loadingChart, setLoadingChart] = useState(true)

  const fetchAll = () => {
    refetchMPS()
    setLoadingChart(true)
    getMachineLoading()
      .then(d => setMachineLoading(Array.isArray(d) ? d : []))
      .catch(() => setMachineLoading([]))
      .finally(() => setLoadingChart(false))
  }

  useEffect(() => {
    setLoadingChart(true)
    getMachineLoading()
      .then(d => setMachineLoading(Array.isArray(d) ? d : []))
      .catch(() => setMachineLoading([]))
      .finally(() => setLoadingChart(false))
  }, [])

  // Stats
  const openOrders = mps.filter((o) => ['Planned', 'Released', 'In Progress'].includes(o.status)).length
  const overdueCount = mps.filter(
    (o) =>
      o.planned_end &&
      new Date(o.planned_end) < new Date() &&
      !['Completed', 'Cancelled'].includes(o.status)
  ).length
  const overloadedMachines = machineLoading.filter((m) => m.utilisation_pct > 85).length

  const columns = buildMPSColumns()

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Planning / MPS</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 16 "" Master Production Schedule & Machine Loading
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAll}
          icon={<RefreshCw size={14} />}
          title="Refresh"
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Open Orders"
          value={openOrders}
          icon={<Calendar size={18} className="text-amber-600" />}
          colour="bg-amber-50"
          sub="In plan"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={<AlertTriangle size={18} className="text-red-500" />}
          colour="bg-red-50"
          sub="Past planned end"
        />
        <StatCard
          label="Machines"
          value={machineLoading.length}
          icon={<BarChart3 size={18} className="text-blue-500" />}
          colour="bg-blue-50"
          sub="In loading plan"
        />
        <StatCard
          label="Overloaded (>85%)"
          value={overloadedMachines}
          icon={<AlertTriangle size={18} className="text-orange-500" />}
          colour="bg-orange-50"
          sub="Capacity exceeded"
        />
      </div>

      {/* Machine Loading Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Machine Loading</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Overloaded (&gt;85%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-0.5 h-3 bg-orange-400 inline-block" /> 85% limit
            </span>
          </div>
        </div>

        {loadingChart ? (
          <div className="py-8 text-center text-sm text-gray-400 animate-pulse">
            Loading machine data...
          </div>
        ) : machineLoading.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No machine loading data available. Run MRP to generate.
          </div>
        ) : (
          <div>
            {machineLoading.map((ml) => (
              <MachineBar key={ml.machine_id} loading={ml} />
            ))}
          </div>
        )}
      </div>

      {/* MPS Table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Master Production Schedule</h2>

        {errorMPS && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errorMPS}
          </div>
        )}

        {isDemo && <DemoBanner />}

        {loadingMPS ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
            Loading production schedule...
          </div>
        ) : (
          <Table<MPSRow>
            data={mps as MPSRow[]}
            columns={columns}
            rowKey={(row) => row.id as string}
            exportable
            exportFilename="mps"
            emptyMessage="No production orders in the schedule."
          />
        )}
      </div>
    </div>
  )
}
