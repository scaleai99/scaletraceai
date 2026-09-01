/**
 * SpecificationMasterPage - Specification Master (Masters group).
 *
 * The approved aerospace/defence specification library (AMS / MIL / ASTM /
 * JSS) referenced by RFQ, Configuration Review, Special Process and Spec-AI.
 * Built to the STABLE Customer/Company standard: real data only (NO demo
 * fallback), mandatory spec_number enforced on the frontend (backend also
 * rejects), a real resetForm on "new", and soft-delete (status -> Deleted,
 * row kept for FK integrity, filtered from the list).
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, Search, X, ShieldCheck } from 'lucide-react'
import {
  listSpecifications, createSpecification, updateSpecification, deleteSpecification,
  type Specification,
} from '../../api/specificationApi'

const CATEGORY_OPTIONS = ['heat treatment', 'coatings', 'NDT', 'welding', 'composites', 'other']

interface FormState {
  spec_number: string
  spec_title: string
  current_revision: string
  process_category: string
  scale_qualified: boolean
  qualification_expiry: string
}

const EMPTY_FORM: FormState = {
  spec_number: '', spec_title: '', current_revision: '',
  process_category: '', scale_qualified: false, qualification_expiry: '',
}

export function SpecificationMasterPage() {
  const [rows, setRows] = useState<Specification[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [qualifiedOnly, setQualifiedOnly] = useState(false)

  // modal / form
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setLoadError(null)
    listSpecifications({
      search: search || undefined,
      process_category: category || undefined,
      scale_qualified: qualifiedOnly || undefined,
    })
      .then(setRows)
      .catch((err: unknown) => {
        const ax = err as { response?: { data?: { detail?: string } } }
        setLoadError(ax?.response?.data?.detail ?? 'Failed to load specifications')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [search, category, qualifiedOnly])

  useEffect(() => { load() }, [load])

  // resetForm: clears every field back to empty "new" state (rule 3)
  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setFormError(null) }

  const openNew = () => { resetForm(); setShowModal(true) }

  const openEdit = (row: Specification) => {
    setEditingId(row.id)
    setForm({
      spec_number: row.spec_number,
      spec_title: row.spec_title ?? '',
      current_revision: row.current_revision ?? '',
      process_category: row.process_category ?? '',
      scale_qualified: !!row.scale_qualified,
      qualification_expiry: row.qualification_expiry ?? '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); resetForm() }

  const handleSave = async () => {
    // mandatory-field enforcement (frontend blocks; backend also 400s)
    if (!form.spec_number.trim()) { setFormError('Specification number is required.'); return }
    setSaving(true); setFormError(null)
    const payload = {
      spec_title: form.spec_title || null,
      current_revision: form.current_revision || null,
      process_category: form.process_category || null,
      scale_qualified: form.scale_qualified,
      qualification_expiry: form.qualification_expiry || null,
    }
    try {
      if (editingId) {
        await updateSpecification(editingId, payload)
      } else {
        await createSpecification({ spec_number: form.spec_number.trim(), ...payload })
      }
      closeModal()
      load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setFormError(ax?.response?.data?.detail ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: Specification) => {
    if (!window.confirm(`Delete specification ${row.spec_number}? It will be marked Deleted and hidden from the list.`)) return
    try {
      await deleteSpecification(row.id)
      load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      alert(ax?.response?.data?.detail ?? 'Delete failed.')
    }
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Specification Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Approved aerospace / defence specifications (AMS / MIL / ASTM / JSS)
            <span className="text-gray-400"> &middot; {rows.length} spec{rows.length === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="w-4 h-4" /> New Specification
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spec number or title..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 px-3">
          <input type="checkbox" checked={qualifiedOnly} onChange={(e) => setQualifiedOnly(e.target.checked)} />
          Scale-qualified only
        </label>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Spec Number</th>
              <th className="text-left font-semibold px-4 py-3">Title</th>
              <th className="text-left font-semibold px-4 py-3">Revision</th>
              <th className="text-left font-semibold px-4 py-3">Category</th>
              <th className="text-left font-semibold px-4 py-3">Qualified</th>
              <th className="text-left font-semibold px-4 py-3">Expiry</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 animate-pulse">Loading specifications...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No specifications. Click "New Specification" to add one.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-800">{row.spec_number}</td>
                <td className="px-4 py-3 text-gray-600">{row.spec_title || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.current_revision || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.process_category || '-'}</td>
                <td className="px-4 py-3">
                  {row.scale_qualified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold"><ShieldCheck className="w-3.5 h-3.5" /> Qualified</span>
                  ) : <span className="text-gray-400 text-xs">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{row.qualification_expiry || '-'}</td>
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

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Specification' : 'New Specification'}</h2>
              <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Spec Number <span className="text-red-500">*</span></label>
                <input
                  value={form.spec_number}
                  onChange={(e) => setForm({ ...form, spec_number: e.target.value })}
                  disabled={!!editingId}
                  placeholder="e.g. AMS2750 or MIL-DTL-5541"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Title</label>
                <input value={form.spec_title} onChange={(e) => setForm({ ...form, spec_title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Revision</label>
                  <input value={form.current_revision} onChange={(e) => setForm({ ...form, current_revision: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Category</label>
                  <select value={form.process_category} onChange={(e) => setForm({ ...form, process_category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
                    <option value="">-</option>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.scale_qualified} onChange={(e) => setForm({ ...form, scale_qualified: e.target.checked })} />
                  Scale-qualified (NADCAP / customer)
                </label>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Qualification Expiry</label>
                  <input type="date" value={form.qualification_expiry} onChange={(e) => setForm({ ...form, qualification_expiry: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                </div>
              </div>
              {formError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{formError}</div>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
