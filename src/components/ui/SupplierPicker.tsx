/**
 * SupplierPicker — shared searchable supplier selector (Tier-B foundation).
 *
 * Loads suppliers once from the real API (Active-only by default, so only
 * Approved-Supplier-List suppliers are pickable for POs / jobs), then offers a
 * type-ahead dropdown. Controlled: parent holds the supplier_id, this returns
 * (supplierId, supplier) on select. No demo fallback — an empty list renders an
 * honest empty state.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, X, Loader2 } from 'lucide-react'
import { listSuppliers, Supplier } from '../../api/supplierApi'

export interface SupplierPickerProps {
  label?: string
  value: string | null
  onChange: (supplierId: string | null, supplier?: Supplier) => void
  required?: boolean
  /** When true (default) only Active ASL suppliers are loaded/selectable. */
  activeOnly?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
  /** Allow clearing the selection back to null. Default true. */
  clearable?: boolean
}

export function SupplierPicker({
  label,
  value,
  onChange,
  required,
  activeOnly = true,
  placeholder = 'Select a supplier…',
  error,
  disabled,
  clearable = true,
}: SupplierPickerProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    listSuppliers(activeOnly ? { asl_status: 'Active', limit: 200 } : { limit: 200 })
      .then((rows) => { if (!cancelled) setSuppliers(rows) })
      .catch(() => { if (!cancelled) setLoadError('Could not load suppliers') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeOnly])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const selected = useMemo(
    () => suppliers.find((s) => s.id === value) ?? null,
    [suppliers, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter(
      (s) =>
        s.supplier_name.toLowerCase().includes(q) ||
        s.supplier_code.toLowerCase().includes(q),
    )
  }, [suppliers, query])

  const label_of = (s: Supplier) => `${s.supplier_code} — ${s.supplier_name}`

  return (
    <div className="w-full" ref={boxRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white text-left transition-colors
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <span className={selected ? 'text-gray-800 truncate' : 'text-gray-400 truncate'}>
            {selected ? label_of(selected) : (value && !selected ? value : placeholder)}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {clearable && selected && !disabled && (
              <X
                size={14}
                className="text-gray-300 hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); onChange(null); setQuery('') }}
              />
            )}
            <ChevronDown size={14} className="text-gray-400" />
          </span>
        </button>

        {open && !disabled && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code or name…"
                className="w-full text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-gray-400">
                  <Loader2 size={13} className="animate-spin" /> Loading suppliers…
                </div>
              ) : loadError ? (
                <div className="px-3 py-4 text-xs text-red-600 text-center">{loadError}</div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">
                  {suppliers.length === 0
                    ? (activeOnly ? 'No active suppliers found.' : 'No suppliers found.')
                    : 'No match.'}
                </div>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { onChange(s.id, s); setOpen(false); setQuery('') }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 flex flex-col
                      ${s.id === value ? 'bg-amber-50' : ''}`}
                  >
                    <span className="text-gray-800 font-medium truncate">{s.supplier_name}</span>
                    <span className="text-gray-400">{s.supplier_code}{s.supply_category ? ` · ${s.supply_category}` : ''}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default SupplierPicker
