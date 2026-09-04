/**
 * RouteCostingPanel - OP40 cost build-up from the OP30 route.
 *
 * Operation-wise cost, then the build-up in the order the percentages actually
 * compound (direct -> rejection -> factory -> admin -> margin -> freight), with
 * every percentage read from the Rates & Overheads master. Setup and one-time
 * cost are per batch, so the quantity-break table shows why low volume is
 * expensive.
 *
 * Real data only: if the line item has no route, this says so and points at
 * OP30 rather than inventing operations.
 */
import { useCallback, useEffect, useState } from 'react'
import { Calculator, RefreshCw, Save, AlertTriangle } from 'lucide-react'
import {
  costFromRoute, getQuantityBreaks,
  type RouteCosting, type QuantityBreak,
} from '../../api/costingApi'

interface Props {
  rfqLineItemId: string
  qty?: number | null
}

const money = (v: number) =>
  v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function RouteCostingPanel({ rfqLineItemId, qty }: Props) {
  const [quantity, setQuantity] = useState<number>(qty && qty > 0 ? qty : 25)
  const [material, setMaterial] = useState<string>('0')
  const [tooling, setTooling] = useState<string>('0')
  const [nrc, setNrc] = useState<string>('0')

  const [data, setData] = useState<RouteCosting | null>(null)
  const [breaks, setBreaks] = useState<QuantityBreak[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const nums = () => ({
    material_cost: Number(material) || 0,
    tooling_cost: Number(tooling) || 0,
    nrc_total: Number(nrc) || 0,
  })

  const run = useCallback(async (persist = false) => {
    if (!rfqLineItemId) return
    persist ? setSaving(true) : setLoading(true)
    setError(null); setSaved(null)
    try {
      const res = await costFromRoute({ rfq_line_item_id: rfqLineItemId, quantity, ...nums(), persist })
      setData(res)
      if (persist && res.costing_sheet_id) setSaved(`Costing sheet v${res.version} saved.`)
      const b = await getQuantityBreaks(rfqLineItemId, nums())
      setBreaks(b.breaks)
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { detail?: string } } }
      setError(ax?.response?.status === 404
        ? 'Route costing endpoint not found (404) - the backend needs a restart.'
        : ax?.response?.data?.detail ?? 'Costing failed.')
      setData(null); setBreaks([])
    } finally { persist ? setSaving(false) : setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqLineItemId, quantity, material, tooling, nrc])

  useEffect(() => { run(false) }, [rfqLineItemId])  // eslint-disable-line react-hooks/exhaustive-deps

  const Row = ({ label, value, bold = false, tone = '' }: { label: string; value: number; bold?: boolean; tone?: string }) => (
    <tr className={bold ? 'bg-gray-50 font-semibold' : ''}>
      <td className={`px-3 py-1.5 ${tone}`}>{label}</td>
      <td className={`px-3 py-1.5 text-right font-mono ${tone}`}>{money(value)}</td>
    </tr>
  )

  return (
    <div>
      {/* Inputs the route cannot know */}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        {([['Qty', quantity, (v: string) => setQuantity(Math.max(1, parseInt(v || '1', 10)))],
           ['Material /pc', material, setMaterial],
           ['Tooling /pc', tooling, setTooling],
           ['One-time (batch)', nrc, setNrc]] as const).map(([label, val, setter]) => (
          <label key={label} className="text-xs text-gray-500">
            <span className="mb-1 block uppercase tracking-wide">{label}</span>
            <input type="number" min={0} value={val as number | string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              className="w-28 rounded border border-gray-300 px-2 py-1.5 text-sm font-mono" />
          </label>
        ))}
        <button type="button" onClick={() => run(false)} disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          <Calculator className="h-3.5 w-3.5" /> {loading ? 'Costing...' : 'Cost from route'}
        </button>
        <button type="button" onClick={() => run(true)} disabled={saving || !data}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save costing sheet'}
        </button>
        <button type="button" onClick={() => run(false)}
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-2 text-xs text-gray-600 hover:bg-gray-50">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
      {saved && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{saved}</div>}

      {data?.rates?.source === 'default' && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No active Rates &amp; Overheads record — every percentage is 0, so this price is direct cost only.
          Set them under Masters &gt; Rates &amp; Overheads.
        </div>
      )}

      {data && (
        <>
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            {/* Operation-wise */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-2 py-2 text-left">Op</th>
                    <th className="px-2 py-2 text-left">Work centre</th>
                    <th className="px-2 py-2 text-right">Setup /pc</th>
                    <th className="px-2 py-2 text-right">Run /pc</th>
                    <th className="px-2 py-2 text-right">Total /pc</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operations.map((o) => (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 font-mono font-semibold">{o.op_no}</td>
                      <td className="px-2 py-1.5 font-mono text-gray-600">
                        {o.kind === 'vendor' ? (o.supplier_code || 'vendor') : (o.machine_code || 'bench')}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{o.setup_batch_cost ? money(o.setup_per_piece) : '-'}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{money(o.run_cost)}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-medium">{money(o.total_per_piece)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-300 bg-gray-50 font-semibold">
                    <td className="px-2 py-2" colSpan={2}>Route total</td>
                    <td className="px-2 py-2 text-right font-mono">{money(data.setup_cost)}</td>
                    <td className="px-2 py-2 text-right font-mono">{money(data.machining_cost + data.outsource_cost)}</td>
                    <td className="px-2 py-2 text-right font-mono">{money(data.route.route_cost_per_piece)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Build-up, in the order the percentages compound */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr><th className="px-3 py-2 text-left">Element</th><th className="px-3 py-2 text-right">Per piece</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <Row label="Material" value={data.material_cost} />
                  <Row label={`Machining (${data.route.cycle_min_per_piece} min)`} value={data.machining_cost} />
                  <Row label="Tooling" value={data.tooling_cost} />
                  <Row label={`Outsourced (${data.route.outsourced_lead_days}d lead)`} value={data.outsource_cost} />
                  <Row label={`Setup (${data.route.setup_min_per_batch} min / ${data.qty} pcs)`} value={data.setup_cost} />
                  <Row label="One-time, amortised" value={data.nrc_per_piece} />
                  <Row label="Direct cost" value={data.direct_cost} bold />
                  <Row label={`Rejection allowance ${data.rates.rejection_allowance_pct}%`} value={data.rejection_allowance} />
                  <Row label={`Factory overhead ${data.rates.factory_overhead_pct}%`} value={data.factory_overhead} />
                  <Row label={`Administration ${data.rates.admin_overhead_pct}%`} value={data.admin_overhead} />
                  <Row label="Total cost" value={data.total_cost} bold />
                  <Row label={`Margin ${data.rates.margin_pct}%`} value={data.margin} />
                  <Row label={`Freight & packing ${data.rates.freight_packing_pct}%`} value={data.freight_packing} />
                  <tr className="bg-indigo-50 text-base font-bold text-indigo-900">
                    <td className="px-3 py-2">Selling price / piece</td>
                    <td className="px-3 py-2 text-right font-mono">{money(data.unit_price)}</td>
                  </tr>
                  <tr className="text-xs text-gray-500">
                    <td className="px-3 py-1.5">Order value at {data.qty} pcs</td>
                    <td className="px-3 py-1.5 text-right font-mono">{money(data.order_value)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quantity breaks */}
          {breaks.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-right">Setup /pc</th>
                    <th className="px-3 py-2 text-right">One-time /pc</th>
                    <th className="px-3 py-2 text-right">Cost /pc</th>
                    <th className="px-3 py-2 text-right">Price /pc</th>
                    <th className="px-3 py-2 text-right">Order value</th>
                  </tr>
                </thead>
                <tbody>
                  {breaks.map((b) => (
                    <tr key={b.qty} className={`border-t border-gray-100 ${b.qty === data.qty ? 'bg-amber-50 font-medium' : ''}`}>
                      <td className="px-3 py-1.5 font-mono">{b.qty}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{money(b.setup_cost)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{money(b.nrc_per_piece)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{money(b.total_cost)}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold">{money(b.unit_price)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-600">{money(b.order_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
                Setup and one-time cost are per batch, so they dominate at low quantity - which is the
                whole reason a break table is worth quoting.
              </p>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <p className="py-6 text-center text-sm text-gray-400">
          No costing yet. Click &quot;Cost from route&quot; - it reads the OP30 route operations.
        </p>
      )}
    </div>
  )
}
