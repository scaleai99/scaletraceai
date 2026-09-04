/**
 * InspectionPlanPanel (OP110-120) — balloons the characteristic set into a
 * numbered inspection plan and records measured results with in/out-of-tol.
 */
import { Fragment, useCallback, useEffect, useState } from 'react'
import { CapabilityPanel } from './CapabilityPanel'
import { ClipboardCheck, Loader2, ListChecks, CheckCircle2, XCircle } from 'lucide-react'
import { generatePlan, getPlan, recordMeasurement, type InspectionPlan } from '../../api/inspectionApi'

interface LineItemLite { id: string; part_number?: string | null; drawing_number?: string | null }
const errMsg = (e: unknown, f: string) => {
  const ax = e as { response?: { status?: number; data?: { detail?: string } } }
  return ax?.response?.status === 404 ? 'Inspection service not found (HTTP 404) — restart the backend.' : (ax?.response?.data?.detail ?? f)
}

export function InspectionPlanPanel({ lineItem }: { lineItem: LineItemLite }) {
  const [plan, setPlan] = useState<InspectionPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => { getPlan(lineItem.id).then(setPlan).catch(() => {}) }, [lineItem.id])
  useEffect(() => { load(); setDraft({}) }, [load])

  const gen = async () => {
    setBusy(true); setErr(null)
    try { setPlan(await generatePlan(lineItem.id)) }
    catch (e) { setErr(errMsg(e, 'Could not generate the inspection plan (extract & sign the characteristic set first).')) }
    finally { setBusy(false) }
  }
  const measure = async (itemId: string) => {
    const v = draft[itemId]
    if (v === undefined || v === '') return
    setBusy(true); setErr(null)
    try { setPlan(await recordMeasurement(itemId, Number(v))); setDraft((p) => ({ ...p, [itemId]: '' })) }
    catch (e) { setErr(errMsg(e, 'Could not record the measurement.')) }
    finally { setBusy(false) }
  }

  const tolText = (it: InspectionPlan['items'][number]) => {
    if (it.nominal != null) return `${it.nominal}${it.upper_tol != null || it.lower_tol != null ? ` (+${it.upper_tol ?? 0}/${it.lower_tol ?? 0})` : ''}${it.unit ? ' ' + it.unit : ''}`
    if (it.gdt_symbol) return `${it.gdt_symbol} ${it.upper_tol ?? ''}${it.datums && it.datums.length ? ' |' + (it.datums as string[]).join('|') : ''}`
    return it.requirement ?? '—'
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck size={17} className="text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">Inspection Plan &amp; Ballooning</span>
          <span className="text-xs text-gray-400">AS9102 balloons from the characteristic set</span>
          {plan && <span className="ml-1 text-xs text-gray-500">{plan.conforming_count}/{plan.measured_count} conforming · {plan.item_count} balloons</span>}
        </div>
        <button onClick={gen} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <ListChecks size={13} />} {plan ? 'Regenerate' : 'Generate inspection plan'}
        </button>
      </div>
      <div className="px-5 py-4">
        {err && <div className="mb-3 text-xs text-red-600">{err}</div>}
        {!plan ? (
          <p className="text-sm text-gray-400">No inspection plan yet. Click <b>Generate inspection plan</b> to balloon this part's characteristic set into a numbered AS9102 plan, then record measured results.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-[10px] uppercase text-gray-400 border-b border-gray-200">
                <th className="p-2 text-left">#</th><th className="p-2 text-left">Feature</th><th className="p-2 text-left">Requirement</th><th className="p-2 text-left">Method</th><th className="p-2 text-left">Gauge</th><th className="p-2 text-left">Measured</th><th className="p-2 text-left">Result</th><th className="p-2 text-left">Cpk</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {plan.items.map((it) => (
                  <Fragment key={it.id}>
                  <tr className={it.is_key ? 'bg-rose-50/30' : ''}>
                    <td className="p-2 font-semibold text-gray-500">{it.balloon_no}{it.is_key && <span className="ml-1 rounded bg-rose-100 px-1 text-[9px] text-rose-600">KC</span>}</td>
                    <td className="p-2 text-gray-700">{it.feature_ref ?? it.char_type}</td>
                    <td className="p-2 font-mono text-gray-600">{tolText(it)}</td>
                    <td className="p-2 text-gray-500">{it.method}</td>
                    <td className="p-2">
                      {it.instrument
                        ? <span className="font-mono text-gray-700">{it.instrument}</span>
                        : <span className="text-amber-600" title={it.capability_note ?? undefined}>none capable</span>}
                      {it.capability_ok === false && <span className="ml-1 text-red-600">!</span>}
                    </td>
                    <td className="p-2">
                      <input value={draft[it.id] ?? (it.measured_value ?? '')} onChange={(e) => setDraft((p) => ({ ...p, [it.id]: e.target.value }))}
                        onBlur={() => measure(it.id)} onKeyDown={(e) => { if (e.key === 'Enter') measure(it.id) }}
                        placeholder="value" className="w-24 rounded border border-gray-300 px-2 py-0.5 text-xs" />
                    </td>
                    <td className="p-2">
                      {it.in_tolerance == null ? <span className="text-gray-400">—</span>
                        : it.in_tolerance ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={13} /> In tol</span>
                        : <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={13} /> Out</span>}
                    </td>
                    <td className="p-2">
                      <button type="button" onClick={() => setExpanded(expanded === it.id ? null : it.id)}
                        className="font-mono text-indigo-600 hover:underline">
                        {it.cpk != null ? it.cpk.toFixed(2) : (it.measurement_count ? `n=${it.measurement_count}` : "add")}
                      </button>
                    </td>
                  </tr>
                  {expanded === it.id && (
                    <tr>
                      <td colSpan={8} className="p-2">
                        <CapabilityPanel item={it} onChanged={load} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
