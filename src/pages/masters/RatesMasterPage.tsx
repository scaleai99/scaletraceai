/**
 * RatesMasterPage - Rates & Overheads (Masters group).
 *
 * The single active overhead / costing-rate record used by quotation costing:
 * factory & admin overhead, margin, freight/packing, rejection allowance and
 * the bench-labour rate. One active record (GET /rates, PUT /rates). Real data
 * only - shows an honest "not set yet" state when no record exists.
 */
import { useEffect, useState, useCallback } from 'react'
import { Save, RefreshCw, Percent, Info } from 'lucide-react'
import { getRates, putRates, type OverheadRates } from '../../api/mastersApi'

const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP']

interface FormState {
  factory_overhead_pct: string
  admin_overhead_pct: string
  margin_pct: string
  freight_packing_pct: string
  rejection_allowance_pct: string
  bench_labour_rate: string
  currency: string
  effective_from: string
}

const EMPTY_FORM: FormState = {
  factory_overhead_pct: '', admin_overhead_pct: '', margin_pct: '',
  freight_packing_pct: '', rejection_allowance_pct: '', bench_labour_rate: '',
  currency: 'INR', effective_from: '',
}

const numOrNull = (s: string): number | null => (s.trim() === '' ? null : Number(s))

function toForm(r: OverheadRates): FormState {
  return {
    factory_overhead_pct: r.factory_overhead_pct != null ? String(r.factory_overhead_pct) : '',
    admin_overhead_pct: r.admin_overhead_pct != null ? String(r.admin_overhead_pct) : '',
    margin_pct: r.margin_pct != null ? String(r.margin_pct) : '',
    freight_packing_pct: r.freight_packing_pct != null ? String(r.freight_packing_pct) : '',
    rejection_allowance_pct: r.rejection_allowance_pct != null ? String(r.rejection_allowance_pct) : '',
    bench_labour_rate: r.bench_labour_rate != null ? String(r.bench_labour_rate) : '',
    currency: r.currency ?? 'INR',
    effective_from: r.effective_from ?? '',
  }
}

export function RatesMasterPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [existing, setExisting] = useState<OverheadRates | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setLoadError(null); setSaveMsg(null)
    getRates()
      .then((r) => { setExisting(r); if (r) setForm(toForm(r)) })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        setLoadError(
          ax?.response?.status === 404
            ? 'Rates service not found (404) - the backend needs a restart to load the new masters router.'
            : ax?.response?.data?.detail ?? 'Failed to load rates.'
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true); setSaveError(null); setSaveMsg(null)
    try {
      const saved = await putRates({
        factory_overhead_pct: numOrNull(form.factory_overhead_pct),
        admin_overhead_pct: numOrNull(form.admin_overhead_pct),
        margin_pct: numOrNull(form.margin_pct),
        freight_packing_pct: numOrNull(form.freight_packing_pct),
        rejection_allowance_pct: numOrNull(form.rejection_allowance_pct),
        bench_labour_rate: numOrNull(form.bench_labour_rate),
        currency: form.currency || 'INR',
        effective_from: form.effective_from || null,
      })
      setExisting(saved); setForm(toForm(saved))
      setSaveMsg('Rates saved.')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setSaveError(ax?.response?.data?.detail ?? 'Save failed.')
    } finally { setSaving(false) }
  }

  const pctField = (label: string, key: keyof FormState) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input type="number" step="0.01" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-sm" />
        <Percent className="w-3.5 h-3.5 absolute right-3 top-3 text-gray-400" />
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rates &amp; Overheads</h1>
          <p className="text-sm text-gray-500 mt-0.5">The single active costing-rate record used by quotation costing</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {loadError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>}

      {!loading && !existing && !loadError && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          No rates record exists yet. Fill in the values below and save to create the active record.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <div className="py-8 text-center text-gray-400 animate-pulse">Loading rates...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {pctField('Factory Overhead', 'factory_overhead_pct')}
              {pctField('Admin Overhead', 'admin_overhead_pct')}
              {pctField('Margin', 'margin_pct')}
              {pctField('Freight & Packing', 'freight_packing_pct')}
              {pctField('Rejection Allowance', 'rejection_allowance_pct')}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Bench Labour Rate (per hr)</label>
                <input type="number" step="0.01" value={form.bench_labour_rate} onChange={(e) => setForm({ ...form, bench_labour_rate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
                  {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Effective From</label>
                <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
            </div>

            {existing && (
              <p className="text-xs text-gray-400 mt-4">
                Last updated{existing.updated_by ? ` by ${existing.updated_by}` : ''}{existing.updated_at ? ` on ${new Date(existing.updated_at).toLocaleString()}` : ''}.
              </p>
            )}

            {saveError && <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{saveError}</div>}
            {saveMsg && <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{saveMsg}</div>}

            <div className="flex items-center justify-end mt-6">
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : existing ? 'Save Changes' : 'Create Rates'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
