import { useEffect, useState, useCallback } from 'react'
import { Network, Plus } from 'lucide-react'
import { listEdi, createEdi, processEdi, type EDIMessage } from '../../api/integrationApi'
const DOC_TYPES = ['PO', 'ASN', 'Invoice', 'Ack', 'Forecast']
export function EdiPortalPage() {
  const [rows, setRows] = useState<EDIMessage[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ direction: 'In', doc_type: 'PO', partner: '', reference: '', payload: '' })
  const load = useCallback(() => { listEdi().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createEdi(f); setF({ direction: 'In', doc_type: 'PO', partner: '', reference: '', payload: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const proc = async (id: string) => { await processEdi(id); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><Network className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">EDI / Customer Portal</h1></div>
      <p className="text-xs text-gray-500 mb-3">On-premise document-exchange register (no external gateway calls).</p>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <select className="border rounded px-2 py-1 text-sm" value={f.direction} onChange={e => setF({ ...f, direction: e.target.value })}><option>In</option><option>Out</option></select>
        <select className="border rounded px-2 py-1 text-sm" value={f.doc_type} onChange={e => setF({ ...f, doc_type: e.target.value })}>{DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Partner" value={f.partner} onChange={e => setF({ ...f, partner: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-36" placeholder="Reference" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Log</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Dir</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Partner</th><th className="text-left px-3 py-2">Reference</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(m => <tr key={m.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{m.direction}</td><td className="px-3 py-1.5">{m.doc_type}</td><td className="px-3 py-1.5">{m.partner}</td><td className="px-3 py-1.5">{m.reference}</td><td className="px-3 py-1.5">{m.status}</td>
          <td className="px-3 py-1.5 text-right">{m.status !== 'Processed' && <button onClick={() => proc(m.id)} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Process</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No messages yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default EdiPortalPage
