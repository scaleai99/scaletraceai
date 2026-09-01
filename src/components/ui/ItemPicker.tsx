/**
 * ItemPicker — searchable combobox over the Item / Part Master.
 * Used on Sales line-item forms so a part is resolved ONCE against the master
 * (enter-once/reuse-everywhere) instead of being re-typed free-text.
 * Emits the selected item's id plus its part_number/drawing/revision so the
 * host form can auto-fill and store item_id.
 */
import { useEffect, useRef, useState } from 'react'
import { listItems, type ItemRecord } from '../../api/itemApi'

export interface ItemPickerSelection {
  item_id: string
  part_number: string | null
  drawing_number: string | null
  drawing_revision: string | null
  item_name: string | null
}

interface ItemPickerProps {
  value?: string | null            // selected item_id
  onSelect: (sel: ItemPickerSelection | null) => void
  placeholder?: string
  className?: string
}

export function ItemPicker({ value, onSelect, placeholder = 'Search part / item master…', className = '' }: ItemPickerProps) {
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setLoading(true)
    listItems({})
      .then((rows) => setItems(Array.isArray(rows) ? rows.filter((r) => r.status !== 'Deleted') : []))
      .catch((e) => setError(e?.response?.data?.detail || e?.message || 'Failed to load items'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selected = items.find((i) => i.id === value) || null
  const q = query.toLowerCase()
  const filtered = q
    ? items.filter((i) =>
        (i.item_code || '').toLowerCase().includes(q) ||
        (i.item_name || '').toLowerCase().includes(q) ||
        (i.part_number || '').toLowerCase().includes(q))
    : items.slice(0, 50)

  const label = selected ? `${selected.item_code}${selected.item_name ? ' — ' + selected.item_name : ''}` : ''

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <input
        value={open ? query : label}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setOpen(true); setQuery('') }}
        placeholder={loading ? 'Loading items…' : placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
      />
      {selected && !open && (
        <button type="button" onClick={() => onSelect(null)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">clear</button>
      )}
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {error && <div className="px-3 py-2 text-xs text-rose-600">{error}</div>}
          {!error && filtered.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No matching items.</div>}
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => {
                onSelect({ item_id: i.id, part_number: i.part_number ?? null, drawing_number: (i as any).drawing_number ?? null, drawing_revision: i.revision ?? null, item_name: i.item_name ?? null })
                setOpen(false); setQuery('')
              }}
              className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-indigo-50"
            >
              <span className="font-mono text-indigo-600">{i.item_code}</span>
              <span className="flex-1 truncate text-gray-600">{i.item_name || i.part_number || ''}</span>
              {i.revision && <span className="text-xs text-gray-400">Rev {i.revision}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
