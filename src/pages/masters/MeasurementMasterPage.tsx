/**
 * MeasurementMasterPage - Measurement / Instrument Master (Masters group).
 *
 * Measuring & inspection equipment with resolution, gauge R&R and calibration
 * status. Resolution + gauge R&R feed the feasibility measurement-capability
 * check and inspection method selection. STABLE standard: real data only,
 * mandatory code+name both ends, real resetForm, soft-delete. Backed by the
 * CalibrationRecord table.
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, Search, X, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  listInstruments, createInstrument, updateInstrument, deleteInstrument, type Instrument,
} from '../../api/mastersApi'

const TYPE_OPTIONS = ['Caliper', 'Micrometer', 'Height Gauge', 'CMM', 'Bore Gauge', 'Dial Indicator', 'Gauge Block', 'Thread Gauge', 'Surface Tester', 'Hardness Tester', 'Other']
const STATUS_OPTIONS = ['Active', 'Overdue', 'Recalled', 'Retired']

interface FormState {
  instrument_code: string
  instrument_name: string
  instrument_type: string
  resolution: string
  gauge_rr_pct: string
  last_calibrated_date: string
  next_due_date: string
  calibration_interval_days: string
  location: string
  status: string
}

const EMPTY_FORM: FormState = {
  instrument_code: '', instrument_name: '', instrument_type: '', resolution: '',
  gauge_rr_pct: '', last_calibrated_date: '', next_due_date: '',
  calibration_interval_days: '365', location: '', status: 'Active',
}

const numOrNull = (s: string): number | null => (s.trim() === '' ? null : Number(s))
const intOrNull = (s: string): number | null => (s.trim() === '' ? null : parseInt(s, 10))

export function MeasurementMasterPage() {
  const [rows, setRows] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setLoadError(null)
    listInstruments()
      .then(setRows)
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        setLoadError(
          ax?.response?.status === 404
            ? 'Measurement master service not found (404) - the backend needs a restart to load the new masters router.'
            : ax?.response?.data?.detail ?? 'Failed to load instruments.'
        )
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setFormError(null) }
  const openNew = () => { resetForm(); setShowModal(true) }
  const openEdit = (row: Instrument) => {
    setEditingId(row.id)
    setForm({
      instrument_code: row.instrument_code,
      instrument_name: row.instrument_name ?? '',
      instrument_type: row.instrument_type ?? '',
      resolution: row.resolution != null ? String(row.resolution) : '',
      gauge_rr_pct: row.gauge_rr_pct != null ? String(row.gauge_rr_pct) : '',
      last_calibrated_date: row.last_calibrated_date ?? '',
      next_due_date: row.next_due_date ?? '',
      calibration_interval_days: row.calibration_interval_days != null ? String(row.calibration_interval_days) : '',
      location: row.location ?? '',
      status: row.status ?? 'Active',
    })
    setFormError(null); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); resetForm() }

  const handleSave = async () => {
    if (!form.instrument_code.trim()) { setFormError('Instrument code is required.'); return }
    if (!form.instrument_name.trim()) { setFormError('Instrument name is required.'); return }
    setSaving(true); setFormError(null)
    const payload = {
      instrument_name: form.instrument_name.trim(),
      instrument_type: form.instrument_type || null,
      resolution: numOrNull(form.resolution),
      gauge_rr_pct: numOrNull(form.gauge_rr_pct),
      last_calibrated_date: form.last_calibrated_date || null,
      next_due_date: form.next_due_date || null,
      calibration_interval_days: intOrNull(form.calibration_interval_days),
      location: form.location || null,
      status: form.status || 'Active',
    }
    try {
      if (editingId) await updateInstrument(editingId, payload)
      else await createInstrument({ instrument_code: form.instrument_code.trim(), ...payload })
      closeModal(); load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setFormError(ax?.response?.data?.detail ?? 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (row: Instrument) => {
    if (!window.confirm(`Delete instrument ${row.instrument_code}? It will be marked Deleted and hidden from the list.`)) return
    try { await deleteInstrument(row.id); load() }
    catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      alert(ax?.response?.data?.detail ?? 'Delete failed.')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) => [r.instrument_code, r.instrument_name, r.instrument_type, r.location].some((v) => (v ?? '').toLowerCase().includes(q)))
    : rows

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Measurement Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Measuring &amp; inspection equipment - resolution, gauge R&amp;R, calibration
            <span className="text-gray-400"> &middot; {rows.length} instrument{rows.length === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"><Plus className="w-4 h-4" /> New Instrument</button>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, name, type, location..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm" />
      </div>

      {loadError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Code</th>
              <th className="text-left font-semibold px-4 py-3">Name</th>
              <th className="text-left font-semibold px-4 py-3">Type</th>
              <th className="text-right font-semibold px-4 py-3">Resolution</th>
              <th className="text-right font-semibold px-4 py-3">Gauge R&amp;R %</th>
              <th className="text-left font-semibold px-4 py-3">Next Due</th>
              <th className="text-center font-semibold px-4 py-3">Cal Status</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 animate-pulse">Loading instruments...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{rows.length === 0 ? 'No instruments. Click "New Instrument" to add one.' : 'No instruments match your search.'}</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-800">{row.instrument_code}</td>
                <td className="px-4 py-3 text-gray-600">{row.instrument_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.instrument_type || '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.resolution != null ? row.resolution : '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {row.gauge_rr_pct != null ? (
                    <span className={row.gauge_rr_pct > 10 ? 'text-red-600 font-semibold' : row.gauge_rr_pct > 0 ? 'text-emerald-600' : ''}>{row.gauge_rr_pct}</span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-gray-600">{row.next_due_date || '-'}</td>
                <td className="px-4 py-3 text-center">
                  {row.computed_overdue ? (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Overdue</span>
                  ) : row.in_cal ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> In cal</span>
                  ) : <span className="text-gray-400 text-xs">{row.status || '-'}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(row)} title="Edit" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-violet-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(row)} title="Delete" className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Instrument' : 'New Instrument'}</h2>
              <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Instrument Code <span className="text-red-500">*</span></label>
                <input value={form.instrument_code} onChange={(e) => setForm({ ...form, instrument_code: e.target.value })} disabled={!!editingId} placeholder="e.g. CMM-01" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Instrument Name <span className="text-red-500">*</span></label>
                <input value={form.instrument_name} onChange={(e) => setForm({ ...form, instrument_name: e.target.value })} placeholder="e.g. Zeiss Contura CMM" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Type</label>
                <select value={form.instrument_type} onChange={(e) => setForm({ ...form, instrument_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
                  <option value="">-</option>
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. QC Lab" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Resolution (mm)</label>
                <input type="number" step="0.0001" value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} placeholder="e.g. 0.001" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Gauge R&amp;R (%)</label>
                <input type="number" step="0.1" value={form.gauge_rr_pct} onChange={(e) => setForm({ ...form, gauge_rr_pct: e.target.value })} placeholder="&lt;10 acceptable" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Last Calibrated</label>
                <input type="date" value={form.last_calibrated_date} onChange={(e) => setForm({ ...form, last_calibrated_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Next Due</label>
                <input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Cal Interval (days)</label>
                <input type="number" value={form.calibration_interval_days} onChange={(e) => setForm({ ...form, calibration_interval_days: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {formError && <div className="col-span-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{formError}</div>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
