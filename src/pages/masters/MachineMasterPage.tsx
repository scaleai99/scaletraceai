/**
 * MachineMasterPage - Machine Master (Masters group).
 *
 * Shop machine tools with capability data (positional_capability drives the
 * feasibility 4:1 tolerance rule at OP50). Built to the STABLE Customer/Company
 * standard: real data only (NO demo fallback), mandatory code+name enforced on
 * the frontend (backend also 422s), a real resetForm on "new", and soft-delete
 * (status -> Deleted, row kept for FK integrity, filtered from the list).
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, Search, X, CheckCircle2 } from 'lucide-react'
import {
  listMachines, createMachine, updateMachine, deleteMachine, type Machine,
} from '../../api/mastersApi'

const TYPE_OPTIONS = ['CNC Turning', 'CNC Milling', 'CNC Turn-Mill', 'VMC', 'HMC', 'Grinding', 'EDM', 'Inspection', 'Manual', 'Other']

interface FormState {
  machine_code: string
  machine_name: string
  machine_type: string
  department: string
  axes: string
  envelope: string
  mhr: string
  positional_capability: string
  oee: string
  is_available: boolean
}

const EMPTY_FORM: FormState = {
  machine_code: '', machine_name: '', machine_type: '', department: '',
  axes: '', envelope: '', mhr: '', positional_capability: '', oee: '', is_available: true,
}

const numOrNull = (s: string): number | null => (s.trim() === '' ? null : Number(s))
const intOrNull = (s: string): number | null => (s.trim() === '' ? null : parseInt(s, 10))

export function MachineMasterPage() {
  const [rows, setRows] = useState<Machine[]>([])
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
    listMachines()
      .then(setRows)
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        const s = ax?.response?.status
        setLoadError(
          s === 404
            ? 'Machine master service not found (404) - the backend needs a restart to load the new masters router.'
            : ax?.response?.data?.detail ?? 'Failed to load machines.'
        )
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setFormError(null) }
  const openNew = () => { resetForm(); setShowModal(true) }
  const openEdit = (row: Machine) => {
    setEditingId(row.id)
    setForm({
      machine_code: row.machine_code,
      machine_name: row.machine_name ?? '',
      machine_type: row.machine_type ?? '',
      department: row.department ?? '',
      axes: row.axes ?? '',
      envelope: row.envelope ?? '',
      mhr: row.mhr != null ? String(row.mhr) : '',
      positional_capability: row.positional_capability != null ? String(row.positional_capability) : '',
      oee: row.oee != null ? String(row.oee) : '',
      is_available: row.is_available ?? true,
    })
    setFormError(null); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); resetForm() }

  const handleSave = async () => {
    if (!form.machine_code.trim()) { setFormError('Machine code is required.'); return }
    if (!form.machine_name.trim()) { setFormError('Machine name is required.'); return }
    setSaving(true); setFormError(null)
    const payload = {
      machine_name: form.machine_name.trim(),
      machine_type: form.machine_type || null,
      department: form.department || null,
      axes: form.axes || null,
      envelope: form.envelope || null,
      mhr: numOrNull(form.mhr),
      positional_capability: numOrNull(form.positional_capability),
      oee: intOrNull(form.oee),
      is_available: form.is_available,
    }
    try {
      if (editingId) await updateMachine(editingId, payload)
      else await createMachine({ machine_code: form.machine_code.trim(), ...payload })
      closeModal(); load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setFormError(ax?.response?.data?.detail ?? 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (row: Machine) => {
    if (!window.confirm(`Delete machine ${row.machine_code}? It will be marked Deleted and hidden from the list.`)) return
    try { await deleteMachine(row.id); load() }
    catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      alert(ax?.response?.data?.detail ?? 'Delete failed.')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) =>
        [r.machine_code, r.machine_name, r.machine_type, r.department]
          .some((v) => (v ?? '').toLowerCase().includes(q)))
    : rows

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machine Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Shop machine tools &amp; capability - feeds feasibility and process planning
            <span className="text-gray-400"> &middot; {rows.length} machine{rows.length === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"><Plus className="w-4 h-4" /> New Machine</button>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, name, type, department..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm" />
      </div>

      {loadError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Code</th>
              <th className="text-left font-semibold px-4 py-3">Name</th>
              <th className="text-left font-semibold px-4 py-3">Type</th>
              <th className="text-left font-semibold px-4 py-3">Dept</th>
              <th className="text-left font-semibold px-4 py-3">Axes</th>
              <th className="text-right font-semibold px-4 py-3">MHR</th>
              <th className="text-right font-semibold px-4 py-3">Pos. Cap. (mm)</th>
              <th className="text-center font-semibold px-4 py-3">Available</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 animate-pulse">Loading machines...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">{rows.length === 0 ? 'No machines. Click "New Machine" to add one.' : 'No machines match your search.'}</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-800">{row.machine_code}</td>
                <td className="px-4 py-3 text-gray-600">{row.machine_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.machine_type || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.department || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.axes || '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.mhr != null ? row.mhr : '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.positional_capability != null ? row.positional_capability : <span className="text-amber-500" title="Enter to enable feasibility 4:1 checks">-</span>}</td>
                <td className="px-4 py-3 text-center">{row.is_available ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-400 text-xs">No</span>}</td>
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
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Machine' : 'New Machine'}</h2>
              <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Machine Code <span className="text-red-500">*</span></label>
                <input value={form.machine_code} onChange={(e) => setForm({ ...form, machine_code: e.target.value })} disabled={!!editingId} placeholder="e.g. MZ-01" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Machine Name <span className="text-red-500">*</span></label>
                <input value={form.machine_name} onChange={(e) => setForm({ ...form, machine_name: e.target.value })} placeholder="e.g. Mazak Integrex i-200" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Type</label>
                <select value={form.machine_type} onChange={(e) => setForm({ ...form, machine_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
                  <option value="">-</option>
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Department</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Machining" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Axes</label>
                <input value={form.axes} onChange={(e) => setForm({ ...form, axes: e.target.value })} placeholder="e.g. 5-axis" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Work Envelope</label>
                <input value={form.envelope} onChange={(e) => setForm({ ...form, envelope: e.target.value })} placeholder="e.g. 650 x 400 x 500" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Machine-Hour Rate (INR)</label>
                <input type="number" step="0.01" value={form.mhr} onChange={(e) => setForm({ ...form, mhr: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Positional Capability (mm)</label>
                <input type="number" step="0.001" value={form.positional_capability} onChange={(e) => setForm({ ...form, positional_capability: e.target.value })} placeholder="e.g. 0.01" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">OEE (%)</label>
                <input type="number" value={form.oee} onChange={(e) => setForm({ ...form, oee: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-6">
                <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
                Available for scheduling
              </label>
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
