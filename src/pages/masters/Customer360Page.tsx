/**
 * Customer360Page "" Module 02 gap (Req 2.9).
 *
 * Aggregated 360  view of one customer: sales pipeline, order history, quality
 * and financial position. Reached at /masters/customers/:id/dashboard-360.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui'
import { getCustomer360, Customer360 } from '../../api/salesAnalyticsApi'

function StatGrid({ title, data }: { title: string; data: Record<string, number | string> }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      <dl className="grid grid-cols-2 gap-3">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wide text-gray-400">{k.replace(/_/g, ' ')}</dt>
            <dd className="text-lg font-semibold text-gray-900">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Customer360Page() {
  const { id: customerId = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Customer360 | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerId) return
    getCustomer360(customerId)
      .then(setData)
      .catch(() => setError('Could not load customer 360 .'))
  }, [customerId])

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/masters/customers/${customerId}`)}
          icon={<ArrowLeft size={14} />}
          title="Back to customer"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer 360 </h1>
          <p className="text-sm text-gray-500 mt-0.5">Module 02 "" live pipeline, quality and financial view</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading"¦
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatGrid title="Sales Pipeline" data={data.sales_pipeline} />
          <StatGrid title="Order History" data={data.order_history} />
          <StatGrid title="Quality" data={data.quality} />
          <StatGrid title="Financial" data={data.financial} />
        </div>
      )}
    </div>
  )
}
