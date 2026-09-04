/**
 * ProcessMethodMasterPage - Process & Method Master (Masters group).
 *
 * Standard manufacturing methods with setup time, cutting parameters, tooling
 * and a per-hour rate. Feeds process planning (OP30) and costing. STABLE
 * standard: real data only, mandatory rate_code enforced both ends, real
 * resetForm, soft-delete.
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, Search, X } from 'lucide-react'
import {
  listMethods, createMethod, updateMethod, deleteMethod, type ProcessMethod,
} from '../../api/mastersApi'

interface FormState {
  rate_code: string
  method_name: string
  department: string
  description: string
  std_setup_min: string
  cutting_params: string
  tooling: string
  rate_inr_per_hour: string
}

const EMPTY_FORM: FormState = {
  rate_code: '', method_name: '', department: '', description: '',
  std_setup_min: '', cutting_params: '', tooling: '', rate_inr_per_hour: '',
}

const numOrNull = (s: string): number | null => (s.trim() === '' ? null : Number(s))
const intOrNull = (s: string): number | null => (s.trim() === '' ? null : parseInt(s, 10))

export function ProcessMethodMasterPage() {
  const [rows, setRows] = useState<ProcessMethod[]>([])
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
    listMethods()
      .then(setRows)
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        setLoadError(
          ax?.response?.status === 404
            ? 'Process & method service not found (404) - the backend needs a restart to load the new masters router.'
            : ax?.response?.data?.detail ?? 'Failed to load methods.'
        )
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setFormError(null) }
  const openNew = () => { resetForm(); setShowModal(true) }
  const openEdit = (row: ProcessMethod) => {
    setEditingId(row.id)
    setForm({
      rate_code: row.rate_code,
      method_name: row.method_name ?? '',
      department: row.department ?? '',
      description: row.description ?? '',
      std_setup_min: row.std_setup_min != null ? String(row.std_setup_min) : '',
      cutting_params: row.cutting_params ?? '',
      tooling: row.tooling ?? '',
      rate_inr_per_hour: row.rate_inr_per_hour != null ? String(row.rate_inr_per_hour) : '',
    })
    setFormError(null); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); resetForm() }

  const handleSave = async () => {
    if (!form.rate_code.trim()) { setFormError('Method / rate code is required.'); return }
    setSaving(true); setFormError(null)
    const payload = {
      method_name: form.method_name || null,
      department: form.department || null,
      description: form.description || null,
      std_setup_min: intOrNull(form.std_setup_min),
      cutting_params: form.cutting_params || null,
      tooling: form.tooling || null,
      rate_inr_per_hour: numOrNull(form.rate_inr_per_hour),
    }
    try {
      if (editingId) await updateMethod(editingId, payload)
      else await createMethod({ rate_code: form.rate_code.trim(), ...payload })
      closeModal(); load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setFormError(ax?.response?.data?.detail ?? 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (row: ProcessMethod) => {
    if (!window.confirm(`Delete method ${row.rate_code}? It will be marked Deleted and hidden from the list.`)) return
    try { await deleteMethod(row.id); load() }
    catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      alert(ax?.response?.data?.detail ?? 'Delete failed.')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) => [r.rate_code, r.method_name, r.department].some((v) => (v ?? '').toLowerCase().includes(q)))
    : rows

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process &amp; Method Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Standard methods, setup times, cutting parameters &amp; hourly rates
            <span className="text-gray-400"> &middot; {rows.length} method{rows.length === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"><Plus className="w-4 h-4" /> New Method</button>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, name, department..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm" />
      </div>

      {loadError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Code</th>
              <th className="text-left font-semibold px-4 py-3">Method</th>
              <th className="text-left font-semibold px-4 py-3">Department</th>
              <th className="text-right font-semibold px-4 py-3">Setup (min)</th>
              <th className="text-left font-semibold px-4 py-3">Tooling</th>
              <th className="text-right font-semibold px-4 py-3">Rate (INR/hr)</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 animate-pulse">Loading methods...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{rows.length === 0 ? 'No methods. Click "New Method" to add one.' : 'No methods match your search.'}</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-800">{row.rate_code}</td>
                <td className="px-4 py-3 text-gray-600">{row.method_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.department || '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.std_setup_min != null ? row.std_setup_min : '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.tooling || '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.rate_inr_per_hour != null ? row.rate_inr_per_hour : '-'}</td>
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
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Method' : 'New Method'}</h2>
              <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Method / Rate Code <span className="text-red-500">*</span></label>
                <input value={form.rate_code} onChange={(e) => setForm({ ...form, rate_code: e.target.value })} disabled={!!editingId} placeholder="e.g. TURN-STD" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Method Name</label>
                <input value={form.method_name} onChange={(e) => setForm({ ...form, method_name: e.target.value })} placeholder="e.g. CNC Turning - Standard" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Department</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Std Setup (min)</label>
                <input type="number" value={form.std_setup_min} onChange={(e) => setForm({ ...form, std_setup_min: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Rate (INR/hr)</label>
                <input type="number" step="0.01" value={form.rate_inr_per_hour} onChange={(e) => setForm({ ...form, rate_inr_per_hour: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Tooling</label>
                <input value={form.tooling} onChange={(e) => setForm({ ...form, tooling: e.target.value })} placeholder="e.g. CNMG insert, ID bar" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Cutting Parameters</label>
                <input value={form.cutting_params} onChange={(e) => setForm({ ...form, cutting_params: e.target.value })} placeholder="e.g. Vc 180 m/min, f 0.15 mm/rev, ap 1.0 mm" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
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
