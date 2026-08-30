import { useEffect, useState, useCallback } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import {
  listAccounts, createAccount, listJournalEntries, createJournalEntry, postJournalEntry, getTrialBalance,
  type GLAccount, type JournalEntry, type JournalLine, type TrialBalanceRow,
} from '../../api/financeExtApi'

type Tab = 'accounts' | 'journals' | 'trial'
const ACCT_TYPES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense']

export function GeneralLedgerPage() {
  const [tab, setTab] = useState<Tab>('accounts')
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-amber-500" />
        <h1 className="text-xl font-semibold">General Ledger</h1>
      </div>
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {(['accounts', 'journals', 'trial'] as Tab[]).map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${tab === k ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500'}`}>
            {k === 'accounts' ? 'Chart of Accounts' : k === 'journals' ? 'Journal Vouchers' : 'Trial Balance'}
          </button>
        ))}
      </div>
      {tab === 'accounts' && <Accounts />}
      {tab === 'journals' && <Journals />}
      {tab === 'trial' && <TrialBalance />}
    </div>
  )
}

function Accounts() {
  const [rows, setRows] = useState<GLAccount[]>([])
  const [f, setF] = useState({ code: '', name: '', account_type: 'Asset', parent_code: '', is_active: true })
  const [err, setErr] = useState('')
  const load = useCallback(() => { listAccounts().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => {
    setErr('')
    try { await createAccount({ ...f, parent_code: f.parent_code || null }); setF({ code: '', name: '', account_type: 'Asset', parent_code: '', is_active: true }); load() }
    catch (e: any) { setErr(e?.response?.data?.detail || String(e)) }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 items-end">
        <input className="border rounded px-2 py-1 text-sm w-24" placeholder="Code" value={f.code} onChange={e => setF({ ...f, code: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[160px]" placeholder="Account name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <select className="border rounded px-2 py-1 text-sm" value={f.account_type} onChange={e => setF({ ...f, account_type: e.target.value })}>
          {ACCT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Code</th><th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Type</th></tr></thead>
        <tbody>{rows.map(a => <tr key={a.id} className="border-t border-gray-100"><td className="px-3 py-1.5 font-mono">{a.code}</td><td className="px-3 py-1.5">{a.name}</td><td className="px-3 py-1.5">{a.account_type}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No accounts yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}

function Journals() {
  const [rows, setRows] = useState<JournalEntry[]>([])
  const [date, setDate] = useState('')
  const [narration, setNarration] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([{ account_code: '', debit: 0, credit: 0 }, { account_code: '', debit: 0, credit: 0 }])
  const [err, setErr] = useState('')
  const load = useCallback(() => { listJournalEntries().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const totalD = lines.reduce((s, l) => s + Number(l.debit || 0), 0)
  const totalC = lines.reduce((s, l) => s + Number(l.credit || 0), 0)
  const add = async () => {
    setErr('')
    try { await createJournalEntry({ entry_date: date, narration, lines: lines.filter(l => l.account_code) }); setNarration(''); setLines([{ account_code: '', debit: 0, credit: 0 }, { account_code: '', debit: 0, credit: 0 }]); load() }
    catch (e: any) { setErr(e?.response?.data?.detail || String(e)) }
  }
  const post = async (id: string) => { await postJournalEntry(id); load() }
  return (
    <div>
      <div className="border border-gray-200 rounded p-3 mb-4">
        <div className="flex gap-2 mb-2">
          <input type="date" className="border rounded px-2 py-1 text-sm" value={date} onChange={e => setDate(e.target.value)} />
          <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="Narration" value={narration} onChange={e => setNarration(e.target.value)} />
        </div>
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <input className="border rounded px-2 py-1 text-sm w-28" placeholder="Acct code" value={l.account_code} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, account_code: e.target.value } : x))} />
            <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="Description" value={l.description ?? ''} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
            <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="Debit" value={l.debit || ''} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, debit: Number(e.target.value) } : x))} />
            <input type="number" className="border rounded px-2 py-1 text-sm w-28" placeholder="Credit" value={l.credit || ''} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, credit: Number(e.target.value) } : x))} />
            <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <div className="flex justify-between items-center mt-2">
          <button onClick={() => setLines([...lines, { account_code: '', debit: 0, credit: 0 }])} className="text-xs text-amber-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add line</button>
          <div className={`text-xs ${totalD === totalC && totalD > 0 ? 'text-green-600' : 'text-red-600'}`}>Dr {totalD.toFixed(2)} / Cr {totalC.toFixed(2)} {totalD === totalC ? 'œ" balanced' : 'œ- unbalanced'}</div>
          <button onClick={add} disabled={totalD !== totalC || totalD === 0} className="bg-amber-500 disabled:opacity-40 text-white text-sm rounded px-3 py-1">Create voucher</button>
        </div>
        {err && <p className="text-red-600 text-xs mt-1">{err}</p>}
      </div>
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Voucher</th><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Narration</th><th className="text-right px-3 py-2">Amount</th><th className="text-left px-3 py-2">Status</th><th></th></tr></thead>
        <tbody>{rows.map(e => <tr key={e.id} className="border-t border-gray-100">
          <td className="px-3 py-1.5 font-mono">{e.entry_no}</td><td className="px-3 py-1.5">{e.entry_date}</td><td className="px-3 py-1.5">{e.narration}</td>
          <td className="px-3 py-1.5 text-right">{e.total_debit.toFixed(2)}</td>
          <td className="px-3 py-1.5">{e.status}</td>
          <td className="px-3 py-1.5 text-right">{e.status === 'Draft' && <button onClick={() => post(e.id)} className="text-xs bg-green-600 text-white rounded px-2 py-0.5">Post</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No journal vouchers yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}

function TrialBalance() {
  const [data, setData] = useState<{ rows: TrialBalanceRow[]; total_debit: number; total_credit: number } | null>(null)
  useEffect(() => { getTrialBalance().then(setData).catch(() => setData(null)) }, [])
  return (
    <table className="w-full text-sm border border-gray-200 rounded">
      <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Account</th><th className="text-right px-3 py-2">Debit</th><th className="text-right px-3 py-2">Credit</th><th className="text-right px-3 py-2">Balance</th></tr></thead>
      <tbody>{(data?.rows ?? []).map(r => <tr key={r.account_code} className="border-t border-gray-100"><td className="px-3 py-1.5">{r.account_code} "" {r.account_name}</td><td className="px-3 py-1.5 text-right">{r.debit.toFixed(2)}</td><td className="px-3 py-1.5 text-right">{r.credit.toFixed(2)}</td><td className="px-3 py-1.5 text-right">{r.balance.toFixed(2)}</td></tr>)}
        {(!data || data.rows.length === 0) && <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No posted entries yet.</td></tr>}</tbody>
      {data && data.rows.length > 0 && <tfoot><tr className="border-t-2 border-gray-300 font-medium"><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right">{data.total_debit.toFixed(2)}</td><td className="px-3 py-2 text-right">{data.total_credit.toFixed(2)}</td><td></td></tr></tfoot>}
    </table>
  )
}

export default GeneralLedgerPage
