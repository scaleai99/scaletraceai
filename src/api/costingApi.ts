/**
 * costingApi.ts - OP40 costing driven by the OP30 route.
 *
 * These endpoints read route_operations (the same rows the shop floor will
 * execute) and the Rates & Overheads master, so the estimate cannot drift from
 * the route. Setup and NRC are per-batch and amortised over the order quantity
 * - which is what makes the quantity-break table meaningful.
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/costing-sheets'

export interface CostingRates {
  source: 'master' | 'default'
  factory_overhead_pct: number
  admin_overhead_pct: number
  margin_pct: number
  freight_packing_pct: number
  rejection_allowance_pct: number
  bench_labour_rate: number
  currency: string
}

export interface CostedOperation {
  id: string
  op_no: number
  description: string | null
  kind: 'internal' | 'vendor'
  machine_code: string | null
  method_code: string | null
  supplier_code: string | null
  setup_min: number | null
  cycle_min: number | null
  rate_per_hour: number | null
  lead_days: number | null
  run_cost: number
  setup_batch_cost: number
  setup_per_piece: number
  total_per_piece: number
}

export interface RouteCosting {
  qty: number
  material_cost: number
  machining_cost: number
  tooling_cost: number
  outsource_cost: number
  setup_cost: number
  nrc_per_piece: number
  direct_cost: number
  rejection_allowance: number
  base_cost: number
  factory_overhead: number
  admin_overhead: number
  total_cost: number
  margin: number
  freight_packing: number
  unit_price: number
  order_value: number
  margin_pct_realised: number
  rates: CostingRates
  route: {
    operation_count: number
    cycle_min_per_piece: number
    setup_min_per_batch: number
    batch_machine_hours: number
    outsourced_lead_days: number
    route_cost_per_piece: number
  }
  operations: CostedOperation[]
  costing_sheet_id?: string
  version?: number
}

export interface QuantityBreak {
  qty: number
  setup_cost: number
  nrc_per_piece: number
  total_cost: number
  unit_price: number
  order_value: number
}

export interface RouteCostRequest {
  rfq_line_item_id: string
  quantity: number
  material_cost?: number
  tooling_cost?: number
  nrc_total?: number
  persist?: boolean
}

export async function costFromRoute(body: RouteCostRequest): Promise<RouteCosting> {
  const { data } = await apiClient.post<RouteCosting>(`${BASE}/from-route`, body)
  return data
}

export async function getQuantityBreaks(
  rfqLineItemId: string,
  opts: { material_cost?: number; tooling_cost?: number; nrc_total?: number; quantities?: string } = {},
): Promise<{ rates: CostingRates; breaks: QuantityBreak[] }> {
  const { data } = await apiClient.get(`${BASE}/quantity-breaks`, {
    params: { rfq_line_item_id: rfqLineItemId, ...opts },
  })
  return data as { rates: CostingRates; breaks: QuantityBreak[] }
}

export async function getCostingRates(): Promise<CostingRates> {
  const { data } = await apiClient.get<CostingRates>(`${BASE}/rates`)
  return data
}
