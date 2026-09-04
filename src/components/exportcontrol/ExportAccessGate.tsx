/**
 * ExportAccessGate — the ITAR/EAR deemed-export control on a controlled drawing.
 *
 * Pick the person who wants to view the drawing; the backend access-check
 * (22 CFR 120.62) decides: US person -> full; TAA-named foreign person under an
 * active agreement -> allowed with disclosure logged; anyone else -> DENIED and
 * the drawing link is withheld. Every check is written to the export access log.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldAlert, ShieldCheck, ShieldX, Lock, Loader2, ExternalLink } from 'lucide-react'
import { apiClient } from '../../api/axiosClient'
import {
  accessCheck, listClassifications,
  type Classification, type AccessDecision,
} from '../../api/exportControlApi'

interface LineItemLite {
  id: string
  drawing_pdf_path?: string | null
  drawing_number?: string | null
  part_number?: string | null
}
interface Emp { id: string; full_name?: string; emp_code?: string; export_auth?: string | null; us_person?: boolean | null; nationality?: string | null }

const fileName = (p?: string | null) => (p ? p.replace(/\\/g, '/').split('/').pop() : '')

export function ExportAccessGate({ rfqId, lineItem }: { rfqId: string; lineItem: LineItemLite }) {
  const [emps, setEmps] = useState<Emp[]>([])
  const [viewer, setViewer] = useState('')
  const [cls, setCls] = useState<Classification | null>(null)
  const [decision, setDecision] = useState<AccessDecision | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    setErr(null)
    apiClient.get<Emp[]>('/api/v1/hr/employees', { params: { limit: 200 } })
      .then((r) => setEmps(r.data)).catch(() => setEmps([]))
    listClassifications({ linked_id: lineItem.id })
      .then((rows) => setCls(rows[0] ?? null))
      .catch(() => setCls(null))
  }, [lineItem.id])
  useEffect(() => { load(); setDecision(null); setViewer('') }, [load])

  const check = async () => {
    if (!viewer) { setErr('Select the person requesting access.'); return }
    setBusy(true); setErr(null)
    try {
      const d = await accessCheck({
        person_id: viewer, linked_type: 'RFQLineItem', linked_id: lineItem.id,
        what: `Open drawing ${lineItem.drawing_number ?? lineItem.part_number ?? ''}`.trim(),
      })
      setDecision(d)
    } catch (e) {
      const ax = e as { response?: { status?: number; data?: { detail?: string } } }
      setErr(ax?.response?.status === 404
        ? 'Export-control service not found (HTTP 404) — restart the backend to load it.'
        : (ax?.response?.data?.detail ?? 'Access check failed.'))
    } finally { setBusy(false) }
  }

  const controlled = cls && cls.jurisdiction !== 'Not controlled'
  const viewerEmp = useMemo(() => emps.find((e) => e.id === viewer), [emps, viewer])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        <ShieldAlert size={17} className="text-indigo-600" />
        <span className="text-sm font-semibold text-gray-800">Export Control</span>
        <span className="text-xs text-gray-400">deemed-export access to controlled technical data</span>
      </div>
      <div className="px-5 py-4">
        {/* Classification banner */}
        {cls === null ? (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            This part is not classified yet. Record its jurisdiction on the <b>Quality → Export Control</b> page; until then access is treated as uncontrolled.
          </div>
        ) : controlled ? (
          <div className={`mb-4 rounded-lg border px-3 py-2.5 text-xs ${cls.jurisdiction === 'ITAR' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <div className="font-semibold">{cls.jurisdiction} controlled{cls.usml_category ? ` — USML ${cls.usml_category}` : ''}{cls.eccn ? ` — ECCN ${cls.eccn}` : ''}</div>
            {cls.marking && <div className="mt-1 italic">{cls.marking}</div>}
            {cls.authority && <div className="mt-0.5 opacity-80">{cls.authority}</div>}
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Not export-controlled — open access.</div>
        )}

        {err && <div className="mb-3 text-xs text-red-600">{err}</div>}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Person requesting access</label>
            <select value={viewer} onChange={(e) => { setViewer(e.target.value); setDecision(null) }}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
              <option value="">Select employee…</option>
              {emps.map((e) => (
                <option key={e.id} value={e.id}>
                  {(e.full_name || e.emp_code)}{e.export_auth ? ` — ${e.us_person ? 'US person' : e.export_auth}` : ''}
                </option>
              ))}
            </select>
            {viewerEmp && (
              <p className="mt-1 text-[11px] text-gray-400">
                {viewerEmp.nationality ?? '—'} · auth: {viewerEmp.us_person ? 'US person / full' : (viewerEmp.export_auth || 'none')}{viewerEmp.export_auth === 'taa' ? ' (TAA)' : ''}
              </p>
            )}
          </div>
          <button onClick={check} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Check access &amp; open
          </button>
        </div>

        {/* Decision */}
        {decision && (
          <div className={`mt-4 rounded-xl border px-4 py-3 ${decision.allow ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${decision.allow ? 'text-emerald-700' : 'text-red-700'}`}>
              {decision.allow ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
              {decision.allow ? `Access granted — ${decision.level}` : 'Access denied — deemed export prevented'}
            </div>
            <div className="mt-1 text-xs text-gray-600">{decision.reason}</div>
            {decision.allow ? (
              lineItem.drawing_pdf_path ? (
                <a href={`/uploads/${fileName(lineItem.drawing_pdf_path)}`} target="_blank" rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                  <ExternalLink size={13} /> Open drawing: {fileName(lineItem.drawing_pdf_path)}
                </a>
              ) : <div className="mt-2 text-xs text-gray-400">No drawing file uploaded for this line.</div>
            ) : (
              <div className="mt-2 text-xs text-red-600">The drawing is withheld. This access attempt has been recorded in the export access log.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
