/**
 * CustomerPODetailPage - Module 11: Customer PO detail view.
 *
 * Features:
 * - Header: CPO number, PO number, customer, status stepper
 * - Difference Report panel: table showing field | Quotation Value | PO Value |
 *   Severity (badge: red=Critical, orange=Major, grey=Minor)
 * - State stepper showing CPO workflow stages
 * - Convert to Sales Order button (only when at Engineering/Technical Review stage)
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Package,
  Upload,
} from 'lucide-react'
import { Badge, Button, FileUpload, StateMachineBadge } from '../../components/ui'
import { formatDate, formatDateTime } from '../../lib/utils'
import {
  convertCPOtoSO,
  CustomerPO,
  DiffReportItem,
  getCustomerPO,
  transitionCustomerPO,
  uploadPODocument,
} from '../../api/salesApi'

// ---------------------------------------------------------------------------
// CPO workflow states (linear)
// ---------------------------------------------------------------------------
const CPO_LINEAR_STATES = [
  'Received',
  'Registration',
  'Document Upload',
  'Contract Review-2',
  'Configuration Review-2',
  'Engineering/Technical Review',
  'Sales Order',
]

const CPO_TRANSITIONS: Record<string, string[]> = {
  Received: ['Registration'],
  Registration: ['Document Upload'],
  'Document Upload': ['Contract Review-2'],
  'Contract Review-2': ['Configuration Review-2'],
  'Configuration Review-2': ['Engineering/Technical Review'],
  'Engineering/Technical Review': ['Sales Order'],
  'Sales Order': [],
}

// ---------------------------------------------------------------------------
// Status stepper
// ---------------------------------------------------------------------------
interface StepperProps {
  currentStatus: string
}

function CPOStepper({ currentStatus }: StepperProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {CPO_LINEAR_STATES.map((state, i) => {
          const currentIdx = CPO_LINEAR_STATES.indexOf(currentStatus)
          const isCompleted = i < currentIdx
          const isCurrent = state === currentStatus
          const isFuture = i > currentIdx

          return (
            <div key={state} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    isCurrent
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={14} />
                  ) : isCurrent ? (
                    <Circle size={14} className="fill-current" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-center leading-tight text-[9px] font-medium px-0.5 ${
                    isCurrent
                      ? 'text-amber-700'
                      : isCompleted
                        ? 'text-green-700'
                        : 'text-gray-400'
                  }`}
                  style={{ maxWidth: 76 }}
                >
                  {state}
                </span>
              </div>

              {i < CPO_LINEAR_STATES.length - 1 && (
                <div
                  className={`h-0.5 w-4 shrink-0 mx-0.5 ${
                    i < CPO_LINEAR_STATES.indexOf(currentStatus)
                      ? 'bg-green-400'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Severity badge
// ---------------------------------------------------------------------------
function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 border-red-300',
    Major: 'bg-orange-100 text-orange-700 border-orange-300',
    Minor: 'bg-gray-100 text-gray-600 border-gray-300',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        styles[severity] ?? styles['Minor']
      }`}
    >
      {severity === 'Critical' && <AlertTriangle size={10} />}
      {severity}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Difference Report panel
// ---------------------------------------------------------------------------
interface DiffReportPanelProps {
  diffReport: DiffReportItem[] | null
}

function DiffReportPanel({ diffReport }: DiffReportPanelProps) {
  if (!diffReport || diffReport.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg border border-green-200 px-4 py-3 flex items-center gap-2 text-sm text-green-700">
        <CheckCircle2 size={16} />
        No differences found - CPO matches quotation.
      </div>
    )
  }

  const critCount = diffReport.filter((d) => d.severity === 'Critical').length
  const majCount = diffReport.filter((d) => d.severity === 'Major').length
  const minCount = diffReport.filter((d) => d.severity === 'Minor').length

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-3 mb-3">
        {critCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
            <AlertTriangle size={11} />
            {critCount} Critical
          </span>
        )}
        {majCount > 0 && (
          <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
            {majCount} Major
          </span>
        )}
        {minCount > 0 && (
          <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
            {minCount} Minor
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Line #</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quotation Value</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PO Value</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {diffReport
              .sort((a, b) => {
                const order = { Critical: 0, Major: 1, Minor: 2 }
                return (order[a.severity as keyof typeof order] ?? 2) -
                       (order[b.severity as keyof typeof order] ?? 2)
              })
              .map((item, idx) => (
                <tr
                  key={idx}
                  className={
                    item.severity === 'Critical'
                      ? 'bg-red-50/40'
                      : item.severity === 'Major'
                        ? 'bg-orange-50/40'
                        : 'bg-white'
                  }
                >
                  <td className="px-3 py-2 text-gray-500">{item.line_number ?? '-'}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{item.field}</td>
                  <td className="px-3 py-2 text-gray-600 font-mono text-xs">{item.quotation_value ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-800 font-mono text-xs">{item.po_value ?? '-'}</td>
                  <td className="px-3 py-2">
                    <SeverityBadge severity={item.severity} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function CustomerPODetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [cpo, setCpo] = useState<CustomerPO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [uploadingPO, setUploadingPO] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fetchCPO = useCallback(() => {
    if (!id) return
    setLoading(true)
    getCustomerPO(id)
      .then(setCpo)
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load CPO')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchCPO()
  }, [fetchCPO])

  const handleTransition = async (targetState: string) => {
    if (!cpo) return
    setActionLoading(targetState)
    setActionError(null)
    try {
      const updated = await transitionCustomerPO(cpo.id, targetState)
      setCpo(updated)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Transition failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUploadPO = async (file: File) => {
    if (!cpo) return
    setUploadingPO(true)
    setUploadError(null)
    try {
      const result = await uploadPODocument(cpo.id, file)
      fetchCPO()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setUploadError(e?.response?.data?.detail ?? e?.message ?? 'Upload failed')
    } finally {
      setUploadingPO(false)
    }
  }

  const handleConvertToSO = async () => {
    if (!cpo) return
    setActionLoading('convert')
    setActionError(null)
    try {
      const result = await convertCPOtoSO(cpo.id)
      navigate(`/sales/sales-orders/${result.sales_order_id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setActionError(typeof d === 'string' ? d : e?.message ?? 'Conversion failed')
    } finally {
      setActionLoading(null)
    }
  }

  // ---- Loading / error states ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-amber-600">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading Customer PO...
      </div>
    )
  }

  if (error || !cpo) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? 'Customer PO not found'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate('/sales/customer-pos')}
          icon={<ArrowLeft size={14} />}
        >
          Back to Customer POs
        </Button>
      </div>
    )
  }

  const nextStates = CPO_TRANSITIONS[cpo.status] ?? []
  const canConvertToSO = cpo.status === 'Engineering/Technical Review'

  return (
    <div className="max-w-7xl space-y-6">
      {/* -- Page header -------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/sales/customer-pos')}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
          aria-label="Back to Customer POs"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {cpo.internal_ref}
            </h1>
            <Badge variant="default" size="sm">
              {cpo.po_number}
            </Badge>
            <StateMachineBadge state={cpo.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            PO Date: {formatDate(cpo.po_date)}  Created {formatDate(cpo.created_at)}
          </p>
        </div>
      </div>

      {/* -- Status Stepper ------------------------------------------ */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Workflow Progress</h2>
        <CPOStepper currentStatus={cpo.status} />

        {/* Transition buttons */}
        {nextStates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {actionError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {actionError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Advance to:</span>
              {nextStates.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!!actionLoading}
                  onClick={() => s !== 'Sales Order' && handleTransition(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === s ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : null}
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* -- CPO Details --------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">CPO Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Internal Ref</p>
            <p className="font-mono font-semibold text-gray-900 mt-0.5">{cpo.internal_ref}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Customer PO #</p>
            <p className="font-semibold text-gray-900 mt-0.5">{cpo.po_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">PO Date</p>
            <p className="text-gray-900 mt-0.5">{formatDate(cpo.po_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Terms</p>
            <p className="text-gray-900 mt-0.5">
              {cpo.payment_terms != null ? `${cpo.payment_terms} days` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery Terms</p>
            <p className="text-gray-900 mt-0.5">{cpo.delivery_terms ?? '-'}</p>
          </div>
          {cpo.quotation_id && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Linked Quotation</p>
              <button
                type="button"
                onClick={() => navigate(`/sales/quotations/${cpo.quotation_id}`)}
                className="text-amber-600 hover:text-amber-800 text-sm font-medium mt-0.5"
              >
                View Quotation "
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -- PO Document Upload -------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">PO Document</h2>
          {cpo.po_pdf_path && (
            <Badge variant="success" size="sm">Document attached</Badge>
          )}
        </div>

        {cpo.po_pdf_path ? (
          <p className="text-xs text-gray-500 font-mono">{cpo.po_pdf_path}</p>
        ) : (
          <div>
            {uploadingPO ? (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Loader2 size={14} className="animate-spin" />
                Uploading PO document...
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Upload the customer PO PDF to trigger AI comparison against the linked quotation.
                </p>
                <FileUpload
                  accept=".pdf"
                  maxSizeMB={50}
                  onFile={handleUploadPO}
                  label="Upload PO PDF"
                  className="max-w-xs"
                />
              </div>
            )}
            {uploadError && (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        )}
      </div>

      {/* -- Difference Report --------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Difference Report
          <span className="ml-2 text-xs font-normal text-gray-400">
            (CPO vs Quotation)
          </span>
        </h2>
        <DiffReportPanel diffReport={cpo.difference_report ?? null} />
      </div>

      {/* -- Convert to SO ------------------------------------------- */}
      {canConvertToSO && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-amber-800">
                Ready to create Sales Order
              </h2>
              <p className="text-xs text-amber-700 mt-1">
                This CPO has completed Engineering/Technical Review. You can now create
                a Sales Order.
              </p>
            </div>
            <Button
              variant="primary"
              loading={actionLoading === 'convert'}
              onClick={handleConvertToSO}
              icon={<Package size={14} />}
            >
              Convert to Sales Order
            </Button>
          </div>
        </div>
      )}

      {/* -- Line Items ---------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Line Items ({(cpo.line_items ?? []).length})
          </h2>
        </div>
        {(cpo.line_items ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No line items on this CPO.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part No.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Drawing No.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rev</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cpo.line_items.map((li, idx) => (
                  <tr key={li.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-2 text-xs text-gray-400 font-semibold">{li.line_number}</td>
                    <td className="px-4 py-2 text-gray-800">{li.part_number ?? '-'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">{li.drawing_number ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-600">{li.drawing_revision ?? '-'}</td>
                    <td className="px-4 py-2 text-right">
                      {li.quantity != null ? li.quantity.toLocaleString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {li.agreed_unit_price != null
                        ? `${Number(li.agreed_unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {li.delivery_date ? formatDate(li.delivery_date) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
