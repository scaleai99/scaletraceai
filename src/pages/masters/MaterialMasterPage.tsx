/**
 * MaterialMasterPage - Material Master (Masters group).
 *
 * Raw material / stock master with spec, density, price, stock position, lead
 * time and export-control (ECCN) / HSN codes. Feeds costing, MRP and export
 * classification. STABLE standard: real data only, mandatory material_code
 * both ends, real resetForm, soft-delete.
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, Search, X } from 'lucide-react'
import {
  listMaterials, createMaterial, updateMaterial, deleteMaterial, type Material,
} from '../../api/mastersApi'

const UOM_OPTIONS = ['kg', 'each', 'm', 'mm', 'sq.m', 'litre', 'sheet', 'bar', 'other']

interface FormState {
  material_code: string
  material_spec: string
  description: string
  density_g_cm3: string
  unit_price_inr: string
  uom: string
  on_hand_qty: string
  on_order_qty: string
  lead_days: string
  eccn: string
  hsn_code: string
}

const EMPTY_FORM: FormState = {
  material_code: '', material_spec: '', description: '', density_g_cm3: '',
  unit_price_inr: '', uom: '', on_hand_qty: '', on_order_qty: '', lead_days: '',
  eccn: '', hsn_code: '',
}

const numOrNull = (s: string): number | null => (s.trim() === '' ? null : Number(s))
const intOrNull = (s: string): number | null => (s.trim() === '' ? null : parseInt(s, 10))

export function MaterialMasterPage() {
  const [rows, setRows] = useState<Material[]>([])
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
    listMaterials()
      .then(setRows)
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        setLoadError(
          ax?.response?.status === 404
            ? 'Material master service not found (404) - the backend needs a restart to load the new masters router.'
            : ax?.response?.data?.detail ?? 'Failed to load materials.'
        )
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setFormError(null) }
  const openNew = () => { resetForm(); setShowModal(true) }
  const openEdit = (row: Material) => {
    setEditingId(row.id)
    setForm({
      material_code: row.material_code,
      material_spec: row.material_spec ?? '',
      description: row.description ?? '',
      density_g_cm3: row.density_g_cm3 != null ? String(row.density_g_cm3) : '',
      unit_price_inr: row.unit_price_inr != null ? String(row.unit_price_inr) : '',
      uom: row.uom ?? '',
      on_hand_qty: row.on_hand_qty != null ? String(row.on_hand_qty) : '',
      on_order_qty: row.on_order_qty != null ? String(row.on_order_qty) : '',
      lead_days: row.lead_days != null ? String(row.lead_days) : '',
      eccn: row.eccn ?? '',
      hsn_code: row.hsn_code ?? '',
    })
    setFormError(null); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); resetForm() }

  const handleSave = async () => {
    if (!form.material_code.trim()) { setFormError('Material code is required.'); return }
    setSaving(true); setFormError(null)
    const payload = {
      material_spec: form.material_spec || null,
      description: form.description || null,
      density_g_cm3: numOrNull(form.density_g_cm3),
      unit_price_inr: numOrNull(form.unit_price_inr),
      uom: form.uom || null,
      on_hand_qty: numOrNull(form.on_hand_qty),
      on_order_qty: numOrNull(form.on_order_qty),
      lead_days: intOrNull(form.lead_days),
      eccn: form.eccn || null,
      hsn_code: form.hsn_code || null,
    }
    try {
      if (editingId) await updateMaterial(editingId, payload)
      else await createMaterial({ material_code: form.material_code.trim(), ...payload })
      closeModal(); load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setFormError(ax?.response?.data?.detail ?? 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (row: Material) => {
    if (!window.confirm(`Delete material ${row.material_code}? It will be marked Deleted and hidden from the list.`)) return
    try { await deleteMaterial(row.id); load() }
    catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      alert(ax?.response?.data?.detail ?? 'Delete failed.')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) => [r.material_code, r.material_spec, r.description, r.eccn].some((v) => (v ?? '').toLowerCase().includes(q)))
    : rows

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Raw material / stock - spec, price, stock position, lead time, ECCN / HSN
            <span className="text-gray-400"> &middot; {rows.length} material{rows.length === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"><Plus className="w-4 h-4" /> New Material</button>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, spec, description, ECCN..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm" />
      </div>

      {loadError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Code</th>
              <th className="text-left font-semibold px-4 py-3">Spec</th>
              <th className="text-left font-semibold px-4 py-3">UoM</th>
              <th className="text-right font-semibold px-4 py-3">Price (INR)</th>
              <th className="text-right font-semibold px-4 py-3">On Hand</th>
              <th className="text-right font-semibold px-4 py-3">Lead (d)</th>
              <th className="text-left font-semibold px-4 py-3">ECCN</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 animate-pulse">Loading materials...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{rows.length === 0 ? 'No materials. Click "New Material" to add one.' : 'No materials match your search.'}</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-800">{row.material_code}</td>
                <td className="px-4 py-3 text-gray-600">{row.material_spec || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.uom || '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.unit_price_inr != null ? row.unit_price_inr : '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.on_hand_qty != null ? row.on_hand_qty : '-'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.lead_days != null ? row.lead_days : '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.eccn || '-'}</td>
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
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Material' : 'New Material'}</h2>
              <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Material Code <span className="text-red-500">*</span></label>
                <input value={form.material_code} onChange={(e) => setForm({ ...form, material_code: e.target.value })} disabled={!!editingId} placeholder="e.g. TI-6AL4V-BAR" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Spec (AMS / alloy)</label>
                <input value={form.material_spec} onChange={(e) => setForm({ ...form, material_spec: e.target.value })} placeholder="e.g. AMS 4928" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">UoM</label>
                <select value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
                  <option value="">-</option>
                  {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Density (g/cm3)</label>
                <input type="number" step="0.001" value={form.density_g_cm3} onChange={(e) => setForm({ ...form, density_g_cm3: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Unit Price (INR)</label>
                <input type="number" step="0.01" value={form.unit_price_inr} onChange={(e) => setForm({ ...form, unit_price_inr: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Lead Time (days)</label>
                <input type="number" value={form.lead_days} onChange={(e) => setForm({ ...form, lead_days: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">On-Hand Qty</label>
                <input type="number" step="0.001" value={form.on_hand_qty} onChange={(e) => setForm({ ...form, on_hand_qty: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">On-Order Qty</label>
                <input type="number" step="0.001" value={form.on_order_qty} onChange={(e) => setForm({ ...form, on_order_qty: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">ECCN / Export</label>
                <input value={form.eccn} onChange={(e) => setForm({ ...form, eccn: e.target.value })} placeholder="e.g. 1C002 / EAR99" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">HSN Code</label>
                <input value={form.hsn_code} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
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
