import { useEffect, useState, useCallback } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { listPayments, createPayment, settlePayment, type PaymentTxn } from '../../api/integrationApi'
const GATEWAYS = ['Manual', 'NEFT', 'RTGS', 'UPI', 'Card']
export function PaymentsPage() {
  const [rows, setRows] = useState<PaymentTxn[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ gateway: 'NEFT', direction: 'Inbound', party: '', invoice_ref: '', amount: 0, currency: 'INR' })
  const load = useCallback(() => { listPayments().then(setRows).catch(e => setErr(String(e))) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createPayment(f); setF({ ...f, party: '', invoice_ref: '', amount: 0 }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const settle = async (id: string, r: 'Success' | 'Failed') => { await settlePayment(id, r); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Payment Gateway</h1></div>
      <p className="text-xs text-gray-500 mb-3">On-premise payment/receipt transaction register (no live gateway calls).</p>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <select className="border rounded px-2 py-1 text-sm" value={f.gateway} onChange={e => setF({ ...f, gateway: e.target.value })}>{GATEWAYS.map(g => <option key={g}>{g}</option>)}</select>
        <select className="border rounded px-2 py-1 text-sm" value={f.direction} onChange={e => setF({ ...f, direction: e.target.value })}><option>Inbound</option><option>Outbound</option></select>
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Party" value={f.party} onChange={e => setF({ ...f, party: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-32" placeholder="Invoice ref" value={f.invoice_ref} onChange={e => setF({ ...f, invoice_ref: e.target.value })} />
        <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="Amount" value={f.amount || ''} onChange={e => setF({ ...f, amount: Number(e.target.value) })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Txn</th><th className="text-left px-3 py-2">Gateway</th><th className="text-left px-3 py-2">Dir</th><th className="text-left px-3 py-2">Party</th><th className="text-right px-3 py-2">Amount</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(p => <tr key={p.id} className="border-t border-gray-100"><td className="px-3 py-1.5 font-mono">{p.txn_ref}</td><td className="px-3 py-1.5">{p.gateway}</td><td className="px-3 py-1.5">{p.direction}</td><td className="px-3 py-1.5">{p.party}</td><td className="px-3 py-1.5 text-right">{p.currency} {p.amount.toFixed(2)}</td><td className="px-3 py-1.5">{p.status}</td>
          <td className="px-3 py-1.5 text-right">{p.status === 'Initiated' && <span className="flex gap-1 justify-end"><button onClick={() => settle(p.id, 'Success')} className="text-xs bg-green-600 text-white rounded px-2 py-0.5">Success</button><button onClick={() => settle(p.id, 'Failed')} className="text-xs bg-red-500 text-white rounded px-2 py-0.5">Fail</button></span>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No transactions yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default PaymentsPage
