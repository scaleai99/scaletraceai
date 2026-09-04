/**
 * RfqCompliancePanel — OP10 intake compliance, inside the RFQ.
 *
 * Mirrors the reference ERP: before the job proceeds, the customer is screened
 * against restricted-party lists and each part is given an export jurisdiction.
 * These write the same PartyScreening / ExportClassification records the
 * standalone Quality → Export Control page manages, and the ITAR/EAR
 * classification set here is what the drawing-stage access gate enforces.
 */
import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck, Loader2, Plus, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  listScreenings, createScreening, listClassifications, createClassification,
  type Screening, type Classification,
} from '../../api/exportControlApi'

interface Line { id: string; part_number?: string | null; drawing_number?: string | null }

function ResultPill({ v }: { v: string }) {
  const m: Record<string, string> = {
    clear: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'rescreen due': 'bg-amber-50 text-amber-700 border-amber-200',
    hit: 'bg-red-50 text-red-700 border-red-200',
    ITAR: 'bg-red-50 text-red-700 border-red-200',
    EAR: 'bg-amber-50 text-amber-700 border-amber-200',
    'Not controlled': 'bg-gray-50 text-gray-500 border-gray-200',
  }
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m[v] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>{v}</span>
}

export function RfqCompliancePanel({ rfqId, customerId, customerName, lineItems }:
  { rfqId: string; customerId?: string | null; customerName?: string | null; lineItems: Line[] }) {
  const [screening, setScreening] = useState<Screening | null>(null)
  const [byLine, setByLine] = useState<Record<string, Classification>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [classForm, setClassForm] = useState<{ line: string | null; jurisdiction: string; usml: string; eccn: string }>({ line: null, jurisdiction: 'ITAR', usml: '', eccn: '' })

  const load = useCallback(() => {
    if (customerId) listScreenings({ party_type: 'Customer', party_id: customerId }).then((r) => setScreening(r[0] ?? null)).catch(() => {})
    listClassifications().then((rows) => {
      const map: Record<string, Classification> = {}
      for (const c of rows) if (c.linked_id) map[c.linked_id] = map[c.linked_id] ?? c
      setByLine(map)
    }).catch((e) => { const s = (e as { response?: { status?: number } })?.response?.status; if (s === 404) setErr('Export-control service not found (HTTP 404) — restart the backend.') })
  }, [customerId])
  useEffect(() => { load() }, [load])

  const screen = async () => {
    if (!customerId) return
    setBusy('screen'); setErr(null)
    try {
      await createScreening({ party_type: 'Customer', party_id: customerId, party_name: customerName || 'Customer', result: 'clear', screened_date: new Date().toISOString().slice(0, 10) })
      load()
    } catch (e) { setErr((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Screening failed (needs Quality/Admin role).') }
    finally { setBusy(null) }
  }

  const classify = async (line: Line) => {
    setBusy(line.id); setErr(null)
    try {
      await createClassification({
        linked_type: 'RFQLineItem', linked_id: line.id,
        part_ref: line.drawing_number || line.part_number || undefined,
        jurisdiction: classForm.jurisdiction,
        usml_category: classForm.usml || undefined, eccn: classForm.eccn || undefined,
        marking: classForm.jurisdiction === 'ITAR' ? 'This document contains ITAR-controlled technical data.' : undefined,
      })
      setClassForm({ line: null, jurisdiction: 'ITAR', usml: '', eccn: '' })
      load()
    } catch (e) { setErr((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Classification failed (needs Quality/Admin role).') }
    finally { setBusy(null) }
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={17} className="text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">Compliance &amp; Export Control</span>
          <span className="text-xs text-gray-400">OP10 — screen the customer &amp; classify each part before the job proceeds</span>
        </div>
        <Link to="/quality/export-control" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"><ExternalLink size={12} /> Full register</Link>
      </div>
      <div className="px-5 py-4">
        {err && <div className="mb-3 text-xs text-red-600">{err}</div>}

        {/* Customer screening */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Customer:</span>
          <span className="text-sm text-gray-600">{customerName || customerId || '—'}</span>
          {screening ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><ShieldCheck size={13} className="text-emerald-600" /> Screened {screening.screened_date ?? ''} · <ResultPill v={screening.result} /></span>
          ) : (
            <span className="text-xs text-amber-700">Not screened against restricted-party lists</span>
          )}
          <button onClick={screen} disabled={!customerId || busy === 'screen'} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white disabled:opacity-40">
            {busy === 'screen' ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} {screening ? 'Re-screen' : 'Screen customer'}
          </button>
        </div>

        {/* Per-line classification */}
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Part export classification</div>
        {lineItems.length === 0 ? (
          <p className="text-sm text-gray-400">No line items yet — add them in the RFQ Registration stage.</p>
        ) : (
          <div className="space-y-2">
            {lineItems.map((li) => {
              const c = byLine[li.id]
              return (
                <div key={li.id} className="rounded-lg border border-gray-200 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-gray-500">{li.drawing_number || li.part_number || li.id.slice(0, 8)}</span>
                    {c ? <ResultPill v={c.jurisdiction} /> : <span className="text-xs text-amber-700">Unclassified</span>}
                    {c?.usml_category && <span className="text-xs text-gray-500">USML {c.usml_category}</span>}
                    {c?.eccn && <span className="text-xs text-gray-500">ECCN {c.eccn}</span>}
                    {!c && (
                      <button onClick={() => setClassForm((p) => ({ ...p, line: p.line === li.id ? null : li.id }))} className="ml-auto inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <Plus size={12} /> Classify
                      </button>
                    )}
                  </div>
                  {classForm.line === li.id && !c && (
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <select value={classForm.jurisdiction} onChange={(e) => setClassForm((p) => ({ ...p, jurisdiction: e.target.value }))} className="rounded-md border border-gray-300 px-2 py-1 text-xs bg-white">
                        {['ITAR', 'EAR', 'Not controlled'].map((j) => <option key={j} value={j}>{j}</option>)}
                      </select>
                      <input placeholder="USML cat" value={classForm.usml} onChange={(e) => setClassForm((p) => ({ ...p, usml: e.target.value }))} className="w-24 rounded-md border border-gray-300 px-2 py-1 text-xs" />
                      <input placeholder="ECCN" value={classForm.eccn} onChange={(e) => setClassForm((p) => ({ ...p, eccn: e.target.value }))} className="w-24 rounded-md border border-gray-300 px-2 py-1 text-xs" />
                      <button onClick={() => classify(li)} disabled={busy === li.id} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-40">{busy === li.id ? 'Saving…' : 'Save'}</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
