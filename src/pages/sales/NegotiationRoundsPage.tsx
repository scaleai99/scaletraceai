/**
 * NegotiationRoundsPage "" Module 04 gap (Req 4.11, 4.12).
 *
 * Per-RFQ negotiation tracker: list rounds, add a round, and set an outcome.
 * Marking a round "Agreed" transitions the RFQ to PO Received on the backend.
 * Reached at /sales/rfqs/:id/negotiation.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button, Badge, Input } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import {
  listRounds,
  createRound,
  updateOutcome,
  NegotiationRound,
} from '../../api/negotiationApi'

const OUTCOME_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  Agreed: 'success',
  Rejected: 'danger',
  Ongoing: 'warning',
}

export function NegotiationRoundsPage() {
  const { id: rfqId = '' } = useParams()
  const navigate = useNavigate()

  const [rounds, setRounds] = useState<NegotiationRound[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerPrice, setCustomerPrice] = useState('')
  const [counterPrice, setCounterPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRounds(await listRounds(rfqId))
    } catch (e) {
      setError('Could not load negotiation rounds.')
    } finally {
      setLoading(false)
    }
  }, [rfqId])

  useEffect(() => {
    if (rfqId) void refetch()
  }, [rfqId, refetch])

  const handleAdd = async () => {
    setError(null)
    try {
      await createRound(rfqId, {
        customer_price_inr: customerPrice ? Number(customerPrice) : undefined,
        counter_price_inr: counterPrice ? Number(counterPrice) : undefined,
        discount_pct: discount ? Number(discount) : undefined,
        notes: notes || undefined,
      })
      setCustomerPrice('')
      setCounterPrice('')
      setDiscount('')
      setNotes('')
      await refetch()
    } catch {
      setError('Could not add round.')
    }
  }

  const handleOutcome = async (
    roundId: string,
    outcome: 'Agreed' | 'Rejected',
  ) => {
    try {
      await updateOutcome(rfqId, roundId, outcome)
      await refetch()
    } catch {
      setError('Could not update outcome.')
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/sales/rfqs/${rfqId}`)}
            icon={<ArrowLeft size={14} />}
            title="Back to RFQ"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Negotiation Rounds</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Module 04 "" record each round; marking one "Agreed" closes the RFQ as won.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={refetch}
          icon={<RefreshCw size={14} />}
          title="Refresh"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add round form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Round</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            label="Customer Price (‚¹)"
            type="number"
            value={customerPrice}
            onChange={(e) => setCustomerPrice(e.target.value)}
          />
          <Input
            label="Counter Price (‚¹)"
            type="number"
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
          />
          <Input
            label="Discount %"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={handleAdd} icon={<Plus size={16} />}>
            Add Round
          </Button>
        </div>
      </div>

      {/* Rounds table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Round</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-right">Customer ‚¹</th>
              <th className="px-4 py-2 text-right">Counter ‚¹</th>
              <th className="px-4 py-2 text-right">Disc %</th>
              <th className="px-4 py-2 text-left">Outcome</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400 animate-pulse">
                  Loading"¦
                </td>
              </tr>
            ) : rounds.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No rounds yet "" add the first one above.
                </td>
              </tr>
            ) : (
              rounds.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-semibold">#{r.round_number}</td>
                  <td className="px-4 py-2">{formatDate(r.round_date)}</td>
                  <td className="px-4 py-2 text-right">{r.customer_price_inr ?? '""'}</td>
                  <td className="px-4 py-2 text-right">{r.counter_price_inr ?? '""'}</td>
                  <td className="px-4 py-2 text-right">{r.discount_pct ?? '""'}</td>
                  <td className="px-4 py-2">
                    <Badge variant={OUTCOME_VARIANT[r.outcome] ?? 'default'} size="sm">
                      {r.outcome}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    {r.outcome === 'Ongoing' && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOutcome(r.id, 'Agreed')}
                        >
                          Agree
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOutcome(r.id, 'Rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
