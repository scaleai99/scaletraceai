/**
 * FeasibilityPanel (OP50) — runs the feasibility engine for an RFQ and shows
 * per-characteristic ok/watch/risk verdicts (tolerance vs machine capability,
 * calibration, special processes) plus the AS9100D clause 8.2.3 checklist.
 */
import { useCallback, useEffect, useState } from 'react'
import { Gauge, Play, Loader2, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { runFeasibility, getFeasibility, type FeasibilityAssessment } from '../../api/feasibilityApi'

const V: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  watch: 'bg-amber-50 text-amber-700 border-amber-200',
  risk: 'bg-red-50 text-red-700 border-red-200',
  attention: 'bg-amber-50 text-amber-700 border-amber-200',
}
function VBadge({ v }: { v: string }) {
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${V[v] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>{v}</span>
}
const errMsg = (e: unknown, f: string) => {
  const ax = e as { response?: { status?: number; data?: { detail?: string } } }
  return ax?.response?.status === 404 ? 'Feasibility service not found (HTTP 404) — restart the backend.' : (ax?.response?.data?.detail ?? f)
}

export function FeasibilityPanel({ rfqId }: { rfqId: string }) {
  const [a, setA] = useState<FeasibilityAssessment | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    getFeasibility(rfqId).then(setA).catch(() => {})
  }, [rfqId])
  useEffect(() => { load() }, [load])

  const run = async () => {
    setBusy(true); setErr(null)
    try { setA(await runFeasibility(rfqId)) }
    catch (e) { setErr(errMsg(e, 'Feasibility run failed.')) }
    finally { setBusy(false) }
  }

  const OverallIcon = a?.overall_verdict === 'ok' ? CheckCircle2 : a?.overall_verdict === 'risk' ? ShieldAlert : AlertTriangle

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Gauge size={17} className="text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">Feasibility &amp; AS9100D 8.2.3</span>
          <span className="text-xs text-gray-400">tolerance vs capability, calibration, special processes</span>
          {a && <span className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${V[a.overall_verdict]}`}><OverallIcon size={12} />{a.overall_verdict}</span>}
        </div>
        <button onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
          {busy ? <Loader2 size={13} className="animate-spin" /> : a ? <RefreshCw size={13} /> : <Play size={13} />} {a ? 'Re-run' : 'Run feasibility'}
        </button>
      </div>
      <div className="px-5 py-4">
        {err && <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{err}</div>}
        {!a ? (
          <p className="text-sm text-gray-400">No assessment yet. Click <b>Run feasibility</b> — it scores the RFQ's characteristics against machine capability and runs the AS9100D 8.2.3 requirements review.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600">{a.summary}</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
              <table className="w-full text-xs">
                <thead><tr className="text-[10px] uppercase text-gray-400 border-b border-gray-200"><th className="text-left p-2.5">Area</th><th className="text-left p-2.5">Verdict</th><th className="text-left p-2.5">Note</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(a.checks ?? []).map((c, i) => (
                    <tr key={i}><td className="p-2.5 font-medium text-gray-700">{c.area}</td><td className="p-2.5"><VBadge v={c.verdict} /></td><td className="p-2.5 text-gray-600">{c.note}</td></tr>
                  ))}
                  {!a.checks?.length && <tr><td colSpan={3} className="p-4 text-center text-gray-400">No checks produced.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">AS9100D clause 8.2.3 — requirements review</div>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-50">
              {(a.as9100_checklist ?? []).map((it, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                  <span className="text-gray-700"><span className="font-mono text-gray-400 mr-2">{it.clause}</span>{it.item}</span>
                  <VBadge v={it.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
