/**
 * DocumentControlPage "" Module 21 QMS: Document Control.
 *
 * Features:
 * - Stats cards: total docs, pending review, active approved, obsolete
 * - Table: doc_number, title, doc_type, revision, status (badge), effective_date
 * - Action buttons: Submit for Review, Approve, Obsolete (role-gated)
 * - New Document modal
 * - Status filter
 */

import { useState } from 'react'
import { FileText, RefreshCw, Plus, Clock, CheckCircle, Archive, Files } from 'lucide-react'
import {
  listDocuments,
  createDocument,
  submitForReview,
  approveDocument,
  rejectDocument,
  obsoleteDocument,
  type DocumentControlRecord,
} from '../../api/documentControlApi'
import { formatDate } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_DOCUMENTS } from '../../lib/demoData'
import { DemoBanner } from '../../components/ui/DemoBanner'

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  'Under Review': 'bg-orange-100 text-orange-700',
  Approved: 'bg-green-100 text-green-700',
  Obsolete: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Stats card
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const DOC_TYPES = [
  'Work Instruction',
  'Quality Manual',
  'Procedure',
  'Form',
  'Drawing',
]

const STATUS_FILTERS = ['', 'Draft', 'Under Review', 'Approved', 'Obsolete']

export function DocumentControlPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  // New document form state
  const [newTitle, setNewTitle] = useState('')
  const [newDocType, setNewDocType] = useState('')
  const [newRevision, setNewRevision] = useState('A')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Action loading state
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: docs, isDemo, loading, error, refetch } = useDemoFallback<DocumentControlRecord>(
    () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      return listDocuments(params)
    },
    DEMO_DOCUMENTS,
    [statusFilter],
  )

  const fetchDocs = () => refetch()

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------
  const stats = {
    total: docs.length,
    pendingReview: docs.filter((d) => d.status === 'Under Review').length,
    approved: docs.filter((d) => d.status === 'Approved').length,
    obsolete: docs.filter((d) => d.status === 'Obsolete').length,
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setCreateError('Title is required')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      await createDocument({
        title: newTitle.trim(),
        doc_type: newDocType || null,
        revision: newRevision || 'A',
      })
      setShowCreate(false)
      setNewTitle('')
      setNewDocType('')
      setNewRevision('A')
      await fetchDocs()
    } catch (e: unknown) {
      setCreateError('Failed to create document')
    } finally {
      setCreating(false)
    }
  }

  const handleSubmitForReview = async (id: string) => {
    setActionLoading(id + ':review')
    try {
      await submitForReview(id)
      await fetchDocs()
    } catch (e: unknown) {
      // action failed "" silently refresh
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id + ':approve')
    try {
      await approveDocument(id)
      await fetchDocs()
    } catch (e: unknown) {
      // action failed
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id + ':reject')
    try {
      await rejectDocument(id)
      await fetchDocs()
    } catch (e: unknown) {
      // action failed
    } finally {
      setActionLoading(null)
    }
  }

  const handleObsolete = async (id: string) => {
    if (!window.confirm('Mark this document as Obsolete? This cannot be undone.')) return
    setActionLoading(id + ':obsolete')
    try {
      await obsoleteDocument(id)
      await fetchDocs()
    } catch (e: unknown) {
      // action failed
    } finally {
      setActionLoading(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Document Control</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDocs}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={stats.total}
          icon={<Files className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Active (Approved)"
          value={stats.approved}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Obsolete"
          value={stats.obsolete}
          icon={<Archive className="w-5 h-5 text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 font-medium">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s || 'All Statuses'}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Demo banner */}
      {isDemo && <DemoBanner />}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Doc Number', 'Title', 'Type', 'Rev', 'Status', 'Effective Date', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading"¦
                </td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No documents found.
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-blue-700">{doc.doc_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{doc.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.doc_type ?? '""'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{doc.revision}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {doc.effective_date ? formatDate(doc.effective_date) : '""'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {doc.status === 'Draft' && (
                        <button
                          onClick={() => handleSubmitForReview(doc.id)}
                          disabled={actionLoading === doc.id + ':review'}
                          className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                        >
                          Submit for Review
                        </button>
                      )}
                      {doc.status === 'Under Review' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc.id)}
                            disabled={actionLoading === doc.id + ':approve'}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(doc.id)}
                            disabled={actionLoading === doc.id + ':reject'}
                            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {doc.status === 'Approved' && (
                        <button
                          onClick={() => handleObsolete(doc.id)}
                          disabled={actionLoading === doc.id + ':obsolete'}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Obsolete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">New Document</h2>

            {createError && (
              <div className="bg-red-50 text-red-700 rounded-lg p-2 text-sm">{createError}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">"" Select Type ""</option>
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                <input
                  type="text"
                  value={newRevision}
                  onChange={(e) => setNewRevision(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="A"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating"¦' : 'Create Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
