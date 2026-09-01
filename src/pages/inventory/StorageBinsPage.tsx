import { useEffect, useState, useCallback } from 'react'
import { Warehouse, Plus } from 'lucide-react'
import { listBins, createBin, type StockBin } from '../../api/qmsInvExtApi'

export function StorageBinsPage() {
  const [rows, setRows] = useState<StockBin[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ bin_code: '', warehouse: '', zone: '', description: '', capacity: undefined as number | undefined })
  const load = useCallback(() => { listBins().then(setRows).catch(e => setErr(String(e))) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createBin(f); setF({ bin_code: '', warehouse: '', zone: '', description: '', capacity: undefined }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-4"><Warehouse className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Storage &amp; Bin Management</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-32" placeholder="Bin code" value={f.bin_code} onChange={e => setF({ ...f, bin_code: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-32" placeholder="Warehouse" value={f.warehouse} onChange={e => setF({ ...f, warehouse: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-24" placeholder="Zone" value={f.zone} onChange={e => setF({ ...f, zone: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[120px]" placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
        <input type="number" className="border rounded px-2 py-1 text-sm w-24" placeholder="Capacity" value={f.capacity ?? ''} onChange={e => setF({ ...f, capacity: e.target.value ? Number(e.target.value) : undefined })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Bin</th><th className="text-left px-3 py-2">Warehouse</th><th className="text-left px-3 py-2">Zone</th><th className="text-left px-3 py-2">Description</th><th className="text-right px-3 py-2">Capacity</th><th className="text-left px-3 py-2">Status</th></tr></thead>
        <tbody>{rows.map(b => <tr key={b.id} className="border-t border-gray-100"><td className="px-3 py-1.5 font-mono">{b.bin_code}</td><td className="px-3 py-1.5">{b.warehouse}</td><td className="px-3 py-1.5">{b.zone}</td><td className="px-3 py-1.5">{b.description}</td><td className="px-3 py-1.5 text-right">{b.capacity ?? '""'}</td><td className="px-3 py-1.5">{b.status}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No bins yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default StorageBinsPage
