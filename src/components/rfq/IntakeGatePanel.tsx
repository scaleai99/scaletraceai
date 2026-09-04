/**
 * IntakeGatePanel - OP10 intake gate.
 *
 * Opening the drawing is itself the controlled act: the classification decides
 * who in the building may look at it. So the backend refuses drawing upload and
 * characteristic extraction (409) until the customer is screened and the part
 * is classified. This panel shows that state plainly, with the specific
 * reasons - never a bare "blocked".
 */
import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert, RefreshCw, Lock } from 'lucide-react'
import { getIntakeGate, type IntakeGate } from '../../api/rfqQueriesApi'

interface Props {
  rfqId: string
  lineItemId?: string | null
  onChange?: (gate: IntakeGate) => void
}

export function IntakeGatePanel({ rfqId, lineItemId, onChange }: Props) {
  const [gate, setGate] = useState<IntakeGate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!rfqId) return
    setLoading(true); setError(null)
    getIntakeGate(rfqId, lineItemId ?? undefined)
      .then((g) => { setGate(g); onChange?.(g) })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        setError(ax?.response?.status === 404
          ? 'Intake-gate service not found (404) - the backend needs a restart.'
          : ax?.response?.data?.detail ?? 'Could not read the intake gate.')
        setGate(null)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId, lineItemId])

  useEffect(() => { load() }, [load])

  if (loading && !gate) return <p className="py-3 text-sm text-gray-400">Checking intake gate...</p>
  if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
  if (!gate) return null

  const ok = gate.open
  return (
    <div className={`rounded-xl border p-4 ${ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {ok ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />}
          <div>
            <div className={`text-sm font-semibold ${ok ? 'text-emerald-900' : 'text-red-900'}`}>
              {ok ? 'OP10 intake complete - technical data may be released'
                  : 'OP10 intake incomplete - technical data is withheld'}
            </div>
            {!ok && (
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-red-900">
                {gate.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        </div>
        <button type="button" onClick={load}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
          <RefreshCw className="h-3 w-3" /> Re-check
        </button>
      </div>

      <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2"
           style={{ borderColor: ok ? '#a7f3d0' : '#fecaca' }}>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Restricted-party screening</div>
          {gate.screening ? (
            <div className="text-sm text-gray-800">
              <span className="font-medium">{gate.screening.party_name || 'Customer'}</span>{' '}
              <span className={gate.screening.result === 'clear' ? 'text-emerald-700' : 'text-red-700'}>
                {gate.screening.result}
              </span>
              <div className="text-xs text-gray-500">
                {gate.screening.screened_date || 'no date'}
                {gate.screening.stale && <span className="ml-1 text-amber-700">(stale &gt; {gate.rescreen_days}d)</span>}
              </div>
            </div>
          ) : <div className="text-sm text-gray-400">Not screened</div>}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Export classification</div>
          {gate.classification ? (
            <div className="text-sm text-gray-800">
              <span className="font-medium">{gate.classification.jurisdiction}</span>
              {gate.classification.usml_category && <span> &middot; {gate.classification.usml_category}</span>}
              {gate.classification.eccn && <span> &middot; {gate.classification.eccn}</span>}
              <div className="text-xs text-gray-500">
                {gate.classification.determined_by || 'unattributed'} &middot; {gate.classification.determined_date || 'no date'}
              </div>
            </div>
          ) : <div className="flex items-center gap-1 text-sm text-gray-400"><Lock className="h-3 w-3" /> Not classified</div>}
        </div>
      </div>
    </div>
  )
}
