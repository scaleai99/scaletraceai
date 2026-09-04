/**
 * CapabilityPanel - OP120 measurement capability.
 *
 * Two things the plan table cannot show:
 *  1. WHY a gauge was chosen (or why nothing in the Measurement master can hold
 *     the band) - the 10:1 resolution rule, the gauge-R&R limit, calibration.
 *  2. Cpk from REAL repeated readings. One reading is not a distribution, so
 *     with n<2 this says so instead of printing a confident number.
 */
import { useCallback, useEffect, useState } from 'react'
import { Gauge, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  listMeasurements, addMeasurement, getGaugeOptions,
  type Capability, type Measurement, type GaugeSelection, type InspectionItem,
} from '../../api/inspectionApi'

interface Props {
  item: InspectionItem
  onChanged?: () => void
}

const VERDICT_CLS: Record<string, string> = {
  capable: 'text-emerald-700',
  marginal: 'text-amber-700',
  'not capable': 'text-red-700',
}

export function CapabilityPanel({ item, onChanged }: Props) {
  const [rows, setRows] = useState<Measurement[]>([])
  const [cap, setCap] = useState<Capability | null>(null)
  const [gauges, setGauges] = useState<GaugeSelection | null>(null)
  const [value, setValue] = useState('')
  const [serial, setSerial] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listMeasurements(item.id)
      .then((r) => { setRows(r.measurements); setCap(r.capability) })
      .catch(() => setError('Could not load measurements.'))
    getGaugeOptions(item.id).then(setGauges).catch(() => setGauges(null))
  }, [item.id])

  useEffect(() => { load() }, [load])

  const add = async () => {
    if (!value.trim()) return
    setBusy(true); setError(null)
    try {
      await addMeasurement(item.id, Number(value), serial.trim() || undefined)
      setValue(''); setSerial('')
      load(); onChanged?.()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setError(ax?.response?.data?.detail ?? 'Could not record the reading.')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
      {/* Gauge selection and why */}
      {gauges && (
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <Gauge className="h-3 w-3" /> Gauge selection
          </div>
          <p className={`text-xs ${gauges.capability_ok ? 'text-gray-700' : 'text-red-700'}`}>{gauges.note}</p>
          {gauges.evaluated.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-[11px] text-indigo-600">
                All {gauges.evaluated.length} instruments judged
              </summary>
              <ul className="mt-1 space-y-0.5 text-[11px]">
                {gauges.evaluated.map((g) => (
                  <li key={g.instrument_id} className={g.eligible ? 'text-emerald-800' : 'text-gray-500'}>
                    <span className="font-mono">{g.instrument_code}</span>{' '}
                    {g.eligible
                      ? <>eligible &middot; {g.resolution_ratio ?? '-'}:1 &middot; R&amp;R {g.gauge_rr_pct ?? '-'}%</>
                      : <>rejected &middot; {g.rejections.join('; ')}</>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Readings */}
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Measured pieces ({rows.length})
        </div>
        {rows.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {rows.map((m) => (
              <span key={m.id}
                className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${
                  m.in_tolerance ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                 : 'border-red-300 bg-red-50 text-red-800'}`}>
                {m.serial_no ? `${m.serial_no}: ` : ''}{m.measured_value}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="serial"
            className="w-24 rounded border border-gray-300 px-2 py-1 text-xs" />
          <input value={value} onChange={(e) => setValue(e.target.value)} type="number" step="any"
            placeholder="measured value"
            className="w-36 rounded border border-gray-300 px-2 py-1 text-xs font-mono" />
          <button type="button" onClick={add} disabled={busy || !value.trim()}
            className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            <Plus className="h-3 w-3" /> {busy ? 'Saving...' : 'Add reading'}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
      </div>

      {/* Capability */}
      {cap && (
        <div className="border-t border-gray-200 pt-2">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Capability</div>
          {cap.cpk != null ? (
            <div className="flex flex-wrap items-baseline gap-3 text-xs">
              <span className={`font-mono text-base font-bold ${VERDICT_CLS[cap.verdict || ''] || ''}`}>
                Cpk {cap.cpk.toFixed(2)}
              </span>
              <span className={VERDICT_CLS[cap.verdict || ''] || 'text-gray-600'}>
                {cap.verdict === 'capable'
                  ? <CheckCircle2 className="mr-1 inline h-3 w-3" />
                  : <AlertTriangle className="mr-1 inline h-3 w-3" />}
                {cap.verdict}
              </span>
              <span className="font-mono text-gray-500">n={cap.n} mean={cap.mean} sigma={cap.sigma}</span>
            </div>
          ) : (
            <p className="text-xs text-gray-600">{cap.note}</p>
          )}
          {cap.cpk != null && <p className="mt-0.5 text-xs text-gray-600">{cap.note}</p>}
        </div>
      )}
    </div>
  )
}
