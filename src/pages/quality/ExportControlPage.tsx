/**
 * Export Control (ITAR / EAR) — restricted-party screening, per-part export
 * classification, licenses, and the deemed-export access log.
 * Backend: /api/v1/export-control (app/api/export_control.py).
 */
import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, Plus, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import { Button, Input, Select } from '../../components/ui'
import {
  listScreenings, createScreening,
  listClassifications, createClassification,
  listLicenses, createLicense,
  listAccessLog,
  type Screening, type Classification, type ExportLicense, type AccessLogEntry,
} from '../../api/exportControlApi'

type Tab = 'screening' | 'classification' | 'licenses' | 'log'

function Pill({ v }: { v: string }) {
  const map: Record<string, string> = {
    clear: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'rescreen due': 'bg-amber-50 text-amber-700 border-amber-200',
    hit: 'bg-red-50 text-red-700 border-red-200',
    ITAR: 'bg-red-50 text-red-700 border-red-200',
    EAR: 'bg-amber-50 text-amber-700 border-amber-200',
    'Not controlled': 'bg-gray-50 text-gray-500 border-gray-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
    'not required': 'bg-gray-50 text-gray-500 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${map[v] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>{v}</span>
}

const errMsg = (e: unknown, f: string) => (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? f


export default function ExportControlPage() {
  const [tab, setTab] = useState<Tab>('screening')
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [classes, setClasses] = useState<Classification[]>([])
  const [licenses, setLicenses] = useState<ExportLicense[]>([])
  const [log, setLog] = useState<AccessLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true); setError(null)
    const p =
      tab === 'screening' ? listScreenings().then(setScreenings)
      : tab === 'classification' ? listClassifications().then(setClasses)
      : tab === 'licenses' ? listLicenses().then(setLicenses)
      : listAccessLog().then(setLog)
    p.catch((e) => setError(errMsg(e, 'Could not load. Is the backend up to date (restart needed for new tables)?')))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load(); setForm({}) }, [load])

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      if (tab === 'screening') {
        await createScreening({
          party_type: form.party_type || 'Customer', party_name: form.party_name,
          result: (form.result as Screening['result']) || 'clear',
          screened_date: form.screened_date || undefined, notes: form.notes,
        })
      } else if (tab === 'classification') {
        await createClassification({
          jurisdiction: (form.jurisdiction as Classification['jurisdiction']) || 'Not controlled',
          part_ref: form.part_ref, usml_category: form.usml_category, eccn: form.eccn,
          authority: form.authority, basis: form.basis, determined_by: form.determined_by,
        })
      } else if (tab === 'licenses') {
        await createLicense({
          license_ref: form.license_ref, license_type: form.license_type || 'TAA',
          status: (form.status as ExportLicense['status']) || 'active', scope: form.scope,
          parties: form.parties, expires: form.expires || undefined,
          named_persons: form.named_persons ? form.named_persons.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        })
      }
      setForm({}); load()
    } catch (e) { setError(errMsg(e, 'Save failed.')) }
    finally { setBusy(false) }
  }

  const fld = (k: string) => ({ value: form[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value })) })
  const TABS: { k: Tab; label: string }[] = [
    { k: 'screening', label: 'Party Screening' },
    { k: 'classification', label: 'Classification' },
    { k: 'licenses', label: 'Licenses' },
    { k: 'log', label: 'Access Log' },
  ]


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={20} className="text-indigo-600" />
        <h1 className="text-xl font-semibold text-gray-800">Export Control</h1>
        <span className="text-xs text-gray-400">ITAR / EAR — screening, classification, licensing &amp; deemed-export access</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">Restricted-party screening of customers and suppliers, per-part jurisdiction classification, export licences, and the immutable deemed-export access log.</p>

      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.k ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto inline-flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Refresh
        </button>
      </div>

      {error && <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{error}</div>}

      {/* Create form (not for the read-only log) */}
      {tab !== 'log' && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {tab === 'screening' && <>
              <Select label="Party type" options={[{label:'Customer',value:'Customer'},{label:'Supplier',value:'Supplier'}]} {...fld('party_type')} />
              <Input label="Party name" {...fld('party_name')} />
              <Select label="Result" options={[{label:'clear',value:'clear'},{label:'rescreen due',value:'rescreen due'},{label:'hit',value:'hit'}]} {...fld('result')} />
              <Input label="Screened date" type="date" {...fld('screened_date')} />
            </>}
            {tab === 'classification' && <>
              <Select label="Jurisdiction" options={[{label:'ITAR',value:'ITAR'},{label:'EAR',value:'EAR'},{label:'Not controlled',value:'Not controlled'}]} {...fld('jurisdiction')} />
              <Input label="Part / drawing ref" {...fld('part_ref')} />
              <Input label="USML category" {...fld('usml_category')} />
              <Input label="ECCN" {...fld('eccn')} />
              <Input label="Authority" {...fld('authority')} />
              <Input label="Empowered Official" {...fld('determined_by')} />
              <Input label="Basis" className="md:col-span-2" {...fld('basis')} />
            </>}
            {tab === 'licenses' && <>
              <Input label="Licence ref" {...fld('license_ref')} />
              <Select label="Type" options={['TAA','DSP-5','DSP-73','DSP-61','EAR licence','Exemption'].map(v=>({label:v,value:v}))} {...fld('license_type')} />
              <Select label="Status" options={['active','expired','not required','pending'].map(v=>({label:v,value:v}))} {...fld('status')} />
              <Input label="Expires" type="date" {...fld('expires')} />
              <Input label="Named persons (emp codes, comma)" className="md:col-span-2" {...fld('named_persons')} />
              <Input label="Scope" className="md:col-span-2" {...fld('scope')} />
            </>}
          </div>
          <div className="mt-3">
            <Button size="sm" onClick={submit} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin mr-1" /> : <Plus size={13} className="mr-1" />}
              Add {tab === 'screening' ? 'screening' : tab === 'classification' ? 'classification' : 'licence'}
            </Button>
          </div>
        </div>
      )}


      {/* Tables */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        {tab === 'screening' && (
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-200">
              <th className="text-left p-2.5">Party</th><th className="text-left p-2.5">Type</th><th className="text-left p-2.5">Lists</th><th className="text-left p-2.5">Screened</th><th className="text-left p-2.5">Result</th><th className="text-left p-2.5">By</th></tr></thead>
            <tbody>{screenings.map((s) => (
              <tr key={s.id} className="border-b border-gray-50"><td className="p-2.5 font-medium">{s.party_name ?? '—'}</td><td className="p-2.5">{s.party_type}</td><td className="p-2.5 text-gray-500 text-xs">{s.lists}</td><td className="p-2.5">{s.screened_date ?? '—'}</td><td className="p-2.5"><Pill v={s.result} /></td><td className="p-2.5 text-gray-500">{s.screened_by ?? '—'}</td></tr>
            ))}{!screenings.length && !loading && <tr><td colSpan={6} className="p-6 text-center text-gray-400">No screenings recorded.</td></tr>}</tbody>
          </table>
        )}
        {tab === 'classification' && (
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-200">
              <th className="text-left p-2.5">Part</th><th className="text-left p-2.5">Jurisdiction</th><th className="text-left p-2.5">USML / ECCN</th><th className="text-left p-2.5">Empowered Official</th><th className="text-left p-2.5">Date</th></tr></thead>
            <tbody>{classes.map((c) => (
              <tr key={c.id} className="border-b border-gray-50"><td className="p-2.5 font-medium">{c.part_ref ?? '—'}</td><td className="p-2.5"><Pill v={c.jurisdiction} /></td><td className="p-2.5 text-gray-600">{c.usml_category || c.eccn || '—'}</td><td className="p-2.5 text-gray-500">{c.determined_by ?? '—'}</td><td className="p-2.5">{c.determined_date ?? '—'}</td></tr>
            ))}{!classes.length && !loading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No classifications recorded.</td></tr>}</tbody>
          </table>
        )}
        {tab === 'licenses' && (
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-200">
              <th className="text-left p-2.5">Ref</th><th className="text-left p-2.5">Type</th><th className="text-left p-2.5">Status</th><th className="text-left p-2.5">Named persons</th><th className="text-left p-2.5">Expires</th></tr></thead>
            <tbody>{licenses.map((l) => (
              <tr key={l.id} className="border-b border-gray-50"><td className="p-2.5 font-mono text-xs">{l.license_ref}</td><td className="p-2.5">{l.license_type}</td><td className="p-2.5"><Pill v={l.status} /></td><td className="p-2.5 text-gray-500 text-xs">{(l.named_persons ?? []).join(', ') || '—'}</td><td className="p-2.5">{l.expires ?? '—'}</td></tr>
            ))}{!licenses.length && !loading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No licences recorded.</td></tr>}</tbody>
          </table>
        )}
        {tab === 'log' && (
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-200">
              <th className="text-left p-2.5">Time</th><th className="text-left p-2.5">Who</th><th className="text-left p-2.5">What</th><th className="text-left p-2.5">Basis</th><th className="text-left p-2.5">Result</th></tr></thead>
            <tbody>{log.map((a) => (
              <tr key={a.id} className="border-b border-gray-50"><td className="p-2.5 text-gray-500 text-xs whitespace-nowrap">{a.at ? new Date(a.at).toLocaleString() : '—'}</td><td className="p-2.5">{a.who ?? '—'}</td><td className="p-2.5 text-gray-600">{a.what ?? '—'}</td><td className="p-2.5 text-gray-500">{a.basis ?? '—'}</td><td className="p-2.5"><span className={a.result.startsWith('denied') ? 'text-red-600 font-medium' : 'text-emerald-700'}>{a.result}</span></td></tr>
            ))}{!log.length && !loading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No access events logged.</td></tr>}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
