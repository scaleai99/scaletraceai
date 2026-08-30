import { useEffect, useState, useCallback } from 'react'
import { PieChart, Plus } from 'lucide-react'
import { listBudgets, createBudget, getBudgetVariance, type BudgetLine } from '../../api/financeExtApi'

const CATS = ['Revenue', 'Material', 'Labour', 'Overhead', 'Capex']
const PERIODS = ['Annual', 'Q1', 'Q2', 'Q3', 'Q4']

export function BudgetPage() {
  const [rows, setRows] = useState<BudgetLine[]>([])
  const [variance, setVariance] = useState<{ category: string; budget: number; actual: number; variance: number }[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ fy: '2026-27', department: '', category: CATS[0], period: 'Annual', budget_amount: 0, actual_amount: 0 })
  const load = useCallback(() => {
    listBudgets().then(setRows).catch(() => setRows([]))
    getBudgetVariance().then(d => setVariance(d?.rows ?? [])).catch(() => setVariance([]))
  }, [])
  useEffect(() => { load() }, [load])
  const add = async () => {
    setErr('')
    try { await createBudget(f); setF({ ...f, department: '', budget_amount: 0, actual_amount: 0 }); load() }
    catch (e: any) { setErr(e?.response?.data?.detail || String(e)) }
  }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><PieChart className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Budgeting &amp; Forecasting</h1></div>
      {variance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {variance.map(v => (
            <div key={v.category} className="border border-gray-200 rounded p-2">
              <div className="text-xs text-gray-500">{v.category}</div>
              <div className="text-sm">B {v.budget.toFixed(0)} / A {v.actual.toFixed(0)}</div>
              <div className={`text-xs ${v.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Var {v.variance.toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <input className="border rounded px-2 py-1 text-sm w-24" placeholder="FY" value={f.fy} onChange={e => setF({ ...f, fy: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-36" placeholder="Department" value={f.department} onChange={e => setF({ ...f, department: e.target.value })} />
        <select className="border rounded px-2 py-1 text-sm" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
        <select className="border rounded px-2 py-1 text-sm" value={f.period} onChange={e => setF({ ...f, period: e.target.value })}>{PERIODS.map(p => <option key={p}>{p}</option>)}</select>
        <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="Budget" value={f.budget_amount || ''} onChange={e => setF({ ...f, budget_amount: Number(e.target.value) })} />
        <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="Actual" value={f.actual_amount || ''} onChange={e => setF({ ...f, actual_amount: Number(e.target.value) })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">FY</th><th className="text-left px-3 py-2">Dept</th><th className="text-left px-3 py-2">Category</th><th className="text-left px-3 py-2">Period</th><th className="text-right px-3 py-2">Budget</th><th className="text-right px-3 py-2">Actual</th><th className="text-right px-3 py-2">Variance</th></tr></thead>
        <tbody>{rows.map(b => <tr key={b.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{b.fy}</td><td className="px-3 py-1.5">{b.department}</td><td className="px-3 py-1.5">{b.category}</td><td className="px-3 py-1.5">{b.period}</td><td className="px-3 py-1.5 text-right">{b.budget_amount.toFixed(0)}</td><td className="px-3 py-1.5 text-right">{b.actual_amount.toFixed(0)}</td><td className={`px-3 py-1.5 text-right ${b.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{b.variance.toFixed(0)}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No budget lines yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default BudgetPage
