import { useEffect, useState, useCallback } from 'react'
import { Wallet, Plus, X } from 'lucide-react'
import { listRuns, createRun, getRun, addPayslip, processRun, type PayrollRun, type Payslip } from '../../api/hrExtApi'

export function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [period, setPeriod] = useState('')
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<(PayrollRun & { payslips: Payslip[] }) | null>(null)
  const load = useCallback(() => { listRuns().then(setRuns).catch(e => setErr(String(e))) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => {
    setErr('')
    try { await createRun({ period }); setPeriod(''); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) }
  }
  const openRun = async (id: string) => setOpen(await getRun(id))
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Payroll</h1></div>
      <div className="flex gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-32" placeholder="Period YYYY-MM" value={period} onChange={e => setPeriod(e.target.value)} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />New Run</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Period</th><th className="text-left px-3 py-2">Status</th><th className="text-right px-3 py-2">Gross</th><th className="text-right px-3 py-2">Deductions</th><th className="text-right px-3 py-2">Net</th><th></th></tr></thead>
        <tbody>{runs.map(r => <tr key={r.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{r.period}</td><td className="px-3 py-1.5">{r.status}</td><td className="px-3 py-1.5 text-right">{r.total_gross.toFixed(2)}</td><td className="px-3 py-1.5 text-right">{r.total_deductions.toFixed(2)}</td><td className="px-3 py-1.5 text-right">{r.total_net.toFixed(2)}</td><td className="px-3 py-1.5 text-right"><button onClick={() => openRun(r.id)} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Open</button></td></tr>)}
          {runs.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No payroll runs yet.</td></tr>}</tbody>
      </table>
      {open && <RunDrawer run={open} onClose={() => { setOpen(null); load() }} refresh={openRun} />}
    </div>
  )
}

function RunDrawer({ run, onClose, refresh }: { run: PayrollRun & { payslips: Payslip[] }; onClose: () => void; refresh: (id: string) => void }) {
  const [f, setF] = useState({ employee_name: '', basic: 0, hra: 0, allowances: 0, tds: 0, other_deductions: 0 })
  const [err, setErr] = useState('')
  const editable = run.status === 'Draft'
  const add = async () => {
    setErr('')
    try { await addPayslip(run.id, f); setF({ employee_name: '', basic: 0, hra: 0, allowances: 0, tds: 0, other_deductions: 0 }); refresh(run.id) }
    catch (e: any) { setErr(e?.response?.data?.detail || String(e)) }
  }
  const process = async () => { await processRun(run.id); refresh(run.id) }
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Payroll "" {run.period} <span className="text-xs text-gray-500">({run.status})</span></h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
            <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Employee" value={f.employee_name} onChange={e => setF({ ...f, employee_name: e.target.value })} />
            <input type="number" className="border rounded px-2 py-1 text-sm w-24" placeholder="Basic" value={f.basic || ''} onChange={e => setF({ ...f, basic: Number(e.target.value) })} />
            <input type="number" className="border rounded px-2 py-1 text-sm w-24" placeholder="HRA" value={f.hra || ''} onChange={e => setF({ ...f, hra: Number(e.target.value) })} />
            <input type="number" className="border rounded px-2 py-1 text-sm w-24" placeholder="Allowances" value={f.allowances || ''} onChange={e => setF({ ...f, allowances: Number(e.target.value) })} />
            <input type="number" className="border rounded px-2 py-1 text-sm w-24" placeholder="TDS" value={f.tds || ''} onChange={e => setF({ ...f, tds: Number(e.target.value) })} />
            <button onClick={add} className="bg-amber-500 text-white text-sm rounded px-3 py-1">Add payslip</button>
          </div>
        )}
        {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
        <p className="text-xs text-gray-500 mb-2">PF (12% of basic, capped ‚¹15k) and ESI (0.75% if gross ‰¤ ‚¹21k) are auto-calculated.</p>
        <table className="w-full text-xs border border-gray-200 rounded">
          <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-2 py-1">Employee</th><th className="text-right px-2 py-1">Gross</th><th className="text-right px-2 py-1">PF</th><th className="text-right px-2 py-1">ESI</th><th className="text-right px-2 py-1">TDS</th><th className="text-right px-2 py-1">Net</th></tr></thead>
          <tbody>{run.payslips.map(p => <tr key={p.id} className="border-t border-gray-100"><td className="px-2 py-1">{p.employee_name}</td><td className="px-2 py-1 text-right">{p.gross.toFixed(0)}</td><td className="px-2 py-1 text-right">{p.pf.toFixed(0)}</td><td className="px-2 py-1 text-right">{p.esi.toFixed(0)}</td><td className="px-2 py-1 text-right">{p.tds.toFixed(0)}</td><td className="px-2 py-1 text-right font-medium">{p.net_pay.toFixed(0)}</td></tr>)}
            {run.payslips.length === 0 && <tr><td colSpan={6} className="px-2 py-4 text-center text-gray-400">No payslips yet.</td></tr>}</tbody>
        </table>
        {editable && run.payslips.length > 0 && <button onClick={process} className="mt-3 bg-green-600 text-white text-sm rounded px-3 py-1">Process run</button>}
      </div>
    </div>
  )
}
export default PayrollPage
