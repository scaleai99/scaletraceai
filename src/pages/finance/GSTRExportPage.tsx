/**
 * GSTRExportPage - Module 24: GSTR-1 Monthly Export
 *
 * Features:
 * - Period picker (month + year)
 * - Export button triggers GET /api/v1/finance/gstr1-export
 * - Displays summary stats and B2B invoice table
 * - Download as JSON button
 */

import { useState } from 'react'
import { Download, FileDown, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui'
import { apiClient } from '../../api/axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Gstr1ItemDetail {
  ty: string
  hsn: string
  txval: number
  irt: number
  iamt: number
  camt: number
  samt: number
  csamt: number
}

interface Gstr1Item {
  num: number
  itm_det: Gstr1ItemDetail
}

interface Gstr1Invoice {
  inum: string
  idt: string
  val: number
  pos: string
  rchrg: string
  inv_typ: string
  itms: Gstr1Item[]
}

interface Gstr1B2BEntry {
  ctin: string
  inv: Gstr1Invoice[]
}

interface Gstr1Meta {
  period_month: number
  period_year: number
  invoice_count: number
  b2b_count: number
  generated_at: string
}

interface Gstr1Payload {
  gstin: string
  fp: string
  b2b: Gstr1B2BEntry[]
  _meta: Gstr1Meta
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------
async function fetchGstr1(month: number, year: number): Promise<Gstr1Payload> {
  const resp = await apiClient.get<Gstr1Payload>('/api/v1/finance/gstr1-export', {
    params: { period_month: month, period_year: year },
  })
  return resp.data
}

// ---------------------------------------------------------------------------
// Month names
// ---------------------------------------------------------------------------
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatINR(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function GSTRExportPage() {
  const now = new Date()
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [year, setYear] = useState<number>(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<Gstr1Payload | null>(null)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    setPayload(null)
    try {
      const data = await fetchGstr1(month, year)
      setPayload(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to fetch GSTR-1 data')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!payload) return
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `GSTR1_${payload.fp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Compute totals from payload
  const totalTaxableValue = payload?.b2b.reduce(
    (sum, b) =>
      sum +
      b.inv.reduce(
        (is, inv) => is + inv.itms.reduce((itemSum, itm) => itemSum + itm.itm_det.txval, 0),
        0
      ),
    0
  ) ?? 0

  const totalGST = payload?.b2b.reduce(
    (sum, b) =>
      sum +
      b.inv.reduce(
        (is, inv) =>
          is +
          inv.itms.reduce(
            (itemSum, itm) => itemSum + itm.itm_det.iamt + itm.itm_det.camt + itm.itm_det.samt,
            0
          ),
        0
      ),
    0
  ) ?? 0

  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GSTR-1 Export</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 24 "" Monthly GST return export in government-mandated JSON format
        </p>
      </div>

      {/* Period picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Filing Period</h2>
        <div className="flex flex-wrap items-end gap-4">
          {/* Month selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <select
              className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleFetch}
            disabled={loading}
            icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <FileDown size={14} />}
          >
            {loading ? 'Loading...' : 'Fetch GSTR-1 Data'}
          </Button>

          {payload && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              icon={<Download size={14} />}
            >
              Download JSON
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {payload && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Filing Period</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{payload.fp}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Seller GSTIN</p>
              <p className="text-base font-bold font-mono text-gray-900 mt-0.5">{payload.gstin}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Total Invoices</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{payload._meta.invoice_count}</p>
              <p className="text-xs text-gray-400">{payload._meta.b2b_count} B2B entries</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Total Taxable Value</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{formatINR(totalTaxableValue)}</p>
              <p className="text-xs text-gray-400">GST: {formatINR(totalGST)}</p>
            </div>
          </div>

          {/* B2B table */}
          {payload.b2b.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              No B2B invoices found for this period.
              <p className="text-xs text-gray-400 mt-1">
                Invoices require customer GSTIN to appear in B2B section.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700">B2B Invoices</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Customer GSTIN', 'Invoice No.', 'Invoice Date', 'Total Value', 'Taxable', 'IGST', 'CGST', 'SGST', 'HSN'].map(
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
                    {payload.b2b.flatMap((b2b) =>
                      b2b.inv.map((inv) => {
                        const firstItm = inv.itms[0]?.itm_det
                        return (
                          <tr key={`${b2b.ctin}-${inv.inum}`} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 font-mono text-xs text-gray-800">
                              {b2b.ctin}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs font-semibold text-amber-700">
                              {inv.inum}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inv.idt}</td>
                            <td className="px-3 py-2.5 font-mono text-right">{formatINR(inv.val)}</td>
                            <td className="px-3 py-2.5 font-mono text-right">
                              {firstItm ? formatINR(firstItm.txval) : '-'}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-right">
                              {firstItm ? formatINR(firstItm.iamt) : '-'}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-right">
                              {firstItm ? formatINR(firstItm.camt) : '-'}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-right">
                              {firstItm ? formatINR(firstItm.samt) : '-'}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                              {firstItm?.hsn || '-'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw JSON preview */}
          <details className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <summary className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
              Raw JSON Preview (click to expand)
            </summary>
            <pre className="px-4 pb-4 text-xs text-gray-600 overflow-auto max-h-96 bg-gray-50">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  )
}
