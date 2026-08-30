/**
 * SupplierQualityClausesPage "" Module 03 gap (Req 3.12).
 *
 * Manage a supplier's reusable quality-clause library. Mandatory clauses flow
 * down automatically onto POs for the matching commodity; conditional clauses
 * are offered for inclusion at PO time. Reached at
 * /masters/suppliers/:id/quality-clauses.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Trash2, RefreshCw } from 'lucide-react'
import { Button, Input, Badge } from '../../components/ui'
import {
  listClauses,
  createClause,
  deleteClause,
  QualityClause,
} from '../../api/supplierQualityApi'

export function SupplierQualityClausesPage() {
  const { id: supplierId = '' } = useParams()
  const navigate = useNavigate()

  const [clauses, setClauses] = useState<QualityClause[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [num, setNum] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [commodity, setCommodity] = useState('')
  const [mandatory, setMandatory] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setClauses(await listClauses(supplierId))
    } catch {
      setError('Could not load clauses.')
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  useEffect(() => {
    if (supplierId) void refetch()
  }, [supplierId, refetch])

  const handleAdd = async () => {
    if (!num || !title || !text) return
    setError(null)
    try {
      await createClause(supplierId, {
        clause_number: num,
        clause_title: title,
        clause_text: text,
        commodity_category: commodity || undefined,
        is_mandatory: mandatory,
      })
      setNum(''); setTitle(''); setText(''); setCommodity(''); setMandatory(true)
      await refetch()
    } catch {
      setError('Could not add clause (number may already exist).')
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/masters/suppliers/${supplierId}`)}
          icon={<ArrowLeft size={14} />}
          title="Back to supplier"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Clause Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 03 "" mandatory clauses flow down onto POs automatically (AS9100D 8.4)
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Clause</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Clause No." value={num} onChange={(e) => setNum(e.target.value)} />
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
        </div>
        <div className="mt-3">
          <Input label="Clause Text" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        </div>
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />
            Mandatory
          </label>
          <Button variant="primary" onClick={handleAdd} icon={<Plus size={16} />}>Add Clause</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">No.</th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Commodity</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 animate-pulse">Loading"¦</td></tr>
            ) : clauses.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No clauses yet.</td></tr>
            ) : (
              clauses.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs font-semibold">{c.clause_number}</td>
                  <td className="px-4 py-2">{c.clause_title}</td>
                  <td className="px-4 py-2">{c.commodity_category ?? '""'}</td>
                  <td className="px-4 py-2">
                    <Badge variant={c.is_mandatory ? 'success' : 'default'} size="sm">
                      {c.is_mandatory ? 'Mandatory' : 'Conditional'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      title="Delete"
                      onClick={async () => {
                        await deleteClause(supplierId, c.id)
                        await refetch()
                      }}
                    />
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
