import { useEffect, useState, useCallback } from 'react'
import { Boxes, Plus } from 'lucide-react'
import { listAssets, createAsset, depreciateAsset, type FixedAsset } from '../../api/financeExtApi'

const CATS = ['Plant & Machinery', 'Computers', 'Furniture', 'Vehicles', 'Tools & Equipment', 'Buildings']

export function FixedAssetsPage() {
  const [rows, setRows] = useState<FixedAsset[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ asset_code: '', name: '', category: CATS[0], cost: 0, useful_life_years: 10, salvage_value: 0, depreciation_method: 'SLM', location: '' })
  const load = useCallback(() => { listAssets().then(r => setRows(Array.isArray(r) ? r : [])).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => {
    setErr('')
    try { await createAsset(f); setF({ ...f, asset_code: '', name: '', cost: 0 }); load() }
    catch (e: any) { setErr(e?.response?.data?.detail || String(e)) }
  }
  const dep = async (id: string) => { await depreciateAsset(id); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><Boxes className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Fixed Assets</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-28" placeholder="Asset code" value={f.asset_code} onChange={e => setF({ ...f, asset_code: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[140px]" placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <select className="border rounded px-2 py-1 text-sm" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
        <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="Cost" value={f.cost || ''} onChange={e => setF({ ...f, cost: Number(e.target.value) })} />
        <input type="number" className="border rounded px-2 py-1 text-sm w-20" placeholder="Life yrs" value={f.useful_life_years} onChange={e => setF({ ...f, useful_life_years: Number(e.target.value) })} />
        <select className="border rounded px-2 py-1 text-sm" value={f.depreciation_method} onChange={e => setF({ ...f, depreciation_method: e.target.value })}><option>SLM</option><option>WDV</option></select>
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Code</th><th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Method</th><th className="text-right px-3 py-2">Cost</th><th className="text-right px-3 py-2">Accum. Dep.</th><th className="text-right px-3 py-2">Book Value</th><th></th></tr></thead>
        <tbody>{rows.map(a => <tr key={a.id} className="border-t border-gray-100">
          <td className="px-3 py-1.5 font-mono">{a.asset_code}</td><td className="px-3 py-1.5">{a.name}</td><td className="px-3 py-1.5">{a.depreciation_method}</td>
          <td className="px-3 py-1.5 text-right">{a.cost.toFixed(2)}</td><td className="px-3 py-1.5 text-right">{a.accumulated_depreciation.toFixed(2)}</td><td className="px-3 py-1.5 text-right">{a.book_value.toFixed(2)}</td>
          <td className="px-3 py-1.5 text-right">{a.status === 'Active' && <button onClick={() => dep(a.id)} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Depreciate 1yr</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No assets yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default FixedAssetsPage
