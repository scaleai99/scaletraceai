/**
 * ItemMasterPage - Module 05: Item Master
 *
 * Full item master with 4 tabs: Design | Sales | Inventory | Commercial
 * PDF drawing upload triggers AI extraction; fields auto-populate with
 * confidence badges. Save / Reset / Delete persist to /api/v1/items.
 */
import { useCallback, useEffect, useState } from 'react'
import { Save, RotateCcw, Trash2, FolderOpen, Check, AlertTriangle } from 'lucide-react'
import { DesignTab } from './item-master/tabs/DesignTab'
import { SalesTab } from './item-master/tabs/SalesTab'
import { InventoryTab } from './item-master/tabs/InventoryTab'
import { CommercialTab } from './item-master/tabs/CommercialTab'
import { useItemMasterStore } from '../../store/itemMasterStore'
import { listItems, createItem, updateItem, deleteItem, type ItemRecord } from '../../api/itemApi'

type TabId = 'design' | 'sales' | 'inventory' | 'commercial'

const TABS: { id: TabId; label: string }[] = [
  { id: 'design', label: 'Design' },
  { id: 'sales', label: 'Sales' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'commercial', label: 'Commercial' },
]

const num = (v: string | undefined) => {
  const n = parseFloat(String(v ?? '').replace(/[^\d.\-]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function ItemMasterPage() {
  const [activeTab, setActiveTab] = useState<TabId>('design')
  const form = useItemMasterStore((s) => s.form)
  const resetForm = useItemMasterStore((s) => s.resetForm)
  const updateOverview = useItemMasterStore((s) => s.updateOverview)

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [items, setItems] = useState<ItemRecord[]>([])
  const [showList, setShowList] = useState(false)

  const ov = form.overview

  const loadItems = useCallback(() => {
    listItems().then(r => setItems(Array.isArray(r) ? r : [])).catch(() => setItems([]))
  }, [])
  useEffect(() => { loadItems() }, [loadItems])

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const buildPayload = () => ({
    item_code: (ov.partNo || ov.drawingNo || '').trim() || undefined,
    part_no: ov.partNo || null,
    drawing_no: ov.drawingNo || null,
    revision: ov.revision || null,
    part_name: ov.partName || null,
    item_short_desc: ov.itemShortDesc || null,
    item_long_desc: ov.itemLongDesc || null,
    item_category: ov.itemCategory || null,
    unit_of_measure: ov.unitOfMeasure || 'Nos',
    customer_name: ov.customer || null,
    material_spec: ov.materialSpec || null,
    surface_treatment: ov.surfaceTreatment || null,
    heat_treatment: ov.heatTreatment || null,
    special_process: ov.specialProcess || null,
    length_mm: num(ov.length),
    width_mm: num(ov.width),
    thickness_mm: num(ov.thickness),
    status: ov.status || 'Active',
    remarks: ov.remarks || null,
    form_data: form as unknown as Record<string, unknown>,
  })

  const handleSave = async () => {
    if (!ov.partNo && !ov.drawingNo) {
      flash('err', 'Enter an Item No. or Drawing No. before saving.')
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload()
      const saved = currentId ? await updateItem(currentId, payload) : await createItem(payload)
      setCurrentId(saved.id)
      flash('ok', `Saved ${saved.item_code}`)
      loadItems()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      flash('err', err?.response?.data?.detail ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentId) { flash('err', 'Nothing saved to delete.'); return }
    if (!window.confirm('Delete this item master record? This cannot be undone.')) return
    try {
      await deleteItem(currentId)
      setCurrentId(null)
      resetForm()
      flash('ok', 'Item deleted')
      loadItems()
    } catch {
      flash('err', 'Delete failed')
    }
  }

  const handleReset = () => {
    if (!window.confirm('Clear the form? Unsaved changes will be lost.')) return
    resetForm()
    setCurrentId(null)
  }

  const loadRecord = (rec: ItemRecord) => {
    resetForm()
    updateOverview({
      partNo: rec.part_no ?? rec.item_code ?? '',
      drawingNo: rec.drawing_no ?? '',
      revision: rec.revision ?? '',
      partName: rec.part_name ?? '',
      itemShortDesc: rec.item_short_desc ?? '',
      itemLongDesc: rec.item_long_desc ?? '',
      itemCategory: (rec.item_category ?? '') as import('../../types/item-master').ItemCategory | '',
      materialSpec: rec.material_spec ?? '',
      length: rec.length_mm != null ? String(rec.length_mm) : '',
      width: rec.width_mm != null ? String(rec.width_mm) : '',
      thickness: rec.thickness_mm != null ? String(rec.thickness_mm) : '',
    })
    setCurrentId(rec.id)
    setShowList(false)
    flash('ok', `Loaded ${rec.item_code}`)
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 05 - Upload a drawing PDF to auto-populate all fields using AI extraction
          </p>
        </div>
        {currentId && (
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 whitespace-nowrap">
            Saved record
          </span>
        )}
      </div>

      {/* Toast */}
      {msg && (
        <div
          className={`mb-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
            msg.kind === 'ok'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {msg.kind === 'ok' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Card with tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-700 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'design' && <DesignTab />}
          {activeTab === 'sales' && <SalesTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'commercial' && <CommercialTab />}
        </div>

        {/* Action bar */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => { setShowList((v) => !v); loadItems() }}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1.5"
          >
            <FolderOpen className="w-4 h-4" />
            Saved items ({items.length})
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={!currentId}
              className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={handleReset}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving"¦' : currentId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

        {/* Saved items list */}
        {showList && (
          <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-4">No saved items yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-2 font-medium">Item Code</th>
                    <th className="text-left px-3 py-2 font-medium">Description</th>
                    <th className="text-left px-3 py-2 font-medium">Drawing No.</th>
                    <th className="text-right px-6 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-1.5 font-mono">{it.item_code}</td>
                      <td className="px-3 py-1.5 text-gray-600">{it.item_short_desc ?? it.part_name ?? '""'}</td>
                      <td className="px-3 py-1.5 text-gray-600">{it.drawing_no ?? '""'}</td>
                      <td className="px-6 py-1.5 text-right">
                        <button
                          onClick={() => loadRecord(it)}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white rounded px-2 py-0.5"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

