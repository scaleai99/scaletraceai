/**
 * routeApi.ts - Process design / routing (OP30) -> /api/v1/routes
 *
 * The single route dataset: these operations are what the estimator costs,
 * what the planner schedules and what the shop floor executes. Machines and
 * methods are real FKs into the Machine / Process & Method masters.
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/routes'

export interface RouteOperation {
  id: string
  rfq_id: string | null
  rfq_line_item_id: string | null
  op_no: number
  description: string | null
  kind: 'internal' | 'vendor'
  machine_id: string | null
  machine_code: string | null
  method_id: string | null
  method_code: string | null
  operation: string | null
  setup_min: number | null
  cycle_min: number | null
  rate_per_hour: number | null
  supplier_id: string | null
  supplier_code: string | null
  vendor_cost: number | null
  lead_days: number | null
  fixture: string | null
  notes: string | null
  status?: string | null
}

/** A costed row: the operation plus its computed per-piece cost. */
export interface RouteCostRow extends RouteOperation {
  run_cost: number
  setup_batch_cost: number
  setup_per_piece: number
  total_per_piece: number
}

export interface RouteTotals {
  qty: number
  operation_count: number
  cycle_min_per_piece: number
  setup_min_per_batch: number
  batch_machine_hours: number
  machining_cost_per_piece: number
  setup_cost_per_batch: number
  setup_cost_per_piece: number
  outsource_cost_per_piece: number
  outsourced_lead_days: number
  route_cost_per_piece: number
  rows: RouteCostRow[]
}

export interface RouteOpInput {
  op_no?: number | null
  description?: string | null
  kind?: 'internal' | 'vendor'
  machine_id?: string | null
  method_id?: string | null
  operation?: string | null
  setup_min?: number | null
  cycle_min?: number | null
  rate_per_hour?: number | null
  supplier_id?: string | null
  vendor_cost?: number | null
  lead_days?: number | null
  fixture?: string | null
  notes?: string | null
}

export async function getRoute(rfqLineItemId: string, qty = 1): Promise<RouteTotals> {
  const { data } = await apiClient.get<RouteTotals>(BASE, {
    params: { rfq_line_item_id: rfqLineItemId, qty },
  })
  return data
}

export async function addRouteOp(rfqLineItemId: string, body: RouteOpInput): Promise<RouteOperation> {
  const { data } = await apiClient.post<RouteOperation>(BASE, body, {
    params: { rfq_line_item_id: rfqLineItemId },
  })
  return data
}

export async function updateRouteOp(opId: string, body: RouteOpInput): Promise<RouteOperation> {
  const { data } = await apiClient.patch<RouteOperation>(`${BASE}/${opId}`, body)
  return data
}

export async function deleteRouteOp(opId: string): Promise<void> {
  await apiClient.delete(`${BASE}/${opId}`)
}

export async function replaceRoute(rfqLineItemId: string, operations: RouteOpInput[]): Promise<RouteTotals> {
  const { data } = await apiClient.put<RouteTotals>(`${BASE}/bulk`, {
    rfq_line_item_id: rfqLineItemId,
    operations,
  })
  return data
}

/** Seeds work_order_operations from the costed route - without this the shop floor has no operations. */
export async function seedWorkOrderFromRoute(woId: string, rfqLineItemId?: string): Promise<{
  work_order_id: string; rfq_line_item_id: string; operations_created: number
}> {
  const { data } = await apiClient.post(`${BASE}/seed-work-order/${woId}`, null, {
    params: rfqLineItemId ? { rfq_line_item_id: rfqLineItemId } : {},
  })
  return data as { work_order_id: string; rfq_line_item_id: string; operations_created: number }
}
