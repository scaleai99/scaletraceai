import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, Plus, X } from 'lucide-react'
import { listApqp, createApqp, updateApqp, type APQPPackage } from '../../api/qmsInvExtApi'

const PHASES = ['Planning', 'Design', 'Process', 'Validation', 'Production']
const STATUSES = ['Open', 'Submitted', 'Approved', 'Rejected']

export function ApqpPage() {
  const [rows, setRows] = useState<APQPPackage[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ part_number: '', customer: '', ppap_level: 3 })
  const [open, setOpen] = useState<APQPPackage | null>(null)
  const load = useCallback(() => { listApqp().then(setRows).catch(e => setErr(String(e))) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createApqp(f); setF({ part_number: '', customer: '', ppap_level: 3 }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const save = async (p: APQPPackage) => { await updateApqp(p.id, { phase: p.phase, status: p.status, elements: p.elements }); setOpen(null); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><ClipboardList className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">APQP / PPAP</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Part number" value={f.part_number} onChange={e => setF({ ...f, part_number: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Customer" value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} />
        <select className="border rounded px-2 py-1 text-sm" value={f.ppap_level} onChange={e => setF({ ...f, ppap_level: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Level {n}</option>)}</select>
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Part</th><th className="text-left px-3 py-2">Customer</th><th className="text-left px-3 py-2">PPAP</th><th className="text-left px-3 py-2">Phase</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(p => <tr key={p.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{p.part_number}</td><td className="px-3 py-1.5">{p.customer}</td><td className="px-3 py-1.5">L{p.ppap_level}</td><td className="px-3 py-1.5">{p.phase}</td><td className="px-3 py-1.5">{p.status}</td><td className="px-3 py-1.5 text-right"><button onClick={() => setOpen(p)} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Open</button></td></tr>)}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No APQP packages yet.</td></tr>}</tbody>
      </table>
      {open && <ApqpDrawer pkg={open} onClose={() => setOpen(null)} onSave={save} />}
    </div>
  )
}

function ApqpDrawer({ pkg, onClose, onSave }: { pkg: APQPPackage; onClose: () => void; onSave: (p: APQPPackage) => void }) {
  const [p, setP] = useState<APQPPackage>(pkg)
  const setEl = (i: number, status: string) => setP({ ...p, elements: p.elements.map((e, j) => j === i ? { ...e, status } : e) })
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">{p.part_number} "" PPAP L{p.ppap_level}</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
        <div className="flex gap-2 mb-3">
          <select className="border rounded px-2 py-1 text-sm" value={p.phase} onChange={e => setP({ ...p, phase: e.target.value })}>{PHASES.map(x => <option key={x}>{x}</option>)}</select>
          <select className="border rounded px-2 py-1 text-sm" value={p.status} onChange={e => setP({ ...p, status: e.target.value })}>{STATUSES.map(x => <option key={x}>{x}</option>)}</select>
        </div>
        <p className="text-xs font-semibold text-gray-600 mb-1">18 PPAP elements</p>
        <div className="space-y-1 mb-4">
          {p.elements.map((el, i) => (
            <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 py-1">
              <span>{i + 1}. {el.name}</span>
              <select className="border rounded text-xs" value={el.status} onChange={e => setEl(i, e.target.value)}><option>Pending</option><option>In Progress</option><option>Complete</option><option>N/A</option></select>
            </div>
          ))}
        </div>
        <button onClick={() => onSave(p)} className="bg-amber-500 text-white text-sm rounded px-3 py-1">Save</button>
      </div>
    </div>
  )
}
export default ApqpPage
