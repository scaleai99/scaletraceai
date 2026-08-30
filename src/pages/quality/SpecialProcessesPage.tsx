/**
 * SpecialProcessesPage - Module 20: Special Processes.
 *
 * Features:
 * - Two tabs: Master and Jobs
 * - Master tab: process_code, process_name, nadcap_required badge, spec_number
 * - Jobs tab: id, work_order_id, process_master_id, supplier_id, status, nadcap_expiry_warning
 * - "New Process" and "New Job" buttons with modals
 * - Loads from /api/v1/special-processes/master and /api/v1/special-processes/jobs
 */

import { useEffect, useState } from 'react'
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import {
  Badge,
  StateMachineBadge,
  Button,
  Modal,
  Input,
  Select,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProcessMaster {
  id: string
  process_code: string
  process_name: string
  nadcap_required: boolean
  spec_number: string | null
}

interface ProcessJob {
  id: string
  work_order_id: string | null
  process_master_id: string
  supplier_id: string | null
  status: string
  nadcap_expiry_warning: boolean
}

type PMRow = ProcessMaster & Record<string, unknown>
type PJRow = ProcessJob & Record<string, unknown>

const MASTER_BASE = '/api/v1/special-processes/master'
const JOBS_BASE = '/api/v1/special-processes/jobs'

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const DEMO_SP_MASTERS: PMRow[] = [
  { id: 'demo-sp-001', process_code: 'ANODIZE-HA', process_name: 'Hard Anodize Type III', nadcap_required: false, spec_number: 'MIL-A-8625 Type III' },
  { id: 'demo-sp-002', process_code: 'CHEM-FILM', process_name: 'Chemical Film / Alodine', nadcap_required: false, spec_number: 'MIL-DTL-5541' },
  { id: 'demo-sp-003', process_code: 'FPI', process_name: 'Fluorescent Penetrant Inspection', nadcap_required: true, spec_number: 'NAS 410 Level II' },
  { id: 'demo-sp-004', process_code: 'CADPLATE', process_name: 'Cadmium Plating', nadcap_required: true, spec_number: 'AMS 2400' },
  { id: 'demo-sp-005', process_code: 'HEAT-TREAT', process_name: 'Heat Treatment', nadcap_required: true, spec_number: 'AMS 2770' },
]

const DEMO_SP_JOBS: PJRow[] = [
  { id: 'demo-spj-001', work_order_id: 'WO-2025-0001', process_master_id: 'demo-sp-001', supplier_id: 'demo-sup-002', status: 'Pending', nadcap_expiry_warning: false },
  { id: 'demo-spj-002', work_order_id: 'WO-2025-0002', process_master_id: 'demo-sp-003', supplier_id: 'demo-sup-002', status: 'In Progress', nadcap_expiry_warning: true },
]

// ---------------------------------------------------------------------------
// Tab component
// ---------------------------------------------------------------------------
const TABS = ['Master', 'Jobs'] as const
type TabLabel = (typeof TABS)[number]

interface TabsProps {
  active: TabLabel
  onChange: (tab: TabLabel) => void
}

function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-200 mb-5">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            active === tab
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Process Master Modal
// ---------------------------------------------------------------------------
interface NewProcessModalProps {
  onCreated: () => void
  onClose: () => void
}

function NewProcessModal({ onCreated, onClose }: NewProcessModalProps) {
  const [processCode, setProcessCode] = useState('')
  const [processName, setProcessName] = useState('')
  const [nadcapRequired, setNadcapRequired] = useState('false')
  const [specNumber, setSpecNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!processCode.trim() || !processName.trim()) {
      setError('Process code and name are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await axios.post(MASTER_BASE, {
        process_code: processCode.trim(),
        process_name: processName.trim(),
        nadcap_required: nadcapRequired === 'true',
        spec_number: specNumber || null,
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create process')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Process Code *"
          placeholder="e.g. ANODIZE-HA"
          value={processCode}
          onChange={(e) => setProcessCode(e.target.value)}
        />
        <Input
          label="Process Name *"
          placeholder="e.g. Hard Anodize"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">NADCAP Required</label>
        <Select
          options={[
            { label: 'No', value: 'false' },
            { label: 'Yes', value: 'true' },
          ]}
          value={nadcapRequired}
          onChange={(e) => setNadcapRequired(e.target.value)}
        />
      </div>
      <Input
        label="Specification Number"
        placeholder="e.g. MIL-A-8625 Type III"
        value={specNumber}
        onChange={(e) => setSpecNumber(e.target.value)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
          Create Process
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Process Job Modal
// ---------------------------------------------------------------------------
interface NewJobModalProps {
  onCreated: () => void
  onClose: () => void
}

function NewJobModal({ onCreated, onClose }: NewJobModalProps) {
  const [workOrderId, setWorkOrderId] = useState('')
  const [processMasterId, setProcessMasterId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!processMasterId.trim()) {
      setError('Process master ID is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await axios.post(JOBS_BASE, {
        work_order_id: workOrderId || null,
        process_master_id: processMasterId.trim(),
        supplier_id: supplierId || null,
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        label="Work Order ID"
        placeholder="e.g. WO-2024-001"
        value={workOrderId}
        onChange={(e) => setWorkOrderId(e.target.value)}
      />
      <Input
        label="Process Master ID *"
        placeholder="Paste process master UUID"
        value={processMasterId}
        onChange={(e) => setProcessMasterId(e.target.value)}
      />
      <Input
        label="Supplier ID"
        placeholder="Paste supplier UUID"
        value={supplierId}
        onChange={(e) => setSupplierId(e.target.value)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
          Create Job
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Master Table
// ---------------------------------------------------------------------------
function MasterTable({
  rows,
  loading,
  error,
}: {
  rows: PMRow[]
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Loading processes...</div>
    )
  }
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )
  }
  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No process masters found "" click "New Process" to add one.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Process Code</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Process Name</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">NADCAP</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Specification</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id as string} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                {row.process_code as string}
              </td>
              <td className="px-4 py-3 text-gray-900">{row.process_name as string}</td>
              <td className="px-4 py-3">
                {(row.nadcap_required as boolean) ? (
                  <Badge variant="warning" size="sm">Required</Badge>
                ) : (
                  <Badge variant="default" size="sm">Not Required</Badge>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {(row.spec_number as string | null) ?? '""'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Jobs Table
// ---------------------------------------------------------------------------
function JobsTable({
  rows,
  loading,
  error,
}: {
  rows: PJRow[]
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Loading jobs...</div>
    )
  }
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )
  }
  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No jobs found "" click "New Job" to create one.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Job ID</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Work Order</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Process</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Supplier</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">NADCAP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id as string} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">
                {(row.id as string).slice(0, 8)}"¦
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-800">
                {(row.work_order_id as string | null) ?? '""'}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-800">
                {(row.process_master_id as string).slice(0, 8)}"¦
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {(row.supplier_id as string | null) ?? '""'}
              </td>
              <td className="px-4 py-3">
                <StateMachineBadge state={row.status as string} size="sm" />
              </td>
              <td className="px-4 py-3">
                {(row.nadcap_expiry_warning as boolean) ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                    <AlertTriangle size={12} />
                    Expiry Warning
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function SpecialProcessesPage() {
  const [activeTab, setActiveTab] = useState<TabLabel>('Master')

  const [masters, setMasters] = useState<PMRow[]>([])
  const [mastersLoading, setMastersLoading] = useState(false)
  const [mastersError, setMastersError] = useState<string | null>(null)
  const [mastersIsDemo, setMastersIsDemo] = useState(false)

  const [jobs, setJobs] = useState<PJRow[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [jobsIsDemo, setJobsIsDemo] = useState(false)

  const [showNewProcess, setShowNewProcess] = useState(false)
  const [showNewJob, setShowNewJob] = useState(false)

  const fetchMasters = () => {
    setMastersLoading(true)
    setMastersError(null)
    axios
      .get<PMRow[]>(MASTER_BASE)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setMasters(data)
          setMastersIsDemo(false)
        } else {
          setMasters(DEMO_SP_MASTERS)
          setMastersIsDemo(true)
        }
      })
      .catch(() => {
        setMasters(DEMO_SP_MASTERS)
        setMastersIsDemo(true)
      })
      .finally(() => setMastersLoading(false))
  }

  const fetchJobs = () => {
    setJobsLoading(true)
    setJobsError(null)
    axios
      .get<PJRow[]>(JOBS_BASE)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setJobs(data)
          setJobsIsDemo(false)
        } else {
          setJobs(DEMO_SP_JOBS)
          setJobsIsDemo(true)
        }
      })
      .catch(() => {
        setJobs(DEMO_SP_JOBS)
        setJobsIsDemo(true)
      })
      .finally(() => setJobsLoading(false))
  }

  useEffect(() => {
    fetchMasters()
    fetchJobs()
  }, [])

  const handleTabChange = (tab: TabLabel) => {
    setActiveTab(tab)
    if (tab === 'Master') fetchMasters()
    else fetchJobs()
  }

  return (
    <div className="max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Special Processes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 20 - External process jobs (anodize, paint, NDT, heat treat)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { fetchMasters(); fetchJobs() }}
            icon={<RefreshCw size={14} />}
            title="Refresh"
          />
          {activeTab === 'Master' ? (
            <Button
              variant="primary"
              onClick={() => setShowNewProcess(true)}
              icon={<Plus size={16} />}
            >
              New Process
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setShowNewJob(true)}
              icon={<Plus size={16} />}
            >
              New Job
            </Button>
          )}
        </div>
      </div>

      {/* Tabs + content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Tabs active={activeTab} onChange={handleTabChange} />

        {activeTab === 'Master' && (
          <>
            {mastersIsDemo && <DemoBanner />}
            <MasterTable rows={masters} loading={mastersLoading} error={mastersError} />
          </>
        )}

        {activeTab === 'Jobs' && (
          <>
            {jobsIsDemo && <DemoBanner />}
            <JobsTable rows={jobs} loading={jobsLoading} error={jobsError} />
          </>
        )}
      </div>

      {/* New Process Modal */}
      <Modal
        open={showNewProcess}
        onClose={() => setShowNewProcess(false)}
        title="New Special Process"
        size="md"
      >
        <NewProcessModal
          onCreated={fetchMasters}
          onClose={() => setShowNewProcess(false)}
        />
      </Modal>

      {/* New Job Modal */}
      <Modal
        open={showNewJob}
        onClose={() => setShowNewJob(false)}
        title="New Process Job"
        size="md"
      >
        <NewJobModal
          onCreated={fetchJobs}
          onClose={() => setShowNewJob(false)}
        />
      </Modal>
    </div>
  )
}
