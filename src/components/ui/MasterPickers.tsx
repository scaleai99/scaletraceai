/**
 * MasterPickers - searchable comboboxes over the new nine-master tables.
 *
 * MaterialPicker / MachinePicker / MethodPicker each load their master from
 * /api/v1/masters/* and let the user pick a real master record instead of
 * re-typing free text. They are STRING-valued (not id-valued) because the RFQ
 * line-item fields they feed are strings (material_spec, and the
 * manufacturing_route entries {op_no, operation, machine}).
 *
 * Free text is deliberately still allowed: typing sets the value directly, so
 * legacy/off-master values keep working and nothing is silently dropped. The
 * master list is offered as the convenient, correct choice - not a hard gate.
 * Real data only: an empty master renders an honest "no records" hint that
 * points at the master page, never a fabricated option.
 */
import { useEffect, useRef, useState } from 'react'
import {
  listMaterials, listMachines, listMethods,
  type Material, type Machine, type ProcessMethod,
} from '../../api/mastersApi'

interface Option { key: string; value: string; primary: string; secondary?: string; trailing?: string }

interface ComboProps {
  value: string
  onChange: (v: string) => void
  options: Option[]
  loading: boolean
  error: string | null
  emptyHint: string
  placeholder: string
  className?: string
}

function MasterCombo({ value, onChange, options, loading, error, emptyHint, placeholder, className = '' }: ComboProps) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const q = (value || '').toLowerCase()
  const filtered = q
    ? options.filter((o) => o.primary.toLowerCase().includes(q) || (o.secondary || '').toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
    : options

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? 'Loading...' : placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {error && <div className="px-3 py-2 text-xs text-rose-600">{error}</div>}
          {!error && !loading && options.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">{emptyHint}</div>}
          {!error && options.length > 0 && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">No master record matches - the typed value will be saved as entered.</div>
          )}
          {filtered.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-indigo-50"
            >
              <span className="font-mono text-indigo-600">{o.primary}</span>
              {o.secondary && <span className="flex-1 truncate text-gray-600">{o.secondary}</span>}
              {o.trailing && <span className="shrink-0 text-xs text-gray-400">{o.trailing}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function useMaster<T>(loader: () => Promise<T[]>) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    setLoading(true)
    loader()
      .then((r) => { if (alive) setRows(Array.isArray(r) ? r : []) })
      .catch((e: unknown) => {
        const ax = e as { response?: { status?: number; data?: { detail?: string } }; message?: string }
        if (alive) setError(ax?.response?.status === 404
          ? 'Master service not found (404) - backend restart needed.'
          : ax?.response?.data?.detail ?? ax?.message ?? 'Failed to load master.')
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { rows, loading, error }
}

interface PickerProps { value: string; onChange: (v: string) => void; className?: string }

/** Material Master -> RFQ line item `material_spec`. Stores the AMS/alloy spec (falls back to the code). */
export function MaterialPicker({ value, onChange, className }: PickerProps) {
  const { rows, loading, error } = useMaster<Material>(listMaterials)
  const options: Option[] = rows.map((m) => ({
    key: m.id,
    value: m.material_spec || m.material_code,
    primary: m.material_code,
    secondary: m.material_spec || m.description || '',
    trailing: m.eccn || undefined,
  }))
  return <MasterCombo value={value} onChange={onChange} options={options} loading={loading} error={error}
    emptyHint="No materials in the Material Master yet - add them under Masters > Material."
    placeholder="Search Material Master or type a spec..." className={className} />
}

/** Machine Master -> manufacturing_route entry `machine`. Stores "CODE - Name". */
export function MachinePicker({ value, onChange, className }: PickerProps) {
  const { rows, loading, error } = useMaster<Machine>(listMachines)
  const options: Option[] = rows.map((m) => ({
    key: m.id,
    value: m.machine_name ? `${m.machine_code} - ${m.machine_name}` : m.machine_code,
    primary: m.machine_code,
    secondary: m.machine_name || '',
    trailing: m.positional_capability != null ? `+/-${m.positional_capability}` : undefined,
  }))
  return <MasterCombo value={value} onChange={onChange} options={options} loading={loading} error={error}
    emptyHint="No machines in the Machine Master yet - add them under Masters > Machine."
    placeholder="Search Machine Master or type a machine..." className={className} />
}

/** Process & Method Master -> manufacturing_route entry `operation`. Stores the method name. */
export function MethodPicker({ value, onChange, className }: PickerProps) {
  const { rows, loading, error } = useMaster<ProcessMethod>(listMethods)
  const options: Option[] = rows.map((p) => ({
    key: p.id,
    value: p.method_name || p.rate_code,
    primary: p.rate_code,
    secondary: p.method_name || '',
    trailing: p.rate_inr_per_hour != null ? `${p.rate_inr_per_hour}/hr` : undefined,
  }))
  return <MasterCombo value={value} onChange={onChange} options={options} loading={loading} error={error}
    emptyHint="No methods in the Process & Method Master yet - add them under Masters > Process & Methods."
    placeholder="Search Process & Method Master or type an operation..." className={className} />
}
