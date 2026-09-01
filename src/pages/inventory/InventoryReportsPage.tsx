/**
 * InventoryReportsPage - Module 18: Inventory Reports
 *
 * Features:
 * - Stock Valuation summary (by category and overall)
 * - Stock Movement summary (below reorder, zero stock, total SKUs)
 * - Category breakdown table
 * - Zero stock items list
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, BarChart3, Package, RefreshCw, TrendingDown } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { listInventory, type InventoryItem } from '../../api/purchaseApi'

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------
interface CategorySummary {
  category: string
  sku_count: number
  total_qty: number
  below_reorder: number
  zero_stock: number
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  colour: string
  sub?: string
}

function StatCard({ label, value, icon, colour, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colour}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function InventoryReportsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    listInventory({ limit: 500 })
      .then((data) => setItems(data))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load inventory')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ---------------------------------------------------------------------------
  // Computed stats
  // ---------------------------------------------------------------------------
  const totalSKUs = items.length
  const totalQty = items.reduce((sum, i) => sum + (i.qty_on_hand ?? 0), 0)
  const belowReorder = items.filter(
    (i) => i.reorder_level != null && (i.qty_on_hand ?? 0) <= (i.reorder_level ?? 0) && (i.qty_on_hand ?? 0) > 0
  ).length
  const zeroStock = items.filter((i) => i.qty_on_hand != null && (i.qty_on_hand ?? 1) <= 0).length

  // Category breakdown
  const categoryMap = new Map<string, CategorySummary>()
  items.forEach((item) => {
    const cat = item.category ?? 'Uncategorised'
    const existing = categoryMap.get(cat) ?? {
      category: cat,
      sku_count: 0,
      total_qty: 0,
      below_reorder: 0,
      zero_stock: 0,
    }
    existing.sku_count++
    existing.total_qty += (item.qty_on_hand ?? 0)
    if ((item.qty_on_hand ?? 0) <= 0) existing.zero_stock++
    else if (item.reorder_level != null && (item.qty_on_hand ?? 0) <= item.reorder_level)
      existing.below_reorder++
    categoryMap.set(cat, existing)
  })
  const categories = Array.from(categoryMap.values()).sort((a, b) => b.sku_count - a.sku_count)

  // Zero stock items
  const zeroItems = items.filter((i) => i.qty_on_hand != null && (i.qty_on_hand ?? 1) <= 0)

  // Valuation method breakdown
  const fifoCount = items.filter((i) => i.valuation_method === 'FIFO').length
  const waCount = items.filter((i) => i.valuation_method === 'WA').length

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 18 - Stock valuation and movement summary
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchData}
          icon={<RefreshCw size={14} />}
          title="Refresh"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading inventory data...
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total SKUs"
              value={totalSKUs}
              icon={<Package size={18} className="text-blue-600" />}
              colour="bg-blue-50"
              sub="Unique items"
            />
            <StatCard
              label="Total Qty on Hand"
              value={totalQty.toLocaleString()}
              icon={<BarChart3 size={18} className="text-green-600" />}
              colour="bg-green-50"
              sub="Across all items"
            />
            <StatCard
              label="Below Reorder"
              value={belowReorder}
              icon={<TrendingDown size={18} className="text-amber-500" />}
              colour="bg-amber-50"
              sub="Need replenishment"
            />
            <StatCard
              label="Zero Stock"
              value={zeroStock}
              icon={<AlertTriangle size={18} className="text-red-500" />}
              colour="bg-red-50"
              sub="Out of stock"
            />
          </div>

          {/* Valuation method breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Valuation Method Breakdown</h2>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{fifoCount}</span>
                <span className="text-sm text-gray-500">FIFO items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{waCount}</span>
                <span className="text-sm text-gray-500">Weighted Average items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {items.length - fifoCount - waCount}
                </span>
                <span className="text-sm text-gray-500">Other / Unset</span>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          {categories.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700">Stock by Category</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Category', 'SKU Count', 'Total Qty on Hand', 'Below Reorder', 'Zero Stock', 'Health'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((cat) => {
                      const healthPct =
                        cat.sku_count > 0
                          ? Math.round(
                              ((cat.sku_count - cat.zero_stock - cat.below_reorder) /
                                cat.sku_count) *
                                100
                            )
                          : 100
                      return (
                        <tr key={cat.category} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">
                            {cat.category}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-gray-600">{cat.sku_count}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-600">
                            {cat.total_qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            {cat.below_reorder > 0 ? (
                              <span className="text-amber-600 font-semibold">
                                {cat.below_reorder}
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {cat.zero_stock > 0 ? (
                              <span className="text-red-600 font-semibold">{cat.zero_stock}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    healthPct >= 80
                                      ? 'bg-green-500'
                                      : healthPct >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${healthPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{healthPct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Zero stock items */}
          {zeroItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Zero Stock Items ({zeroItems.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Item Code', 'Description', 'Category', 'Reorder Level', 'Bin', 'Valuation'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {zeroItems.map((item) => (
                      <tr key={item.id} className="bg-red-50 hover:bg-red-100">
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-red-700">
                          {item.item_code}
                        </td>
                        <td className="px-3 py-2.5 text-gray-800">
                          {item.description ?? '-'}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{item.category ?? '-'}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-600">
                          {item.reorder_level ?? '-'}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{item.bin_location ?? '-'}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="default" size="sm">
                            {item.valuation_method ?? 'FIFO'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
