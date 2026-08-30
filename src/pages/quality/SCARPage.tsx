/**
 * SCARPage "" Module 21 gap (Req 21.12/21.13).
 *
 * Supplier Corrective Action Requests: issue a SCAR, track its state machine
 * (Issued †' Supplier Response Received †' Under Review †' Accepted/Rejected †'
 * Closed), and flag overdue responses. Reached at /quality/scars.
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button, Input, Badge } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { listSCARs, createSCAR, transitionSCAR, SCAR } from '../../api/scarApi'

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  Issued: 'info',
  'Supplier Response Received': 'warning',
  'Under Review': 'warning',
  Accepted: 'success',
  Rejected: 'danger',
  Closed: 'default',
}

const NEXT_STATES: Record<string, string[]> = {
  Issued: ['Supplier Response Received'],
  'Supplier Response Received': ['Under Review'],
  'Under Review': ['Accepted', 'Rejected'],
  Accepted: ['Closed'],
  Rejected: ['Issued', 'Closed'],
  Closed: [],
}

export function SCARPage() {
  const [scars, setScars] = useState<SCAR[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [part, setPart] = useState('')
  const [lot, setLot] = useState('')
  const [desc, setDesc] = useState('')
  const [qty, setQty] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setScars(await listSCARs())
    } catch {
      setError('Could not load SCARs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const handleIssue = async () => {
    setError(null)
    try {
      await createSCAR({
        part_number: part || undefined,
        lot_number: lot || undefined,
        nonconformance_desc: desc || undefined,
        qty_affected: qty ? Number(qty) : undefined,
      })
      setPart('')
      setLot('')
      setDesc('')
      setQty('')
      await refetch()
    } catch {
      setError('Could not issue SCAR.')
    }
  }

  const isOverdue = (s: SCAR) =>
    s.status === 'Issued' && new Date(s.response_due_date) < new Date()

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Corrective Actions (SCAR)</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 21 "" AS9100D clause 8.4 · response due auto-set to 15 business days
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={14} />} title="Refresh" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Issue SCAR</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Input label="Part Number" value={part} onChange={(e) => setPart(e.target.value)} />
          <Input label="Lot Number" value={lot} onChange={(e) => setLot(e.target.value)} />
          <Input label="Qty Affected" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Input label="Non-conformance" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={handleIssue} icon={<Plus size={16} />}>
            Issue SCAR
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">SCAR</th>
              <th className="px-4 py-2 text-left">Part</th>
              <th className="px-4 py-2 text-left">Issued</th>
              <th className="px-4 py-2 text-left">Due</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 animate-pulse">Loading"¦</td></tr>
            ) : scars.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No SCARs yet.</td></tr>
            ) : (
              scars.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-amber-700">{s.scar_number}</td>
                  <td className="px-4 py-2">{s.part_number ?? '""'}</td>
                  <td className="px-4 py-2">{formatDate(s.issued_date)}</td>
                  <td className="px-4 py-2">
                    {formatDate(s.response_due_date)}
                    {isOverdue(s) && <Badge variant="danger" size="sm" className="ml-2">Overdue</Badge>}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[s.status] ?? 'default'} size="sm">{s.status}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(NEXT_STATES[s.status] ?? []).map((next) => (
                        <Button
                          key={next}
                          variant={next === 'Rejected' ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={async () => {
                            try {
                              await transitionSCAR(s.id, next)
                              await refetch()
                            } catch {
                              setError('Transition failed.')
                            }
                          }}
                        >
                          {next}
                        </Button>
                      ))}
                    </div>
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
