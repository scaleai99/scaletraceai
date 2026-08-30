import { useEffect, useState, useCallback } from 'react'
import { Star, Plus } from 'lucide-react'
import { listAppraisals, createAppraisal, updateAppraisal, type Appraisal } from '../../api/hrExtApi'

export function AppraisalPage() {
  const [rows, setRows] = useState<Appraisal[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ employee_name: '', period: 'FY2026-27', rating: 3, reviewer: '', goals: '', achievements: '' })
  const load = useCallback(() => { listAppraisals().then(setRows).catch(e => setErr(String(e))) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createAppraisal(f); setF({ ...f, employee_name: '', goals: '', achievements: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const setStatus = async (id: string, status: string) => { await updateAppraisal(id, { status }); load() }
  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-4"><Star className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Performance Appraisal</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Employee" value={f.employee_name} onChange={e => setF({ ...f, employee_name: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-28" placeholder="Period" value={f.period} onChange={e => setF({ ...f, period: e.target.value })} />
        <select className="border rounded px-2 py-1 text-sm" value={f.rating} onChange={e => setF({ ...f, rating: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}˜...</option>)}</select>
        <input className="border rounded px-2 py-1 text-sm w-32" placeholder="Reviewer" value={f.reviewer} onChange={e => setF({ ...f, reviewer: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[140px]" placeholder="Goals" value={f.goals} onChange={e => setF({ ...f, goals: e.target.value })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Employee</th><th className="text-left px-3 py-2">Period</th><th className="text-left px-3 py-2">Rating</th><th className="text-left px-3 py-2">Reviewer</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(a => <tr key={a.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{a.employee_name}</td><td className="px-3 py-1.5">{a.period}</td><td className="px-3 py-1.5">{a.rating ? `${a.rating}˜...` : '""'}</td><td className="px-3 py-1.5">{a.reviewer}</td><td className="px-3 py-1.5">{a.status}</td>
          <td className="px-3 py-1.5 text-right">{a.status !== 'Finalized' && <button onClick={() => setStatus(a.id, a.status === 'Draft' ? 'Submitted' : 'Finalized')} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">{a.status === 'Draft' ? 'Submit' : 'Finalize'}</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No appraisals yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default AppraisalPage
