/**
 * CostingSheetPanel - Module 09: AI Costing Engine UI.
 *
 * Renders the costing sheet for an RFQ line item as a breakdown table with
 * AI-calculated values, override inputs, and a "Version History" drawer.
 *
 * Layout
 * ------
 * ---------------------------------------------------------------
 * -  Category        - AI Value () - Override Input -  Badge  -
 * -  Material        -  1,00,000   - [_________]   -         -
 * -  Machining       -  50,000     - [_________]   - Manual  -
 * -  Special Process -  20,000     - [_________]   -         -
 * -  Masking         -  5,000      - [_________]   -         -
 * -  Overhead        -  20,700     - [_________]   -         -
 * -  Profit Margin % -  15.00%      - [_________]   -         -
 * ----------------------------------------------------------------
 * -                      Unit Price:  X,XX,XXX.XX              -
 * ---------------------------------------------------------------
 *
 * Properties
 * ----------
 * - AI values from ``ai_calculated`` are shown read-only in the second column.
 * - Override inputs are editable; when changed an amber "Manual Override" badge
 *   appears in the row.
 * - Unit price is always the sum of all components - recomputed client-side for
 *   immediate feedback and confirmed by the server on PATCH.
 *  "Approve" button is gated on ``isQualityManager``.
 *  "Version History" drawer lists all past costing sheet versions.
 *
 * Props
 * -----
 * rfqLineItemId   - UUID of the line item to cost
 * sheetId         - UUID of an existing sheet (null = none yet)
 * isQualityManager- whether the current user can approve
 * onApproved      - called after a successful approve
 */

import { useState, useEffect, useCallback } from 'react'
import { Calculator, ChevronDown, ChevronRight, History } from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatINR } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { INRInput } from '../ui/INRInput'
import { Modal } from '../ui/Modal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostingSheet {
  id: string
  rfq_line_item_id: string
  version: number
  material_cost: string | null
  machining_cost: string | null
  special_process_cost: string | null
  masking_cost: string | null
  overhead_cost: string | null
  profit_margin_pct: string
  unit_price: string | null
  cost_breakdown: Record<string, string> | null
  ai_calculated: Record<string, string> | null
  manual_overrides: Record<string, string> | null
  status: string
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

// Cost field definition used to drive the table rows
interface CostField {
  key: keyof CostingSheetOverrides
  label: string
  isPercent?: boolean
}

interface CostingSheetOverrides {
  material_cost: number | null
  machining_cost: number | null
  special_process_cost: number | null
  masking_cost: number | null
  overhead_cost: number | null
  profit_margin_pct: number | null
}

