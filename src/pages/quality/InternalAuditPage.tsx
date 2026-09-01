import { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, Plus } from 'lucide-react'
import { listAudits, createAudit, updateAudit, type InternalAudit } from '../../api/qmsInvExtApi'

const TYPES = ['Process', 'Product', 'System']
export function InternalAuditPage() {
  const [rows, setRows] = useState<InternalAudit[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ audit_type: 'Process', area: '', auditor: '', planned_date: '' })
  const load = useCallback(() => { listAudits().then(setRows).catch(e => setErr(String(e))) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createAudit(f); setF({ audit_type: 'Process', area: '', auditor: '', planned_date: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const setStatus = async (a: InternalAudit, status: string) => { await updateAudit(a.id, { status }); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Internal Audits (AS9100)</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <select className="border rounded px-2 py-1 text-sm" value={f.audit_type} onChange={e => setF({ ...f, audit_type: e.target.value })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <input className="border rounded px-2 py-1 text-sm w-48" placeholder="Area / process" value={f.area} onChange={e => setF({ ...f, area: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-36" placeholder="Auditor" value={f.auditor} onChange={e => setF({ ...f, auditor: e.target.value })} />
        <input type="date" className="border rounded px-2 py-1 text-sm" value={f.planned_date} onChange={e => setF({ ...f, planned_date: e.target.value })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Schedule</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Audit</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Area</th><th className="text-left px-3 py-2">Auditor</th><th className="text-left px-3 py-2">Planned</th><th className="text-left px-3 py-2">Findings (Maj/Min/Obs)</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(a => <tr key={a.id} className="border-t border-gray-100"><td className="px-3 py-1.5 font-mono">{a.audit_no}</td><td className="px-3 py-1.5">{a.audit_type}</td><td className="px-3 py-1.5">{a.area}</td><td className="px-3 py-1.5">{a.auditor}</td><td className="px-3 py-1.5">{a.planned_date}</td><td className="px-3 py-1.5">{a.findings_major}/{a.findings_minor}/{a.observations}</td><td className="px-3 py-1.5">{a.status}</td>
          <td className="px-3 py-1.5 text-right">{a.status !== 'Closed' && <button onClick={() => setStatus(a, a.status === 'Planned' ? 'InProgress' : 'Closed')} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">{a.status === 'Planned' ? 'Start' : 'Close'}</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No audits yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default InternalAuditPage
