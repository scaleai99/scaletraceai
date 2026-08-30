/**
 * WhatsAppLogPage "" Module 34 gap (Req 34.5).
 *
 * Audit log of WhatsApp document-delivery attempts (quotations, delivery
 * challans, invoices). Reached at /finance/whatsapp-log.
 */
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button, Badge } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { listWhatsAppLog, WhatsAppLog } from '../../api/whatsappApi'

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'info'> = {
  Sent: 'success',
  Delivered: 'success',
  Failed: 'danger',
}

export function WhatsAppLogPage() {
  const [rows, setRows] = useState<WhatsAppLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await listWhatsAppLog())
    } catch {
      setError('Could not load delivery log.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Delivery Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 34 "" every WhatsApp document-delivery attempt is logged (Req 34.5)
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={14} />} title="Refresh" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Document</th>
              <th className="px-4 py-2 text-left">Recipient</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Sent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 animate-pulse">Loading"¦</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No delivery attempts logged.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 capitalize">{r.doc_type ?? '""'}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.recipient_number ?? '""'}</td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[r.delivery_status ?? ''] ?? 'default'} size="sm">
                      {r.delivery_status ?? '""'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{r.send_timestamp ? formatDate(r.send_timestamp) : '""'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
