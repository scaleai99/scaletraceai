import { useEffect, useState, useCallback } from 'react'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { listTransfers, createTransfer, completeTransfer, type InternalTransfer } from '../../api/qmsInvExtApi'

export function InternalTransfersPage() {
  const [rows, setRows] = useState<InternalTransfer[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ item_code: '', quantity: 0, from_bin: '', to_bin: '', transfer_date: '', reason: '' })
  const load = useCallback(() => { listTransfers().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createTransfer(f); setF({ item_code: '', quantity: 0, from_bin: '', to_bin: '', transfer_date: '', reason: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const complete = async (id: string) => { await completeTransfer(id); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><ArrowLeftRight className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Internal Transfers</h1></div>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-36" placeholder="Item code" value={f.item_code} onChange={e => setF({ ...f, item_code: e.target.value })} />
        <input type="number" className="border rounded px-2 py-1 text-sm w-24" placeholder="Qty" value={f.quantity || ''} onChange={e => setF({ ...f, quantity: Number(e.target.value) })} />
        <input className="border rounded px-2 py-1 text-sm w-28" placeholder="From bin" value={f.from_bin} onChange={e => setF({ ...f, from_bin: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-28" placeholder="To bin" value={f.to_bin} onChange={e => setF({ ...f, to_bin: e.target.value })} />
        <input type="date" className="border rounded px-2 py-1 text-sm" value={f.transfer_date} onChange={e => setF({ ...f, transfer_date: e.target.value })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Transfer</th><th className="text-left px-3 py-2">Item</th><th className="text-right px-3 py-2">Qty</th><th className="text-left px-3 py-2">From</th><th className="text-left px-3 py-2">To</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(t => <tr key={t.id} className="border-t border-gray-100"><td className="px-3 py-1.5 font-mono">{t.transfer_no}</td><td className="px-3 py-1.5">{t.item_code}</td><td className="px-3 py-1.5 text-right">{t.quantity}</td><td className="px-3 py-1.5">{t.from_bin}</td><td className="px-3 py-1.5">{t.to_bin}</td><td className="px-3 py-1.5">{t.status}</td>
          <td className="px-3 py-1.5 text-right">{t.status === 'Draft' && <button onClick={() => complete(t.id)} className="text-xs bg-green-600 text-white rounded px-2 py-0.5">Complete</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No transfers yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default InternalTransfersPage
