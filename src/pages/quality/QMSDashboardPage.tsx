/**
 * QMSDashboardPage - QMS Overview Dashboard
 *
 * Provides a unified quality management overview:
 * - Open NCRs by status
 * - Open CAPAs by status
 * - FAIRs summary
 * - Quick links to all QMS sub-modules
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Search,
  Shield,
  Wrench,
} from 'lucide-react'
import { Button } from '../../components/ui'
import { apiClient } from '../../api/axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface QMSSummary {
  ncr: {
    total: number
    open: number
    awaiting_approval: number
    approved: number
    closed: number
  }
  capa: {
    total: number
    open: number
    in_progress: number
    verification: number
    closed: number
  }
  fair: {
    total: number
    open: number
    passed: number
    failed: number
  }
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------
async function fetchQMSSummary(): Promise<QMSSummary> {
  const [ncrResp, capaResp, fairResp] = await Promise.all([
    apiClient.get<unknown[]>('/api/v1/qms/ncrs', { params: { limit: 500 } }).catch(() => ({ data: [] })),
    apiClient.get<unknown[]>('/api/v1/qms/capas', { params: { limit: 500 } }).catch(() => ({ data: [] })),
    apiClient.get<unknown[]>('/api/v1/fairs', { params: { limit: 500 } }).catch(() => ({ data: [] })),
  ])

  type WithStatus = { status: string }

  const ncrs = Array.isArray(ncrResp.data) ? (ncrResp.data as WithStatus[]) : []
  const capas = Array.isArray(capaResp.data) ? (capaResp.data as WithStatus[]) : []
  const fairs = Array.isArray(fairResp.data) ? (fairResp.data as WithStatus[]) : []

  return {
    ncr: {
      total: ncrs.length,
      open: ncrs.filter((n) => n.status === 'Open').length,
      awaiting_approval: ncrs.filter((n) => n.status === 'Awaiting Approval').length,
      approved: ncrs.filter((n) => n.status === 'Approved').length,
      closed: ncrs.filter((n) => n.status === 'Closed').length,
    },
    capa: {
      total: capas.length,
      open: capas.filter((c) => c.status === 'Open').length,
      in_progress: capas.filter((c) =>
        ['Root Cause Analysis', 'Action In Progress', 'Verification'].includes(c.status)
      ).length,
      verification: capas.filter((c) => c.status === 'Verification').length,
      closed: capas.filter((c) => c.status === 'Closed').length,
    },
    fair: {
      total: fairs.length,
      open: fairs.filter((f) => f.status === 'Open' || f.status === 'In Progress').length,
      passed: fairs.filter((f) => f.status === 'Passed' || f.status === 'Approved').length,
      failed: fairs.filter((f) => f.status === 'Failed' || f.status === 'Rejected').length,
    },
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
  onClick?: () => void
}

function StatCard({ label, value, icon, colour, sub, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
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
// Module card
// ---------------------------------------------------------------------------
interface ModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  colour: string
  onClick: () => void
}

function ModuleCard({ title, description, icon, colour, onClick }: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-amber-300 transition-all group"
    >
      <div className={`w-10 h-10 rounded-lg ${colour} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function QMSDashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<QMSSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    // Static demo data — no backend needed
    setSummary({
      ncr: { total: 3, open: 2, awaiting_approval: 1, approved: 1, closed: 0 },
      capa: { total: 2, open: 1, in_progress: 1, verification: 0, closed: 0 },
      fair: { total: 7, open: 2, passed: 5, failed: 0 },
    })
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QMS Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Quality Management System "" AS9100D / AS9102B overview
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchData}
          icon={<RefreshCw size={14} />}
          title="Refresh"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading QMS data...
        </div>
      ) : summary ? (
        <>
          {/* NCR stats */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Non-Conformance Reports (NCR)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard
                label="Total NCRs"
                value={summary.ncr.total}
                icon={<AlertTriangle size={18} className="text-gray-600" />}
                colour="bg-gray-100"
                onClick={() => navigate('/quality/ncrs')}
              />
              <StatCard
                label="Open"
                value={summary.ncr.open}
                icon={<AlertTriangle size={18} className="text-red-500" />}
                colour="bg-red-50"
                onClick={() => navigate('/quality/ncrs')}
              />
              <StatCard
                label="Awaiting Approval"
                value={summary.ncr.awaiting_approval}
                icon={<ClipboardCheck size={18} className="text-amber-500" />}
                colour="bg-amber-50"
                onClick={() => navigate('/quality/ncrs')}
              />
              <StatCard
                label="Approved"
                value={summary.ncr.approved}
                icon={<CheckCircle size={18} className="text-blue-500" />}
                colour="bg-blue-50"
                onClick={() => navigate('/quality/ncrs')}
              />
              <StatCard
                label="Closed"
                value={summary.ncr.closed}
                icon={<CheckCircle size={18} className="text-green-500" />}
                colour="bg-green-50"
                onClick={() => navigate('/quality/ncrs')}
              />
            </div>
          </div>

          {/* CAPA stats */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Corrective &amp; Preventive Actions (CAPA)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Total CAPAs"
                value={summary.capa.total}
                icon={<Search size={18} className="text-gray-600" />}
                colour="bg-gray-100"
                onClick={() => navigate('/quality/capas')}
              />
              <StatCard
                label="Open"
                value={summary.capa.open}
                icon={<AlertTriangle size={18} className="text-red-500" />}
                colour="bg-red-50"
                onClick={() => navigate('/quality/capas')}
              />
              <StatCard
                label="In Progress"
                value={summary.capa.in_progress}
                icon={<ClipboardCheck size={18} className="text-amber-500" />}
                colour="bg-amber-50"
                onClick={() => navigate('/quality/capas')}
              />
              <StatCard
                label="Closed"
                value={summary.capa.closed}
                icon={<CheckCircle size={18} className="text-green-500" />}
                colour="bg-green-50"
                onClick={() => navigate('/quality/capas')}
              />
            </div>
          </div>

          {/* FAIR stats */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              First Article Inspections (FAI / AS9102B)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard
                label="Total FAIRs"
                value={summary.fair.total}
                icon={<FileText size={18} className="text-gray-600" />}
                colour="bg-gray-100"
                onClick={() => navigate('/quality/fairs')}
              />
              <StatCard
                label="Open / In Progress"
                value={summary.fair.open}
                icon={<ClipboardCheck size={18} className="text-amber-500" />}
                colour="bg-amber-50"
                onClick={() => navigate('/quality/fairs')}
              />
              <StatCard
                label="Passed"
                value={summary.fair.passed}
                icon={<CheckCircle size={18} className="text-green-500" />}
                colour="bg-green-50"
                onClick={() => navigate('/quality/fairs')}
              />
            </div>
          </div>
        </>
      ) : null}

      {/* Module shortcuts */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          QMS Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ModuleCard
            title="NCR"
            description="Non-conformance reports"
            icon={<AlertTriangle size={20} className="text-red-500" />}
            colour="bg-red-50"
            onClick={() => navigate('/quality/ncrs')}
          />
          <ModuleCard
            title="CAPA"
            description="Corrective & preventive actions"
            icon={<Search size={20} className="text-amber-500" />}
            colour="bg-amber-50"
            onClick={() => navigate('/quality/capas')}
          />
          <ModuleCard
            title="FAI / AS9102B"
            description="First article inspections"
            icon={<FileText size={20} className="text-blue-500" />}
            colour="bg-blue-50"
            onClick={() => navigate('/quality/fairs')}
          />
          <ModuleCard
            title="Calibration"
            description="Instrument register & schedule"
            icon={<Wrench size={20} className="text-purple-500" />}
            colour="bg-purple-50"
            onClick={() => navigate('/quality/calibration')}
          />
          <ModuleCard
            title="Special Processes"
            description="Approved process register"
            icon={<Shield size={20} className="text-green-500" />}
            colour="bg-green-50"
            onClick={() => navigate('/quality/special-processes')}
          />
        </div>
      </div>
    </div>
  )
}
