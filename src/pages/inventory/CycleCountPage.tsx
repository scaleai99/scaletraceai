import { useEffect, useState, useCallback } from 'react'
import { ListChecks, Plus } from 'lucide-react'
import { listCounts, createCount, adjustCount, type CycleCount } from '../../api/qmsInvExtApi'

export function CycleCountPage() {
  const [rows, setRows] = useState<CycleCount[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ item_code: '', bin_code: '', system_qty: 0, counted_qty: 0, count_date: '', notes: '' })
  const load = useCallback(() => { listCounts().then(r => setRows(Array.isArray(r) ? r : [])).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createCount(f); setF({ item_code: '', bin_code: '', system_qty: 0, counted_qty: 0, count_date: '', notes: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const adjust = async (id: string) => { await adjustCount(id); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><ListChecks className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Cycle Count / Physical Inventory</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-36" placeholder="Item code" value={f.item_code} onChange={e => setF({ ...f, item_code: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-28" placeholder="Bin" value={f.bin_code} onChange={e => setF({ ...f, bin_code: e.target.value })} />
        <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="System qty" value={f.system_qty || ''} onChange={e => setF({ ...f, system_qty: Number(e.target.value) })} />
        <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="Counted qty" value={f.counted_qty || ''} onChange={e => setF({ ...f, counted_qty: Number(e.target.value) })} />
        <input type="date" className="border rounded px-2 py-1 text-sm" value={f.count_date} onChange={e => setF({ ...f, count_date: e.target.value })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Record</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Count</th><th className="text-left px-3 py-2">Item</th><th className="text-left px-3 py-2">Bin</th><th className="text-right px-3 py-2">System</th><th className="text-right px-3 py-2">Counted</th><th className="text-right px-3 py-2">Variance</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(c => <tr key={c.id} className="border-t border-gray-100"><td className="px-3 py-1.5 font-mono">{c.count_no}</td><td className="px-3 py-1.5">{c.item_code}</td><td className="px-3 py-1.5">{c.bin_code}</td><td className="px-3 py-1.5 text-right">{c.system_qty}</td><td className="px-3 py-1.5 text-right">{c.counted_qty}</td><td className={`px-3 py-1.5 text-right ${c.variance === 0 ? 'text-gray-500' : 'text-red-600'}`}>{c.variance}</td><td className="px-3 py-1.5">{c.status}</td>
          <td className="px-3 py-1.5 text-right">{c.status === 'Open' && <button onClick={() => adjust(c.id)} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Adjust</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No counts yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default CycleCountPage
