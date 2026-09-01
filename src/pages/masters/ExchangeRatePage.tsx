/**
 * ExchangeRatePage "" Module 34 gap (Req 34.6).
 *
 * Administrator-maintained daily exchange-rate table. Rates lock the INR
 * equivalent of foreign-currency RFQs, quotations, POs and invoices at the
 * order date. Reached at /masters/exchange-rates.
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button, Input, Select } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { listRates, createRate, ExchangeRate } from '../../api/exchangeRateApi'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED']

export function ExchangeRatePage() {
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ccy, setCcy] = useState('USD')
  const [rateDate, setRateDate] = useState(new Date().toISOString().slice(0, 10))
  const [rate, setRate] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRates(await listRates())
    } catch {
      setError('Could not load exchange rates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const handleAdd = async () => {
    if (!rate) return
    setError(null)
    try {
      await createRate({ currency_code: ccy, rate_date: rateDate, rate_to_inr: Number(rate) })
      setRate('')
      await refetch()
    } catch {
      setError('Could not save rate.')
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 34 "" daily INR conversion rates for USD / EUR / GBP / AED transactions
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={14} />} title="Refresh" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add / Update Daily Rate</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Select
            label="Currency"
            options={CURRENCIES.map((c) => ({ label: c, value: c }))}
            value={ccy}
            onChange={(e) => setCcy(e.target.value)}
          />
          <Input label="Rate Date" type="date" value={rateDate} onChange={(e) => setRateDate(e.target.value)} />
          <Input label="1 unit = ‚¹" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          <Button variant="primary" onClick={handleAdd} icon={<Plus size={16} />}>
            Save Rate
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Currency</th>
              <th className="px-4 py-2 text-left">Rate Date</th>
              <th className="px-4 py-2 text-right">Rate to INR</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 animate-pulse">Loading"¦</td></tr>
            ) : rates.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No rates yet.</td></tr>
            ) : (
              rates.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-semibold">{r.currency_code}</td>
                  <td className="px-4 py-2">{formatDate(r.rate_date)}</td>
                  <td className="px-4 py-2 text-right">‚¹{Number(r.rate_to_inr).toFixed(4)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