const COST_FIELDS: CostField[] = [
  { key: 'material_cost', label: 'Material Cost' },
  { key: 'machining_cost', label: 'Machining Cost' },
  { key: 'special_process_cost', label: 'Special Process Cost' },
  { key: 'masking_cost', label: 'Masking Cost' },
  { key: 'overhead_cost', label: 'Overhead Cost' },
  { key: 'profit_margin_pct', label: 'Profit Margin', isPercent: true },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(v: string | null | undefined): number {
  if (v == null) return 0
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

/** Recompute unit_price client-side for immediate feedback (Property 4). */
function computeUnitPrice(overrides: CostingSheetOverrides): number {
  const mat = overrides.material_cost ?? 0
  const mac = overrides.machining_cost ?? 0
  const spc = overrides.special_process_cost ?? 0
  const msk = overrides.masking_cost ?? 0
  const ovh = overrides.overhead_cost ?? 0
  const pct = overrides.profit_margin_pct ?? 15
  const subtotal = mat + mac + spc + msk
  const margin = Math.round(subtotal * pct) / 100
  return mat + mac + spc + msk + ovh + margin
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface CostingSheetPanelProps {
  rfqLineItemId: string
  sheetId?: string | null
  isQualityManager?: boolean
  onApproved?: () => void
}

export function CostingSheetPanel({
  rfqLineItemId,
  sheetId: initialSheetId,
  isQualityManager = false,
  onApproved,
}: CostingSheetPanelProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [expanded, setExpanded] = useState(false)
  const [sheet, setSheet] = useState<CostingSheet | null>(null)
  const [sheetId, setSheetId] = useState<string | null>(initialSheetId ?? null)
  const [versions, setVersions] = useState<CostingSheet[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local override state
  const [overrides, setOverrides] = useState<CostingSheetOverrides>({
    material_cost: null,
    machining_cost: null,
    special_process_cost: null,
    masking_cost: null,
    overhead_cost: null,
    profit_margin_pct: null,
  })

  // ---------------------------------------------------------------------------
  // Load sheet
  // ---------------------------------------------------------------------------
  const loadSheet = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/costing-sheets/${id}`)
      if (!res.ok) throw new Error(await res.text())
      const data: CostingSheet = await res.json()
      setSheet(data)
      // Initialise overrides from current sheet values
      setOverrides({
        material_cost: toNum(data.material_cost) || null,
        machining_cost: toNum(data.machining_cost) || null,
        special_process_cost: toNum(data.special_process_cost) || null,
        masking_cost: toNum(data.masking_cost) || null,
        overhead_cost: toNum(data.overhead_cost) || null,
        profit_margin_pct: toNum(data.profit_margin_pct) || null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load costing sheet')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadVersionHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/costing-sheets/by-line-item/${rfqLineItemId}`
      )
      if (!res.ok) return
      const data: CostingSheet[] = await res.json()
      setVersions(data)
    } catch {
      // Non-critical - version history is optional
    }
  }, [rfqLineItemId])

  useEffect(() => {
    if (sheetId) loadSheet(sheetId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId])

  // ---------------------------------------------------------------------------
  // Run AI costing
  // ---------------------------------------------------------------------------
  const handleCalculate = async () => {
    setCalculating(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/costing-sheets/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfq_line_item_id: rfqLineItemId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: CostingSheet = await res.json()
      setSheetId(data.id)
      setSheet(data)
      setOverrides({
        material_cost: toNum(data.material_cost) || null,
        machining_cost: toNum(data.machining_cost) || null,
        special_process_cost: toNum(data.special_process_cost) || null,
        masking_cost: toNum(data.masking_cost) || null,
        overhead_cost: toNum(data.overhead_cost) || null,
        profit_margin_pct: toNum(data.profit_margin_pct) || null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run costing')
    } finally {
      setCalculating(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Save overrides (PATCH)
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!sheetId) return
    setSaving(true)
    setError(null)
    try {
      // Only send non-null overrides that differ from AI values
      const body: Partial<CostingSheetOverrides> = {}
      for (const field of COST_FIELDS) {
        const v = overrides[field.key]
        if (v !== null) {
          ;(body as Record<string, number | null>)[field.key] = v
        }
      }
      const res = await fetch(`/api/v1/costing-sheets/${sheetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: CostingSheet = await res.json()
      setSheet(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save overrides')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Approve
  // ---------------------------------------------------------------------------
  const handleApprove = async () => {
    if (!sheetId) return
    setApproving(true)
    setError(null)
    try {
      // Save first
      await handleSave()
      const res = await fetch(`/api/v1/costing-sheets/${sheetId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver_id: '00000000-0000-0000-0000-000000000000',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: CostingSheet = await res.json()
      setSheet(data)
      onApproved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve')
    } finally {
      setApproving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Version history modal open
  // ---------------------------------------------------------------------------
  const handleOpenHistory = async () => {
    await loadVersionHistory()
    setHistoryOpen(true)
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const isApproved = sheet?.status === 'Approved'
  const aiValues = sheet?.ai_calculated ?? {}
  const manualOverrides = sheet?.manual_overrides ?? {}

  /** Is the current override value different from the AI value? */
  const isManualOverride = (key: keyof CostingSheetOverrides): boolean => {
    return key in manualOverrides
  }

  // Live unit price for immediate feedback
  const liveUnitPrice = computeUnitPrice(overrides)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Panel */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          aria-expanded={expanded}
        >
          <span className="flex items-center gap-3">
            <Calculator size={18} className="text-amber-600 shrink-0" />
            <span className="font-semibold text-gray-900 text-sm">
              AI Costing Sheet
            </span>
            {isApproved && <Badge variant="success" size="sm">Approved</Badge>}
            {!isApproved && sheet && (
              <Badge variant="warning" size="sm">Draft - v{sheet.version}</Badge>
            )}
          </span>
          <span className="flex items-center gap-3">
            {sheet && (
              <span className="text-sm font-semibold text-gray-700">
                {formatINR(toNum(sheet.unit_price))}
              </span>
            )}
            {expanded ? (
              <ChevronDown size={16} className="text-gray-500 shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-gray-500 shrink-0" />
            )}
          </span>
        </button>

        {/* Body */}
        {expanded && (
          <div className="p-5 space-y-5">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* No sheet yet */}
            {!sheet && !loading && (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-gray-500">
                  No costing sheet for this line item yet.
                </p>
                <Button
                  onClick={handleCalculate}
                  loading={calculating}
                  icon={<Calculator size={14} />}
                >
                  Run AI Costing
                </Button>
              </div>
            )}

            {loading && (
              <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
            )}

            {sheet && (
              <div className="space-y-4">
                {/* Breakdown table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-left w-[35%]">
                          Category
                        </th>
                        <th className="px-4 py-2.5 text-right w-[25%]">
                          AI Value
                        </th>
                        <th className="px-4 py-2.5 text-right w-[28%]">
                          {isApproved ? 'Final Value' : 'Override Input'}
                        </th>
                        <th className="px-4 py-2.5 text-center w-[12%]" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {COST_FIELDS.map((field) => {
                        const aiVal = toNum(
                          aiValues[field.key] ?? (sheet as unknown as Record<string, string | null>)[field.key]
                        )
                        const isOverridden = isManualOverride(field.key)

                        return (
                          <tr key={field.key} className="hover:bg-gray-50">
                            {/* Label */}
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {field.label}
                            </td>

                            {/* AI Value */}
                            <td className="px-4 py-3 text-right text-gray-500 font-mono text-xs tabular-nums">
                              {field.isPercent
                                ? `${aiVal.toFixed(2)}%`
                                : formatINR(aiVal)}
                            </td>

                            {/* Override input / display */}
                            <td className="px-4 py-3">
                              {isApproved ? (
                                <span className="block text-right font-mono text-xs tabular-nums text-gray-900">
                                  {field.isPercent
                                    ? `${(overrides[field.key] ?? aiVal).toFixed(2)}%`
                                    : formatINR(overrides[field.key] ?? aiVal)}
                                </span>
                              ) : field.isPercent ? (
                                <input
                                  type="number"
                                  value={overrides[field.key] ?? aiVal}
                                  onChange={(e) => {
                                    const n = parseFloat(e.target.value)
                                    setOverrides((prev) => ({
                                      ...prev,
                                      [field.key]: isNaN(n) ? null : n,
                                    }))
                                  }}
                                  className="w-full text-right text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
                                  step="0.01"
                                  min="0"
                                  aria-label={`Override ${field.label}`}
                                />
                              ) : (
                                <INRInput
                                  value={overrides[field.key]}
                                  onChange={(v) =>
                                    setOverrides((prev) => ({
                                      ...prev,
                                      [field.key]: v,
                                    }))
                                  }
                                  aria-label={`Override ${field.label}`}
                                />
                              )}
                            </td>

                            {/* Manual Override badge */}
                            <td className="px-4 py-3 text-center">
                              {isOverridden && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
                                  Manual
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>

                    {/* Total row */}
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-300">
                        <td
                          colSpan={2}
                          className="px-4 py-3 text-sm font-bold text-gray-900"
                        >
                          Unit Price
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              'text-base font-bold tabular-nums',
                              isApproved
                                ? 'text-green-700'
                                : 'text-amber-700'
                            )}
                          >
                            {formatINR(
                              isApproved
                                ? toNum(sheet.unit_price)
                                : liveUnitPrice
                            )}
                          </span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {!isApproved && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleCalculate}
                        loading={calculating}
                        icon={<Calculator size={14} />}
                      >
                        Re-run AI Costing
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleSave}
                        loading={saving}
                      >
                        Save Overrides
                      </Button>
                      {isQualityManager && (
                        <Button onClick={handleApprove} loading={approving}>
                          Approve
                        </Button>
                      )}
                    </>
                  )}
                  {/* Version history */}
                  <button
                    onClick={handleOpenHistory}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                    type="button"
                  >
                    <History size={13} />
                    Version History
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Version History Modal */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Costing Sheet Version History"
        size="lg"
      >
        {versions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No versions found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-4 py-2.5">Version</th>
                  <th className="px-4 py-2.5 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 text-right">Margin %</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Created</th>
                  <th className="px-4 py-2.5">Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {versions.map((v) => {
                  const overrideCount = Object.keys(
                    v.manual_overrides ?? {}
                  ).length
                  return (
                    <tr
                      key={v.id}
                      className={cn(
                        'hover:bg-gray-50',
                        v.id === sheetId ? 'bg-amber-50' : ''
                      )}
                    >
                      <td className="px-4 py-3 font-medium">
                        v{v.version}
                        {v.id === sheetId && (
                          <span className="ml-1.5 text-[10px] text-amber-600 font-semibold">
                            current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {formatINR(toNum(v.unit_price))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {toNum(v.profit_margin_pct).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            v.status === 'Approved' ? 'success' : 'warning'
                          }
                          size="sm"
                        >
                          {v.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(v.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {overrideCount > 0 ? (
                          <Badge variant="warning" size="sm">
                            {overrideCount} override{overrideCount > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">AI only</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  )
}
