/**
 * RouteOperationsPanel - process design & cycle time (OP30).
 *
 * The route card the shop follows and the times the estimate is built from are
 * the same rows. Work centres come from the Machine master and methods from the
 * Process & Method master as real FKs, so a route cannot reference something
 * that does not exist. Vendor operations carry a supplier, a per-piece cost and
 * a lead time instead of machine minutes.
 *
 * Totals are computed server-side by route_service and are what OP40 costing
 * and OP90 planning read - no second set of numbers.
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react'
import {
  getRoute, replaceRoute, type RouteTotals, type RouteOpInput,
} from '../../api/routeApi'
import { listMachines, listMethods, type Machine, type ProcessMethod } from '../../api/mastersApi'
import { listSuppliers, type Supplier } from '../../api/supplierApi'

interface Row {
  op_no: string
  description: string
  kind: 'internal' | 'vendor'
  machine_id: string
  method_id: string
  operation: string
  setup_min: string
  cycle_min: string
  rate_per_hour: string
  supplier_id: string
  vendor_cost: string
  lead_days: string
  fixture: string
}

const EMPTY_ROW: Row = {
  op_no: '', description: '', kind: 'internal', machine_id: '', method_id: '',
  operation: '', setup_min: '', cycle_min: '', rate_per_hour: '', supplier_id: '',
  vendor_cost: '', lead_days: '', fixture: '',
}

const s = (v: number | null | undefined) => (v == null ? '' : String(v))
const n = (v: string): number | null => (v.trim() === '' ? null : Number(v))
const i = (v: string): number | null => (v.trim() === '' ? null : parseInt(v, 10))
const money = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  rfqLineItemId: string
  qty?: number | null
  readOnly?: boolean
}

export function RouteOperationsPanel({ rfqLineItemId, qty, readOnly = false }: Props) {
  const [totals, setTotals] = useState<RouteTotals | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [methods, setMethods] = useState<ProcessMethod[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchQty, setBatchQty] = useState<number>(qty && qty > 0 ? qty : 1)

  const toRows = (t: RouteTotals): Row[] =>
    t.rows.map((r) => ({
      op_no: s(r.op_no), description: r.description ?? '', kind: r.kind,
      machine_id: r.machine_id ?? '', method_id: r.method_id ?? '',
      operation: r.operation ?? '', setup_min: s(r.setup_min), cycle_min: s(r.cycle_min),
      rate_per_hour: s(r.rate_per_hour), supplier_id: r.supplier_id ?? '',
      vendor_cost: s(r.vendor_cost), lead_days: s(r.lead_days), fixture: r.fixture ?? '',
    }))

  const load = useCallback(() => {
    if (!rfqLineItemId) return
    setLoading(true); setError(null)
    getRoute(rfqLineItemId, batchQty)
      .then((t) => { setTotals(t); setRows(toRows(t)) })
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        setError(ax?.response?.status === 404
          ? 'Routing service not found (404) - the backend needs a restart to load the process-design router.'
          : ax?.response?.data?.detail ?? 'Failed to load the process route.')
        setTotals(null); setRows([])
      })
      .finally(() => setLoading(false))
  }, [rfqLineItemId, batchQty])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    listMachines().then(setMachines).catch(() => setMachines([]))
    listMethods().then(setMethods).catch(() => setMethods([]))
    listSuppliers({}).then((r) => setSuppliers(Array.isArray(r) ? r : [])).catch(() => setSuppliers([]))
  }, [])

  const setRow = (idx: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, k) => (k === idx ? { ...r, ...patch } : r)))

  /** Picking a machine or method pulls its rate / standard setup from the master. */
  const pickMachine = (idx: number, machine_id: string) => {
    const m = machines.find((x) => x.id === machine_id)
    setRow(idx, { machine_id, rate_per_hour: m?.mhr != null ? String(m.mhr) : rows[idx].rate_per_hour })
  }
  const pickMethod = (idx: number, method_id: string) => {
    const p = methods.find((x) => x.id === method_id)
    setRow(idx, {
      method_id,
      operation: p?.method_name || rows[idx].operation,
      setup_min: p?.std_setup_min != null ? String(p.std_setup_min) : rows[idx].setup_min,
    })
  }

  const addRow = () =>
    setRows((prev) => [...prev, { ...EMPTY_ROW, op_no: String((prev.length + 1) * 10) }])

  const save = async () => {
    setBusy(true); setError(null)
    try {
      const payload: RouteOpInput[] = rows
        .filter((r) => r.operation.trim() || r.description.trim() || r.machine_id || r.supplier_id)
        .map((r, idx) => ({
          op_no: r.op_no.trim() === '' ? (idx + 1) * 10 : parseInt(r.op_no, 10),
          description: r.description || null,
          kind: r.kind,
          machine_id: r.kind === 'internal' ? (r.machine_id || null) : null,
          method_id: r.kind === 'internal' ? (r.method_id || null) : null,
          operation: r.operation || null,
          setup_min: r.kind === 'internal' ? n(r.setup_min) : null,
          cycle_min: r.kind === 'internal' ? n(r.cycle_min) : null,
          rate_per_hour: r.kind === 'internal' ? n(r.rate_per_hour) : null,
          supplier_id: r.kind === 'vendor' ? (r.supplier_id || null) : null,
          vendor_cost: r.kind === 'vendor' ? n(r.vendor_cost) : null,
          lead_days: r.kind === 'vendor' ? i(r.lead_days) : null,
          fixture: r.fixture || null,
        }))
      await replaceRoute(rfqLineItemId, payload)
      setEditing(false)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const d = e?.response?.data?.detail
      setError(typeof d === 'string' ? d : d ? JSON.stringify(d) : e?.message ?? 'Failed to save the route.')
    } finally { setBusy(false) }
  }

  const T = totals

  return (
    <div>
      {/* Totals strip - what costing and planning read */}
      {T && T.operation_count > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Cycle / piece</div>
            <div className="font-mono text-sm font-semibold text-gray-900">{T.cycle_min_per_piece} min</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Setup / batch</div>
            <div className="font-mono text-sm font-semibold text-gray-900">{T.setup_min_per_batch} min</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Batch machine hrs</div>
            <div className="font-mono text-sm font-semibold text-gray-900">{T.batch_machine_hours}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Outsourced lead</div>
            <div className="font-mono text-sm font-semibold text-gray-900">{T.outsourced_lead_days} days</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Machining / pc</div>
            <div className="font-mono text-sm text-gray-700">{money(T.machining_cost_per_piece)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Setup / pc</div>
            <div className="font-mono text-sm text-gray-700">{money(T.setup_cost_per_piece)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Outsource / pc</div>
            <div className="font-mono text-sm text-gray-700">{money(T.outsource_cost_per_piece)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Route cost / pc</div>
            <div className="font-mono text-sm font-bold text-indigo-700">{money(T.route_cost_per_piece)}</div>
          </div>
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Qty
          <input type="number" min={1} value={batchQty}
            onChange={(e) => setBatchQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm font-mono" />
        </label>
        <button type="button" onClick={load}
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
        <div className="flex-1" />
        {!readOnly && !editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            {T && T.operation_count ? 'Edit route' : 'Build route from masters'}
          </button>
        )}
      </div>

      {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}

      {loading ? (
        <p className="py-6 text-center text-sm text-gray-400">Loading route...</p>
      ) : !editing ? (
        T && T.operation_count ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2 text-left">Op</th>
                  <th className="px-2 py-2 text-left">Description</th>
                  <th className="px-2 py-2 text-left">Work centre</th>
                  <th className="px-2 py-2 text-left">Method</th>
                  <th className="px-2 py-2 text-right">Setup</th>
                  <th className="px-2 py-2 text-right">Cycle</th>
                  <th className="px-2 py-2 text-right">Rate</th>
                  <th className="px-2 py-2 text-right">Total /pc</th>
                  <th className="px-2 py-2 text-left">Fixture</th>
                </tr>
              </thead>
              <tbody>
                {T.rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-2 py-2 font-mono font-semibold">{r.op_no}</td>
                    <td className="px-2 py-2">{r.description || r.operation || '-'}</td>
                    <td className="px-2 py-2 font-mono text-gray-600">
                      {r.kind === 'vendor' ? (r.supplier_code || 'vendor') : (r.machine_code || '-')}
                    </td>
                    <td className="px-2 py-2 font-mono text-gray-600">{r.method_code || '-'}</td>
                    <td className="px-2 py-2 text-right font-mono">{r.kind === 'vendor' ? '-' : (r.setup_min ?? '-')}</td>
                    <td className="px-2 py-2 text-right font-mono">
                      {r.kind === 'vendor' ? <span className="text-gray-500">{r.lead_days ?? 0}d</span> : (r.cycle_min ?? '-')}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-gray-600">
                      {r.kind === 'vendor' ? 'vendor' : (r.rate_per_hour ?? '-')}
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-medium">{money(r.total_per_piece)}</td>
                    <td className="px-2 py-2 text-gray-500">{r.fixture || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">
            No process route on this line item yet. Build it from the Machine and Process &amp; Method masters.
          </p>
        )
      ) : (
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <input value={r.op_no} onChange={(e) => setRow(idx, { op_no: e.target.value })}
                  placeholder="10" className="w-14 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" />
                <select value={r.kind} onChange={(e) => setRow(idx, { kind: e.target.value as 'internal' | 'vendor' })}
                  className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm">
                  <option value="internal">Internal</option>
                  <option value="vendor">Vendor</option>
                </select>
                <input value={r.description} onChange={(e) => setRow(idx, { description: e.target.value })}
                  placeholder="Operation description" className="min-w-[180px] flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" />
                <button type="button" onClick={() => setRows((p) => p.filter((_, k) => k !== idx))}
                  title="Remove operation" className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {r.kind === 'internal' ? (
                  <>
                    <select value={r.machine_id} onChange={(e) => pickMachine(idx, e.target.value)}
                      className="min-w-[170px] rounded border border-gray-300 bg-white px-2 py-1.5 text-sm">
                      <option value="">Work centre...</option>
                      {machines.map((m) => <option key={m.id} value={m.id}>{m.machine_code} - {m.machine_name}</option>)}
                    </select>
                    <select value={r.method_id} onChange={(e) => pickMethod(idx, e.target.value)}
                      className="min-w-[170px] rounded border border-gray-300 bg-white px-2 py-1.5 text-sm">
                      <option value="">Method...</option>
                      {methods.map((p) => <option key={p.id} value={p.id}>{p.rate_code} - {p.method_name}</option>)}
                    </select>
                    <input value={r.setup_min} onChange={(e) => setRow(idx, { setup_min: e.target.value })}
                      type="number" placeholder="setup" className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" />
                    <input value={r.cycle_min} onChange={(e) => setRow(idx, { cycle_min: e.target.value })}
                      type="number" placeholder="cycle" className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" />
                    <input value={r.rate_per_hour} onChange={(e) => setRow(idx, { rate_per_hour: e.target.value })}
                      type="number" placeholder="rate/hr" className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" />
                  </>
                ) : (
                  <>
                    <select value={r.supplier_id} onChange={(e) => setRow(idx, { supplier_id: e.target.value })}
                      className="min-w-[200px] rounded border border-gray-300 bg-white px-2 py-1.5 text-sm">
                      <option value="">Supplier...</option>
                      {suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.supplier_code} - {sp.supplier_name}</option>)}
                    </select>
                    <input value={r.vendor_cost} onChange={(e) => setRow(idx, { vendor_cost: e.target.value })}
                      type="number" placeholder="cost/pc" className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" />
                    <input value={r.lead_days} onChange={(e) => setRow(idx, { lead_days: e.target.value })}
                      type="number" placeholder="lead d" className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" />
                  </>
                )}
                <input value={r.fixture} onChange={(e) => setRow(idx, { fixture: e.target.value })}
                  placeholder="fixture" className="w-32 rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
            </div>
          ))}

          <button type="button" onClick={addRow}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            <Plus className="h-3.5 w-3.5" /> Add operation
          </button>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => { if (totals) setRows(toRows(totals)); setEditing(false); setError(null) }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              <Save className="h-3.5 w-3.5" /> {busy ? 'Saving...' : 'Save route'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
