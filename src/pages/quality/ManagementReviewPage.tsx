import { useEffect, useState, useCallback } from 'react'
import { Presentation, Plus } from 'lucide-react'
import { listMrm, createMrm, updateMrm, type ManagementReview } from '../../api/qmsInvExtApi'

export function ManagementReviewPage() {
  const [rows, setRows] = useState<ManagementReview[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ review_date: '', chaired_by: '', attendees: '', agenda: '' })
  const load = useCallback(() => { listMrm().then(r => setRows(Array.isArray(r) ? r : [])).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createMrm(f); setF({ review_date: '', chaired_by: '', attendees: '', agenda: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const finalize = async (m: ManagementReview) => { await updateMrm(m.id, { status: 'Finalized' }); load() }
  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-4"><Presentation className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Management Review (MRM)</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input type="date" className="border rounded px-2 py-1 text-sm" value={f.review_date} onChange={e => setF({ ...f, review_date: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Chaired by" value={f.chaired_by} onChange={e => setF({ ...f, chaired_by: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[160px]" placeholder="Agenda" value={f.agenda} onChange={e => setF({ ...f, agenda: e.target.value })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Chair</th><th className="text-left px-3 py-2">Agenda</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(m => <tr key={m.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{m.review_date}</td><td className="px-3 py-1.5">{m.chaired_by}</td><td className="px-3 py-1.5">{m.agenda}</td><td className="px-3 py-1.5">{m.status}</td>
          <td className="px-3 py-1.5 text-right">{m.status !== 'Finalized' && <button onClick={() => finalize(m)} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Finalize</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No management reviews yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default ManagementReviewPage
