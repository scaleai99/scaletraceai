import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, X, ExternalLink, RefreshCw } from 'lucide-react'
import {
  listConfigReviews,
  listContractReviews,
  reviewStatus,
  stageLabel,
  type ReviewRow,
  type ReviewStatus,
} from '../../api/reviewsApi'
import { ConfigReviewPanel } from '../../components/reviews/ConfigReviewPanel'
import { ContractReviewPanel } from '../../components/reviews/ContractReviewPanel'

type TabKey = 'config' | 'contract'

const STATUS_STYLES: Record<ReviewStatus, string> = {
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Reviewed: 'bg-amber-100 text-amber-700 border-amber-200',
  Pending: 'bg-gray-100 text-gray-600 border-gray-200',
}

function StatusBadge({ s }: { s: ReviewStatus }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[s]}`}>
      {s}
    </span>
  )
}

export function ReviewsPage() {
  const [tab, setTab] = useState<TabKey>('config')
  const [stage, setStage] = useState<'' | 'RFQ' | 'PO'>('')
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReviewRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetcher = tab === 'config' ? listConfigReviews : listContractReviews
      setRows(await fetcher(stage || undefined))
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [tab, stage])

  useEffect(() => {
    void load()
  }, [load])

  const title = tab === 'config' ? 'Configuration Reviews' : 'Contract Reviews'
  const subtitle =
    tab === 'config'
      ? 'Drawing / configuration verification gates (Config Review 1/2/3)'
      : 'Commercial & legal feasibility gates (Contract Review 1/2)'

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck className="w-5 h-5 text-amber-500" />
        <h1 className="text-xl font-semibold text-[#222]">Reviews</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Standalone review gates from the order-to-delivery flow. Each review is linked to its RFQ or
        Customer PO; open one to complete the checklist and approve.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {(['config', 'contract'] as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => {
              setTab(k)
              setSelected(null)
            }}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === k
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {k === 'config' ? 'Configuration Reviews' : 'Contract Reviews'}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#333]">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as '' | 'RFQ' | 'PO')}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All stages</option>
            <option value="RFQ">RFQ Stage</option>
            <option value="PO">PO Stage</option>
          </select>
          <button
            onClick={() => void load()}
            className="text-xs flex items-center gap-1 border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left font-medium px-3 py-2">Stage</th>
              <th className="text-left font-medium px-3 py-2">Linked {tab === 'config' ? 'RFQ/PO' : 'RFQ/PO'}</th>
              <th className="text-left font-medium px-3 py-2">Outcome</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-left font-medium px-3 py-2">Created</th>
              <th className="text-right font-medium px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  Loading"¦
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  No {tab === 'config' ? 'configuration' : 'contract'} reviews yet. They are created
                  from an RFQ / Customer PO as it moves through the flow.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const linkTo =
                  r.review_type === 'PO'
                    ? `/sales/customer-pos/${r.linked_id}`
                    : `/sales/rfqs/${r.linked_id}`
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">{stageLabel(r.review_type)}</td>
                    <td className="px-3 py-2">
                      <Link to={linkTo} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        {r.linked_id.slice(0, 8)}"¦ <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{r.overall_outcome ?? '""'}</td>
                    <td className="px-3 py-2">
                      <StatusBadge s={reviewStatus(r)} />
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setSelected(r)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white rounded px-2 py-1"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative z-50 w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold text-sm">
                  {tab === 'config' ? 'Configuration Review' : 'Contract Review'} "" {stageLabel(selected.review_type)}
                </h3>
                <p className="text-xs text-gray-500">Linked: {selected.linked_id.slice(0, 8)}"¦</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {tab === 'config' ? (
                <ConfigReviewPanel
                  rfqId={selected.linked_id}
                  reviewId={selected.id}
                  rfqStatus="Configuration Review-1"
                  isQualityManager
                  onComplete={() => {
                    void load()
                  }}
                />
              ) : (
                <ContractReviewPanel
                  rfqId={selected.linked_id}
                  reviewId={selected.id}
                  rfqStatus="Contract Review-1"
                  isQualityManager
                  onComplete={() => {
                    void load()
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewsPage
