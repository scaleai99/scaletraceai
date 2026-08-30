/**
 * CAPADetailPage - Module 30: CAPA detail view.
 *
 * Features:
 * - Header: CAPA number, status badge, transition buttons
 * - State machine: Open †' Root Cause Analysis †' Action In Progress †' Verification †' Closed
 *                                                      †'__________________________|
 * - Tabs:
 *   1. Root Cause  "" interactive RCA forms (5-Why / Ishikawa / FTA)
 *   2. Actions     "" action tracker table with add/toggle/save
 *   3. Verification "" effectiveness evidence textarea + warning
 *   4. Linked NCR  "" read-only linked NCR panel
 * - Audit trail at bottom
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Loader2, AlertTriangle, Save, Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  StateMachineBadge,
  Button,
  Modal,
  Select,
  AuditTrailPanel,
} from '../../components/ui'
import type { AuditEntry } from '../../components/ui/AuditTrailPanel'
import { formatDate, formatDateTime } from '../../lib/utils'
import {
  getCAPADetail,
  updateCAPA,
  transitionCAPA,
  getNCR,
  CAPA,
  NCR,
} from '../../api/qualityApi'

// ---------------------------------------------------------------------------
// CAPA state machine
// ---------------------------------------------------------------------------
const CAPA_TRANSITIONS: Record<string, string[]> = {
  Open: ['Root Cause Analysis'],
  'Root Cause Analysis': ['Action In Progress'],
  'Action In Progress': ['Verification'],
  Verification: ['Action In Progress', 'Closed'],
  Closed: [],
}

const RCA_METHODS = ['5-Why', 'Ishikawa', 'FTA']

// ---------------------------------------------------------------------------
// Types for RCA data shapes
// ---------------------------------------------------------------------------
interface FiveWhyData {
  why1: string
  why2: string
  why3: string
  why4: string
  why5: string
  root_cause_summary: string
}

interface IshikawaData {
  man: string
  machine: string
  method: string
  material: string
  measurement: string
  environment: string
}

interface FTAData {
  top_event: string
  branches: string
}

interface ActionItem {
  action: string
  responsible: string
  due_date: string
  completed: boolean
}

// ---------------------------------------------------------------------------
// FieldRow helper
// ---------------------------------------------------------------------------
function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <div className="text-sm text-gray-900 mt-0.5">{value ?? <span className="text-gray-400">""</span>}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab bar component
// ---------------------------------------------------------------------------
const TABS = ['Root Cause', 'Actions', 'Verification', 'Linked NCR'] as const
type TabName = (typeof TABS)[number]

interface TabBarProps {
  active: TabName
  onChange: (tab: TabName) => void
  verificationWarning?: boolean
}

function TabBar({ active, onChange, verificationWarning }: TabBarProps) {
  return (
    <div className="flex border-b border-gray-200 gap-1">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative
            ${active === tab
              ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          {tab}
          {tab === 'Verification' && verificationWarning && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle size={10} />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Transition Panel
// ---------------------------------------------------------------------------
interface TransitionPanelProps {
  capa: CAPA
  onTransition: (targetState: string, comment: string) => Promise<void>
  loading: boolean
}

function TransitionPanel({ capa, onTransition, loading }: TransitionPanelProps) {
  const nextStates = CAPA_TRANSITIONS[capa.status] ?? []
  const [comment, setComment] = useState('')
  const [confirmState, setConfirmState] = useState<string | null>(null)

  if (nextStates.length === 0) {
    return (
      <span className="text-xs text-gray-400">CAPA is closed "" no further transitions.</span>
    )
  }

  const handleConfirm = async () => {
    if (!confirmState) return
    await onTransition(confirmState, comment)
    setConfirmState(null)
    setComment('')
  }

  const buttonColor = (state: string) => {
    if (state === 'Closed') return 'border-red-300 text-red-700 hover:bg-red-50'
    if (state === 'Verification') return 'border-green-300 text-green-700 hover:bg-green-50'
    if (state === 'Action In Progress') return 'border-blue-300 text-blue-700 hover:bg-blue-50'
    return 'border-amber-300 text-amber-700 hover:bg-amber-50'
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Transition to:</span>
        {nextStates.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => { setConfirmState(s); setComment('') }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${buttonColor(s)}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ChevronRight size={12} />
            {s}
          </button>
        ))}
        {loading && <Loader2 size={14} className="animate-spin text-amber-600" />}
      </div>

      <Modal
        open={!!confirmState}
        onClose={() => setConfirmState(null)}
        title={`Transition to "${confirmState}"`}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Moving CAPA{' '}
            <span className="font-mono font-semibold">{capa.capa_number}</span>{' '}
            from <StateMachineBadge state={capa.status} size="sm" /> to{' '}
            <StateMachineBadge state={confirmState ?? ''} size="sm" />.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add a comment for the audit trail..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setConfirmState(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={loading} onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Root Cause Tab "" 5-Why
// ---------------------------------------------------------------------------
interface FiveWhyFormProps {
  data: FiveWhyData
  onChange: (data: FiveWhyData) => void
}

function FiveWhyForm({ data, onChange }: FiveWhyFormProps) {
  const field = (key: keyof FiveWhyData, label: string, placeholder?: string) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={data[key]}
        onChange={(e) => onChange({ ...data, [key]: e.target.value })}
        rows={2}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {field('why1', 'Why 1', 'Why did the problem occur?')}
      {field('why2', 'Why 2', 'Why did that happen?')}
      {field('why3', 'Why 3', 'Why did that happen?')}
      {field('why4', 'Why 4', 'Why did that happen?')}
      {field('why5', 'Why 5', 'Why did that happen?')}
      {field('root_cause_summary', 'Root Cause Summary', 'Summarise the identified root cause...')}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root Cause Tab "" Ishikawa (Fishbone)
// ---------------------------------------------------------------------------
interface IshikawaFormProps {
  data: IshikawaData
  onChange: (data: IshikawaData) => void
}

const ISHIKAWA_CATEGORIES: { key: keyof IshikawaData; label: string }[] = [
  { key: 'man', label: 'Man (People)' },
  { key: 'machine', label: 'Machine (Equipment)' },
  { key: 'method', label: 'Method (Process)' },
  { key: 'material', label: 'Material' },
  { key: 'measurement', label: 'Measurement' },
  { key: 'environment', label: 'Environment' },
]

function IshikawaForm({ data, onChange }: IshikawaFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ISHIKAWA_CATEGORIES.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <textarea
            value={data[key]}
            onChange={(e) => onChange({ ...data, [key]: e.target.value })}
            rows={3}
            placeholder={`Causes related to ${label.split(' ')[0].toLowerCase()}...`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root Cause Tab "" FTA (Fault Tree Analysis)
// ---------------------------------------------------------------------------
interface FTAFormProps {
  data: FTAData
  onChange: (data: FTAData) => void
}

function FTAForm({ data, onChange }: FTAFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Top Event</label>
        <textarea
          value={data.top_event}
          onChange={(e) => onChange({ ...data, top_event: e.target.value })}
          rows={2}
          placeholder="Describe the top-level undesired event..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Branches{' '}
          <span className="text-xs text-gray-400 font-normal">
            (describe contributing causes and gates)
          </span>
        </label>
        <textarea
          value={data.branches}
          onChange={(e) => onChange({ ...data, branches: e.target.value })}
          rows={6}
          placeholder={`E.g.:\n- OR Gate: Sensor failure / Software bug\n  - AND Gate: Power interruption + Control logic error`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-mono"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root Cause Tab "" wrapper
// ---------------------------------------------------------------------------
interface RootCauseTabProps {
  capa: CAPA
  onSave: (updates: { root_cause_method: string | null; root_cause_data: Record<string, unknown> | null }) => Promise<void>
  saving: boolean
}

const EMPTY_FIVE_WHY: FiveWhyData = { why1: '', why2: '', why3: '', why4: '', why5: '', root_cause_summary: '' }
const EMPTY_ISHIKAWA: IshikawaData = { man: '', machine: '', method: '', material: '', measurement: '', environment: '' }
const EMPTY_FTA: FTAData = { top_event: '', branches: '' }

function RootCauseTab({ capa, onSave, saving }: RootCauseTabProps) {
  const [method, setMethod] = useState(capa.root_cause_method ?? '')
  const [fiveWhyData, setFiveWhyData] = useState<FiveWhyData>({
    ...EMPTY_FIVE_WHY,
    ...(capa.root_cause_data as Partial<FiveWhyData> | null ?? {}),
  })
  const [ishikawaData, setIshikawaData] = useState<IshikawaData>({
    ...EMPTY_ISHIKAWA,
    ...(capa.root_cause_data as Partial<IshikawaData> | null ?? {}),
  })
  const [ftaData, setFtaData] = useState<FTAData>({
    ...EMPTY_FTA,
    ...(capa.root_cause_data as Partial<FTAData> | null ?? {}),
  })

  const handleSave = async () => {
    const data: FiveWhyData | IshikawaData | FTAData | Record<string, never> =
      method === '5-Why' ? fiveWhyData :
      method === 'Ishikawa' ? ishikawaData :
      method === 'FTA' ? ftaData : {}

    await onSave({ root_cause_method: method || null, root_cause_data: Object.keys(data).length ? (data as Record<string, unknown>) : null })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RCA Method</label>
        <div className="w-48">
          <Select
            options={[
              { label: '"" select method ""', value: '' },
              ...RCA_METHODS.map((m) => ({ label: m, value: m })),
            ]}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
        </div>
      </div>

      {method === '5-Why' && (
        <FiveWhyForm data={fiveWhyData} onChange={setFiveWhyData} />
      )}
      {method === 'Ishikawa' && (
        <IshikawaForm data={ishikawaData} onChange={setIshikawaData} />
      )}
      {method === 'FTA' && (
        <FTAForm data={ftaData} onChange={setFtaData} />
      )}
      {!method && (
        <p className="text-sm text-gray-400 py-4 text-center">
          Select a root cause analysis method above to begin.
        </p>
      )}

      {method && (
        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={handleSave}
            icon={<Save size={14} />}
          >
            Save RCA
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Actions Tab
// ---------------------------------------------------------------------------
interface ActionsTabProps {
  capa: CAPA
  onSave: (actions: ActionItem[]) => Promise<void>
  saving: boolean
}

const EMPTY_ACTION: ActionItem = { action: '', responsible: '', due_date: '', completed: false }

function ActionsTab({ capa, onSave, saving }: ActionsTabProps) {
  const [actions, setActions] = useState<ActionItem[]>(
    (capa.actions as ActionItem[] | null) ?? []
  )

  const addRow = () => setActions((prev) => [...prev, { ...EMPTY_ACTION }])

  const updateRow = (index: number, patch: Partial<ActionItem>) => {
    setActions((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  const removeRow = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {actions.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          No actions yet "" click "Add Action" to add one.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-2 pr-3 text-xs text-gray-500 font-medium uppercase tracking-wide w-2/5">
                  Action
                </th>
                <th className="pb-2 pr-3 text-xs text-gray-500 font-medium uppercase tracking-wide w-1/5">
                  Responsible
                </th>
                <th className="pb-2 pr-3 text-xs text-gray-500 font-medium uppercase tracking-wide w-1/5">
                  Due Date
                </th>
                <th className="pb-2 pr-3 text-xs text-gray-500 font-medium uppercase tracking-wide text-center w-1/12">
                  Done
                </th>
                <th className="pb-2 text-xs text-gray-500 font-medium uppercase tracking-wide w-1/12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actions.map((action, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={action.action}
                      onChange={(e) => updateRow(i, { action: e.target.value })}
                      placeholder="Describe action..."
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={action.responsible}
                      onChange={(e) => updateRow(i, { responsible: e.target.value })}
                      placeholder="Name / role"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="date"
                      value={action.due_date}
                      onChange={(e) => updateRow(i, { due_date: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={action.completed}
                      onChange={(e) => updateRow(i, { completed: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      aria-label="Remove action"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={addRow}
          icon={<Plus size={14} />}
        >
          Add Action
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          onClick={() => onSave(actions)}
          icon={<Save size={14} />}
        >
          Save Actions
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Verification Tab
// ---------------------------------------------------------------------------
interface VerificationTabProps {
  capa: CAPA
  onSave: (evidence: string) => Promise<void>
  saving: boolean
}

function VerificationTab({ capa, onSave, saving }: VerificationTabProps) {
  const [evidence, setEvidence] = useState(capa.effectiveness_evidence ?? '')
  const showWarning = capa.status === 'Verification' && !evidence.trim()

  return (
    <div className="space-y-4">
      {showWarning && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            This CAPA is in <strong>Verification</strong> status but effectiveness evidence has not
            been recorded yet. Please document the evidence before closing.
          </span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Effectiveness Evidence
        </label>
        <textarea
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          rows={8}
          placeholder="Describe how you verified the corrective action was effective (e.g. re-inspection results, monitoring data, follow-up audit findings)..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          onClick={() => onSave(evidence)}
          icon={<Save size={14} />}
        >
          Save Evidence
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Linked NCR Tab
// ---------------------------------------------------------------------------
interface LinkedNCRTabProps {
  ncrId: string | null
}

function LinkedNCRTab({ ncrId }: LinkedNCRTabProps) {
  const navigate = useNavigate()
  const [ncr, setNcr] = useState<NCR | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ncrId) return
    setLoading(true)
    getNCR(ncrId)
      .then(setNcr)
      .catch((err) => setError(err?.response?.data?.detail ?? 'Failed to load NCR'))
      .finally(() => setLoading(false))
  }, [ncrId])

  if (!ncrId) {
    return <p className="text-sm text-gray-400 py-4">No NCR linked to this CAPA.</p>
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
        <Loader2 size={14} className="animate-spin" />
        Loading NCR...
      </div>
    )
  }

  if (error || !ncr) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error ?? 'NCR not found'}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-red-700">{ncr.ncr_number}</span>
          <StateMachineBadge state={ncr.status} size="sm" />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/quality/ncrs/${ncr.id}`)}
        >
          View NCR
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <FieldRow label="Part Number" value={ncr.part_number} />
        <FieldRow label="Detection Stage" value={ncr.detection_stage} />
        <FieldRow label="Disposition" value={ncr.disposition} />
        <FieldRow label="Created" value={formatDate(ncr.created_at)} />
        {ncr.closed_at && <FieldRow label="Closed" value={formatDate(ncr.closed_at)} />}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Description</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{ncr.description}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function CAPADetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [capa, setCapa] = useState<CAPA | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [savingRCA, setSavingRCA] = useState(false)
  const [savingActions, setSavingActions] = useState(false)
  const [savingEvidence, setSavingEvidence] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabName>('Root Cause')
  const [auditEntries] = useState<AuditEntry[]>([])

  const fetchData = useCallback(() => {
    if (!id) return
    setLoading(true)
    getCAPADetail(id)
      .then((data) => setCapa(data))
      .catch((err) => setError(err?.response?.data?.detail ?? 'Failed to load CAPA'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTransition = async (targetState: string, comment: string) => {
    if (!capa) return
    setTransitionLoading(true)
    setTransitionError(null)
    try {
      const updated = await transitionCAPA(capa.id, { target_state: targetState, comment: comment || null })
      setCapa(updated)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setTransitionError(e?.response?.data?.detail ?? e?.message ?? 'Transition failed')
    } finally {
      setTransitionLoading(false)
    }
  }

  const flashSuccess = (msg: string) => {
    setSaveSuccess(msg)
    setTimeout(() => setSaveSuccess(null), 2500)
  }

  const handleSaveRCA = async (updates: { root_cause_method: string | null; root_cause_data: Record<string, unknown> | null }) => {
    if (!capa) return
    setSavingRCA(true)
    try {
      const updated = await updateCAPA(capa.id, updates)
      setCapa(updated)
      flashSuccess('RCA saved')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      alert(e?.response?.data?.detail ?? e?.message ?? 'Save failed')
    } finally {
      setSavingRCA(false)
    }
  }

  const handleSaveActions = async (actions: ActionItem[]) => {
    if (!capa) return
    setSavingActions(true)
    try {
      const updated = await updateCAPA(capa.id, { actions: actions as unknown as Record<string, unknown>[] })
      setCapa(updated)
      flashSuccess('Actions saved')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      alert(e?.response?.data?.detail ?? e?.message ?? 'Save failed')
    } finally {
      setSavingActions(false)
    }
  }

  const handleSaveEvidence = async (evidence: string) => {
    if (!capa) return
    setSavingEvidence(true)
    try {
      const updated = await updateCAPA(capa.id, { effectiveness_evidence: evidence })
      setCapa(updated)
      flashSuccess('Evidence saved')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      alert(e?.response?.data?.detail ?? e?.message ?? 'Save failed')
    } finally {
      setSavingEvidence(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-amber-600">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading CAPA...
      </div>
    )
  }

  if (error || !capa) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? 'CAPA not found'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/quality/capas')}
          icon={<ArrowLeft size={14} />}
        >
          Back to CAPAs
        </Button>
      </div>
    )
  }

  const verificationWarning =
    capa.status === 'Verification' && !capa.effectiveness_evidence?.trim()

  // ---------------------------------------------------------------------------
  // RCA method badge for header
  // ---------------------------------------------------------------------------
  const RCA_VARIANT: Record<string, 'warning' | 'info' | 'default'> = {
    '5-Why': 'warning',
    Ishikawa: 'info',
    FTA: 'default',
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/quality/capas')}
          className="text-gray-500 hover:text-gray-700 p-1 rounded"
          aria-label="Back to CAPAs"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{capa.capa_number}</h1>
              <StateMachineBadge state={capa.status} />
              {capa.root_cause_method && (
                <Badge
                  variant={RCA_VARIANT[capa.root_cause_method] ?? 'default'}
                  size="sm"
                >
                  {capa.root_cause_method}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-0.5 font-medium">{capa.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Opened {formatDate(capa.created_at)}
              {capa.target_date && ` · Target ${formatDate(capa.target_date)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 shadow-lg animate-in fade-in">
          œ" {saveSuccess}
        </div>
      )}

      {/* Workflow / transitions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Workflow</h2>
        {transitionError && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {transitionError}
          </div>
        )}
        <TransitionPanel
          capa={capa}
          onTransition={handleTransition}
          loading={transitionLoading}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-4">
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            verificationWarning={verificationWarning}
          />
        </div>
        <div className="p-5">
          {activeTab === 'Root Cause' && (
            <RootCauseTab
              capa={capa}
              onSave={handleSaveRCA}
              saving={savingRCA}
            />
          )}
          {activeTab === 'Actions' && (
            <ActionsTab
              capa={capa}
              onSave={handleSaveActions}
              saving={savingActions}
            />
          )}
          {activeTab === 'Verification' && (
            <VerificationTab
              capa={capa}
              onSave={handleSaveEvidence}
              saving={savingEvidence}
            />
          )}
          {activeTab === 'Linked NCR' && (
            <LinkedNCRTab ncrId={capa.ncr_id} />
          )}
        </div>
      </div>

      {/* CAPA metadata summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">CAPA Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FieldRow label="CAPA Number" value={<span className="font-mono font-semibold">{capa.capa_number}</span>} />
          <FieldRow label="Status" value={<StateMachineBadge state={capa.status} size="sm" />} />
          <FieldRow
            label="RCA Method"
            value={
              capa.root_cause_method
                ? <Badge variant={RCA_VARIANT[capa.root_cause_method] ?? 'default'} size="sm">{capa.root_cause_method}</Badge>
                : null
            }
          />
          <FieldRow label="Target Date" value={capa.target_date ? formatDate(capa.target_date) : null} />
          <FieldRow label="Linked NCR" value={capa.ncr_id ?? null} />
          <FieldRow label="Created" value={formatDateTime(capa.created_at)} />
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AuditTrailPanel
          entries={[
            {
              user: 'System',
              action: `CAPA ${capa.capa_number} created with status: Open`,
              timestamp: capa.created_at,
            },
            ...auditEntries,
          ]}
          title="Audit Trail"
        />
      </div>
    </div>
  )
}
