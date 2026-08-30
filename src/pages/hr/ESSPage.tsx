import { useEffect, useState, useCallback } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { listLeave, applyLeave, decideLeave, type LeaveRequest } from '../../api/hrExtApi'

const TYPES = ['Casual', 'Sick', 'Earned', 'LOP']

export function ESSPage() {
  const [rows, setRows] = useState<LeaveRequest[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ employee_name: '', leave_type: 'Casual', from_date: '', to_date: '', reason: '' })
  const load = useCallback(() => { listLeave().then(setRows).catch(e => setErr(String(e))) }, [])
  useEffect(() => { load() }, [load])
  const apply = async () => { setErr(''); try { await applyLeave(f); setF({ ...f, from_date: '', to_date: '', reason: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const decide = async (id: string, d: 'Approved' | 'Rejected') => { await decideLeave(id, d); load() }
  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-4"><CalendarDays className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Employee Self-Service "" Leave</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Employee" value={f.employee_name} onChange={e => setF({ ...f, employee_name: e.target.value })} />
        <select className="border rounded px-2 py-1 text-sm" value={f.leave_type} onChange={e => setF({ ...f, leave_type: e.target.value })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <input type="date" className="border rounded px-2 py-1 text-sm" value={f.from_date} onChange={e => setF({ ...f, from_date: e.target.value })} />
        <input type="date" className="border rounded px-2 py-1 text-sm" value={f.to_date} onChange={e => setF({ ...f, to_date: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[120px]" placeholder="Reason" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />
        <button onClick={apply} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Apply</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Employee</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">From</th><th className="text-left px-3 py-2">To</th><th className="text-right px-3 py-2">Days</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(l => <tr key={l.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{l.employee_name}</td><td className="px-3 py-1.5">{l.leave_type}</td><td className="px-3 py-1.5">{l.from_date}</td><td className="px-3 py-1.5">{l.to_date}</td><td className="px-3 py-1.5 text-right">{l.days}</td><td className="px-3 py-1.5">{l.status}</td>
          <td className="px-3 py-1.5 text-right">{l.status === 'Pending' && <span className="flex gap-1 justify-end"><button onClick={() => decide(l.id, 'Approved')} className="text-xs bg-green-600 text-white rounded px-2 py-0.5">Approve</button><button onClick={() => decide(l.id, 'Rejected')} className="text-xs bg-red-500 text-white rounded px-2 py-0.5">Reject</button></span>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No leave requests yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default ESSPage
