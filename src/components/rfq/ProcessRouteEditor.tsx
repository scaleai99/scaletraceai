/**
 * ProcessRouteEditor - edits an RFQ line item's manufacturing_route using the
 * Machine and Process & Method masters.
 *
 * manufacturing_route is stored on rfq_line_items as JSON:
 *   [{ op_no, operation, machine }]
 * The backend already accepts it on RFQLineItemUpdate, so this is a real
 * end-to-end write - no fabricated state. Operation comes from the Process &
 * Method Master and machine from the Machine Master (both still allow free
 * text so legacy routes keep working).
 */
import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { MachinePicker, MethodPicker } from '../ui/MasterPickers'
import { updateLineItem } from '../../api/rfqApi'

export interface RouteStep { op_no?: number | string; operation?: string; machine?: string }

interface Props {
  rfqId: string
  lineItemId: string
  route: unknown
  onSaved: () => void
  readOnly?: boolean
}

function toRows(route: unknown): RouteStep[] {
  if (!Array.isArray(route)) return []
  return route.map((r, i) => {
    const o = (r ?? {}) as RouteStep
    return {
      op_no: o.op_no ?? (i + 1) * 10,
      operation: typeof o.operation === 'string' ? o.operation : '',
      machine: typeof o.machine === 'string' ? o.machine : '',
    }
  })
}

export function ProcessRouteEditor({ rfqId, lineItemId, route, onSaved, readOnly = false }: Props) {
  const [rows, setRows] = useState<RouteStep[]>(toRows(route))
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-sync when the selected line item (or its saved route) changes.
  useEffect(() => { setRows(toRows(route)); setEditing(false); setError(null) }, [lineItemId, route])

  const setRow = (i: number, patch: Partial<RouteStep>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const addRow = () =>
    setRows((prev) => [...prev, { op_no: (prev.length + 1) * 10, operation: '', machine: '' }])

  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i))

  const save = async () => {
    setBusy(true); setError(null)
    try {
      const clean = rows
        .filter((r) => (r.operation || '').trim() || (r.machine || '').trim())
        .map((r, i) => ({
          op_no: r.op_no === '' || r.op_no == null ? (i + 1) * 10 : Number(r.op_no),
          operation: (r.operation || '').trim(),
          machine: (r.machine || '').trim(),
        }))
      await updateLineItem(rfqId, lineItemId, { manufacturing_route: clean })
      setEditing(false)
      onSaved()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setError(typeof d === 'string' ? d : d ? JSON.stringify(d) : e?.message ?? 'Failed to save process route.')
    } finally { setBusy(false) }
  }

  if (!editing) {
    return (
      <div>
        {rows.length ? (
          <ol className="space-y-2 text-sm text-gray-700">
            {rows.map((r, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-gray-400 w-10 shrink-0">{r.op_no ?? (i + 1) * 10}</span>
                <span className="flex-1">{r.operation || <span className="text-gray-400">(no operation)</span>}</span>
                {r.machine && <span className="text-xs text-indigo-600 font-mono">{r.machine}</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-400">No process route captured on the selected line item yet.</p>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {rows.length ? 'Edit route' : 'Build route from masters'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-xs text-gray-400">No operations yet - add the first one below.</p>
      )}
      {rows.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={String(r.op_no ?? '')}
            onChange={(e) => setRow(i, { op_no: e.target.value })}
            className="w-16 shrink-0 rounded-lg border border-gray-300 px-2 py-2 text-sm font-mono"
            placeholder="10"
          />
          <MethodPicker value={r.operation ?? ''} onChange={(v) => setRow(i, { operation: v })} className="flex-1" />
          <MachinePicker value={r.machine ?? ''} onChange={(v) => setRow(i, { machine: v })} className="flex-1" />
          <button
            type="button"
            onClick={() => removeRow(i)}
            title="Remove operation"
            className="mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add operation
      </button>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => { setRows(toRows(route)); setEditing(false); setError(null) }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" /> {busy ? 'Saving...' : 'Save route'}
        </button>
      </div>
    </div>
  )
}
