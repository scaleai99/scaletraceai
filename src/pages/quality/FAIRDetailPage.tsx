/**
 * FAIRDetailPage - Module 22: FAIR detail view.
 *
 * Features:
 * - Header: FAIR number, status badge, "Approve" button (Draft only)
 * - Three tabs: Form 1 (header info), Form 2 (BOM table), Form 3 (characteristics)
 * - AI Populate button †' POST /api/v1/fai/{id}/ai-populate
 * - Save and Approve wired to backend
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Sparkles, CheckCircle } from 'lucide-react'
import { apiClient } from '../../api/axiosClient'
import {
  StateMachineBadge,
  Button,
  Input,
  AuditTrailPanel,
} from '../../components/ui'
import type { AuditEntry } from '../../components/ui/AuditTrailPanel'
import { formatDate, formatDateTime } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BOMItem {
  item_no: number | string
  part_no: string
  description: string
  qty: number | string
}

interface Characteristic {
  balloon_no: string | number
  characteristic_type: string
  nominal: string | number
  upper_tol: string | number
  lower_tol: string | number
  measured: string | number | null
  result: string | null
}

interface FAIRDetail {
  id: string
  fair_number: string
  so_id: string | null
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  status: string
  form2_bom: BOMItem[] | null
  form3_characteristics: Characteristic[] | null
  created_at: string
}

const FAIR_BASE = '/api/v1/fairs'

// ---------------------------------------------------------------------------
// Tab component
// ---------------------------------------------------------------------------
const TABS = ['Form 1 - Header', 'Form 2 - BOM', 'Form 3 - Characteristics'] as const
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
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            active === tab
              ? 'border-blue-600 text-blue-700'
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
// Form 1 - Header Info
// ---------------------------------------------------------------------------
interface Form1Props {
  fair: FAIRDetail
  isDraft: boolean
  onSaved: (updated: FAIRDetail) => void
}

function Form1({ fair, isDraft, onSaved }: Form1Props) {
  const [partNumber, setPartNumber] = useState(fair.part_number ?? '')
  const [drawingNumber, setDrawingNumber] = useState(fair.drawing_number ?? '')
  const [drawingRevision, setDrawingRevision] = useState(fair.drawing_revision ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const { data } = await apiClient.patch<FAIRDetail>(`${FAIR_BASE}/${fair.id}`, {
        part_number: partNumber || null,
        drawing_number: drawingNumber || null,
        drawing_revision: drawingRevision || null,
      })
      onSaved(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">FAIR Number</p>
          <p className="font-mono text-sm font-semibold text-gray-900">{fair.fair_number}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sales Order</p>
          <p className="text-sm text-gray-900">{fair.so_id ?? '""'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
          <StateMachineBadge state={fair.status} size="sm" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
          <p className="text-sm text-gray-500">{formatDateTime(fair.created_at)}</p>
        </div>
      </div>

      <hr className="border-gray-100" />

      {isDraft ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Part Number"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
            />
            <Input
              label="Drawing Number"
              value={drawingNumber}
              onChange={(e) => setDrawingNumber(e.target.value)}
            />
            <Input
              label="Drawing Revision"
              value={drawingRevision}
              onChange={(e) => setDrawingRevision(e.target.value)}
              maxLength={10}
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>
              Save
            </Button>
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} /> Saved
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Part Number</p>
            <p className="text-sm text-gray-900">{fair.part_number ?? '""'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Drawing Number</p>
            <p className="font-mono text-sm text-gray-900">{fair.drawing_number ?? '""'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Drawing Revision</p>
            <p className="text-sm text-gray-900">{fair.drawing_revision ?? '""'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form 2 - BOM
// ---------------------------------------------------------------------------
function Form2({ bom }: { bom: BOMItem[] | null }) {
  if (!bom || bom.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No BOM data available. Use AI Populate to extract from drawing.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Item No</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Part No</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bom.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-xs text-gray-700">{item.item_no}</td>
              <td className="px-4 py-2 font-mono text-xs text-gray-800">{item.part_no}</td>
              <td className="px-4 py-2 text-gray-800">{item.description}</td>
              <td className="px-4 py-2 text-gray-700">{item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form 3 - Characteristics
// ---------------------------------------------------------------------------
function Form3({ chars }: { chars: Characteristic[] | null }) {
  if (!chars || chars.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No characteristics data available. Use AI Populate to extract from drawing.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Balloon</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Nominal</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">+Tol</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">-Tol</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Measured</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {chars.map((c, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{c.balloon_no}</td>
              <td className="px-3 py-2 text-gray-800">{c.characteristic_type}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-800">{c.nominal}</td>
              <td className="px-3 py-2 font-mono text-xs text-green-700">+{c.upper_tol}</td>
              <td className="px-3 py-2 font-mono text-xs text-red-700">-{c.lower_tol}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{c.measured ?? '""'}</td>
              <td className="px-3 py-2">
                {c.result === 'Pass' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Pass</span>
                ) : c.result === 'Fail' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Fail</span>
                ) : (
                  <span className="text-gray-400">""</span>
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
export function FAIRDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [fair, setFair] = useState<FAIRDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabLabel>('Form 1 - Header')
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [auditEntries] = useState<AuditEntry[]>([])

  const fetchFAIR = useCallback(() => {
    if (!id) return
    setLoading(true)
    apiClient
      .get<FAIRDetail>(`${FAIR_BASE}/${id}`)
      .then(({ data }) => setFair(data))
      .catch((err) => setError(err?.response?.data?.detail ?? 'Failed to load FAIR'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchFAIR()
  }, [fetchFAIR])

  const handleApprove = async () => {
    if (!fair) return
    setApproving(true)
    setApproveError(null)
    try {
      const { data } = await apiClient.post<FAIRDetail>(`${FAIR_BASE}/${fair.id}/approve`)
      setFair(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setApproveError(e?.response?.data?.detail ?? e?.message ?? 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  const handleAiPopulate = async () => {
    if (!fair) return
    setAiLoading(true)
    setAiError(null)
    try {
      const { data } = await apiClient.post<FAIRDetail>(`${FAIR_BASE}/${fair.id}/ai-populate`)
      setFair(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setAiError(e?.response?.data?.detail ?? e?.message ?? 'AI populate failed')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-blue-600">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading FAIR...
      </div>
    )
  }

  if (error || !fair) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? 'FAIR not found'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/quality/fairs')}
          icon={<ArrowLeft size={14} />}
        >
          Back to FAIRs
        </Button>
      </div>
    )
  }

  const isDraft = fair.status === 'Draft'

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/quality/fairs')}
          className="text-gray-500 hover:text-gray-700 p-1 rounded"
          aria-label="Back to FAIRs"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{fair.fair_number}</h1>
              <StateMachineBadge state={fair.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Created {formatDate(fair.created_at)}
              {fair.part_number && ` · ${fair.part_number}`}
              {fair.drawing_number && ` · DWG ${fair.drawing_number}`}
              {fair.drawing_revision && ` Rev ${fair.drawing_revision}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              onClick={handleAiPopulate}
              disabled={aiLoading}
            >
              AI Populate
            </Button>
            {isDraft && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle size={14} />}
                onClick={handleApprove}
                loading={approving}
              >
                Approve
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error banners */}
      {approveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {approveError}
        </div>
      )}
      {aiError && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          {aiError}
        </div>
      )}

      {/* Tabbed content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Tabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'Form 1 - Header' && (
          <Form1
            fair={fair}
            isDraft={isDraft}
            onSaved={(updated) => setFair(updated)}
          />
        )}

        {activeTab === 'Form 2 - BOM' && (
          <Form2 bom={fair.form2_bom} />
        )}

        {activeTab === 'Form 3 - Characteristics' && (
          <Form3 chars={fair.form3_characteristics} />
        )}
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AuditTrailPanel
          entries={[
            {
              user: 'System',
              action: `FAIR ${fair.fair_number} created with status: Draft`,
              timestamp: fair.created_at,
            },
            ...auditEntries,
          ]}
          title="Audit Trail"
        />
      </div>
    </div>
  )
}
