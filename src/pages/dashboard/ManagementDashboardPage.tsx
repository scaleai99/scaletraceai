/**
 * ManagementDashboardPage - Module 27: Management Dashboard
 *
 * Features:
 * - Date range selector (Current Month | Current Quarter | Current FY | Custom)
 * - 7 KPI cards with colour-coded status indicators
 * - Auto-refresh every 60 seconds
 * - Loading skeleton and error state with retry
 * - PDF export stub (toast)
 * - Indian FY label: FY 2025-26 (Apr""Mar)
 */

import { useEffect, useRef, useState } from 'react'
import {
  TrendingUp,
  Truck,
  Settings2,
  AlertCircle,
  ClipboardList,
  Star,
  BarChart3,
  RefreshCw,
  FileDown,
} from 'lucide-react'
import { type KPIData } from '../../api/dashboardApi'
import { DEMO_KPI } from '../../lib/demoData'
import { DemoBanner } from '../../components/ui/DemoBanner'
import { formatINR } from '../../lib/utils'
import { Button } from '../../components/ui'

// ---------------------------------------------------------------------------
// Date range types
// ---------------------------------------------------------------------------
type RangePreset = 'current_month' | 'current_quarter' | 'current_fy' | 'custom'

interface DateRange {
  preset: RangePreset
  from?: string
  to?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getCurrentFYLabel(): string {
  const now = new Date()
  const month = now.getMonth() // 0-indexed; April = 3
  const year = now.getFullYear()
  const fyStart = month >= 3 ? year : year - 1
  const fyEnd = fyStart + 1
  return `FY ${fyStart}-${String(fyEnd).slice(2)} (Apr""Mar)`
}

function rangeLabel(preset: RangePreset): string {
  switch (preset) {
    case 'current_month': return 'Current Month'
    case 'current_quarter': return 'Current Quarter'
    case 'current_fy': return getCurrentFYLabel()
    case 'custom': return 'Custom Range'
  }
}

function toApiRange(range: DateRange): { range: string; from?: string; to?: string } {
  if (range.preset === 'custom') {
    return { range: 'custom', from: range.from, to: range.to }
  }
  return { range: range.preset }
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (msg: string) => {
    setMessage(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMessage(null), 3000)
  }

  return { message, show }
}

// ---------------------------------------------------------------------------
// KPI skeleton
// ---------------------------------------------------------------------------
function KPISkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-gray-100" />
        <div className="w-16 h-5 rounded bg-gray-100" />
      </div>
      <div className="w-32 h-7 rounded bg-gray-100 mb-2" />
      <div className="w-24 h-4 rounded bg-gray-100" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------
type ColorVariant = 'green' | 'amber' | 'red' | 'blue'

interface KPICardProps {
  label: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: ColorVariant
  badge?: string
}

const colorMap: Record<ColorVariant, { icon: string; badge: string; value: string }> = {
  green: {
    icon: 'bg-green-50 text-green-600',
    badge: 'bg-green-100 text-green-700',
    value: 'text-green-700',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    value: 'text-amber-700',
  },
  red: {
    icon: 'bg-red-50 text-red-600',
    badge: 'bg-red-100 text-red-700',
    value: 'text-red-700',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    value: 'text-blue-700',
  },
}

function KPICard({ label, value, subtitle, icon, color, badge }: KPICardProps) {
  const c = colorMap[color]
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
            {badge}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold mb-1 ${c.value}`}>{value}</div>
      <div className="text-sm font-medium text-gray-700 mb-0.5">{label}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compute colour for each KPI
// ---------------------------------------------------------------------------
function otdColor(pct: number): ColorVariant {
  return pct >= 85 ? 'green' : 'red'
}
function oeeColor(pct: number): ColorVariant {
  return pct >= 75 ? 'green' : 'red'
}
function auditColor(score: number): ColorVariant {
  if (score >= 80) return 'green'
  if (score >= 60) return 'amber'
  return 'red'
}
function ebitdaColor(val: number): ColorVariant {
  return val >= 0 ? 'green' : 'red'
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ManagementDashboardPage() {
  const [range, setRange] = useState<DateRange>({ preset: 'current_fy' })
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const toast = useToast()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchKPIs = (_r: DateRange = range) => {
    setLoading(true)
    setError(null)
    // Static demo — no backend available, use demo data immediately
    setKpis(DEMO_KPI)
    setIsDemo(true)
    setLoading(false)
  }

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    fetchKPIs(range)
    intervalRef.current = setInterval(() => fetchKPIs(range), 60_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const handlePreset = (preset: RangePreset) => {
    const newRange: DateRange = { preset }
    setRange(newRange)
  }

  const handleCustomFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRange((prev) => ({ ...prev, from: e.target.value }))
  }
  const handleCustomTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRange((prev) => ({ ...prev, to: e.target.value }))
  }

  const handleExportPDF = () => {
    toast.show('PDF export coming soon')
  }

  const presets: RangePreset[] = ['current_month', 'current_quarter', 'current_fy', 'custom']

  // Period subtitle for cards
  const periodLabel = kpis
    ? `${kpis.date_from} "" ${kpis.date_to}`
    : rangeLabel(range.preset)

  return (
    <div className="max-w-7xl">
      {/* Toast */}
      {toast.message && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 27 "" {getCurrentFYLabel()} · KPI overview across all modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => fetchKPIs(range)}
            title="Refresh now"
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FileDown size={14} />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && <DemoBanner />}

      {/* Date range selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 mr-1">Period:</span>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                range.preset === p
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'current_fy' ? getCurrentFYLabel() : rangeLabel(p)}
            </button>
          ))}

          {range.preset === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={range.from ?? ''}
                onChange={handleCustomFrom}
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={range.to ?? ''}
                onChange={handleCustomTo}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => fetchKPIs(range)}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => fetchKPIs(range)}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <KPISkeleton key={i} />
          ))}
        </div>
      ) : kpis ? (
        <>
          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Card 1: Sales Pipeline */}
            <KPICard
              label="Sales Pipeline"
              value={`‚¹ ${formatINR(kpis.sales_pipeline_inr)}`}
              subtitle={periodLabel}
              icon={<TrendingUp size={18} />}
              color="amber"
              badge="Active"
            />

            {/* Card 2: On-Time Delivery */}
            <KPICard
              label="On-Time Delivery"
              value={`${kpis.otd_pct.toFixed(1)}%`}
              subtitle={`Target ‰¥ 85% · ${periodLabel}`}
              icon={<Truck size={18} />}
              color={otdColor(kpis.otd_pct)}
              badge={kpis.otd_pct >= 85 ? 'On Target' : 'Below Target'}
            />

            {/* Card 3: OEE */}
            <KPICard
              label="Overall Equipment Effectiveness"
              value={`${kpis.oee_pct.toFixed(1)}%`}
              subtitle={`Target ‰¥ 75% · ${periodLabel}`}
              icon={<Settings2 size={18} />}
              color={oeeColor(kpis.oee_pct)}
              badge={kpis.oee_pct >= 75 ? 'On Target' : 'Below Target'}
            />
          </div>

          {/* Row 2: 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 4: COPQ */}
            <KPICard
              label="Cost of Poor Quality"
              value={`‚¹ ${formatINR(kpis.copq_inr)}`}
              subtitle={`COPQ · ${periodLabel}`}
              icon={<AlertCircle size={18} />}
              color="red"
              badge="Cost"
            />

            {/* Card 5: NCR Count */}
            <KPICard
              label="NCR Count (12m)"
              value={String(kpis.ncr_trend_12m)}
              subtitle="Non-conformances · 12 months"
              icon={<ClipboardList size={18} />}
              color={kpis.ncr_trend_12m > 0 ? 'red' : 'green'}
              badge={kpis.ncr_trend_12m > 0 ? 'Issues' : 'Clean'}
            />

            {/* Card 6: Supplier Audit Score */}
            <KPICard
              label="Supplier Audit Score"
              value={`${kpis.supplier_avg_audit_score.toFixed(0)} / 100`}
              subtitle={`Average score · ${periodLabel}`}
              icon={<Star size={18} />}
              color={auditColor(kpis.supplier_avg_audit_score)}
              badge={
                kpis.supplier_avg_audit_score >= 80
                  ? 'Good'
                  : kpis.supplier_avg_audit_score >= 60
                  ? 'Acceptable'
                  : 'Poor'
              }
            />

            {/* Card 7: EBITDA Estimate */}
            <KPICard
              label="EBITDA Estimate"
              value={`‚¹ ${formatINR(kpis.ebitda_estimate_inr)}`}
              subtitle={`Estimated · ${periodLabel}`}
              icon={<BarChart3 size={18} />}
              color={ebitdaColor(kpis.ebitda_estimate_inr)}
              badge={kpis.ebitda_estimate_inr >= 0 ? 'Positive' : 'Negative'}
            />
          </div>
        </>
      ) : null}

      {/* Auto-refresh notice */}
      {!loading && !error && (
        <p className="text-xs text-gray-400 mt-4 text-right">
          Auto-refreshes every 60 seconds
        </p>
      )}
    </div>
  )
}
