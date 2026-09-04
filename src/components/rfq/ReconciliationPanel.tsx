/**
 * ReconciliationPanel - OP20 cross-source reconciliation + the customer query
 * register.
 *
 * The drawing and the model rarely agree perfectly. Rather than guessing, every
 * disagreement becomes a customer query that goes out WITH the quote, so the
 * answer arrives before the order does. Nothing is auto-resolved: a
 * characteristic with no counterpart is reported as drawing-only or model-only,
 * not quietly merged.
 */
import { useCallback, useEffect, useState } from 'react'
import { GitCompare, RefreshCw, MessageSquarePlus, Check, Send } from 'lucide-react'
import {
  getReconciliation, raiseQueriesFromReconciliation, listQueries, updateQuery, createQuery,
  type Reconciliation, type RFQQuery,
} from '../../api/rfqQueriesApi'
import { getCharacteristicSet } from '../../api/characteristicsApi'

interface Props {
  rfqId: string
  /** Optional: if omitted the panel resolves the line item's own set. */
  characteristicSetId?: string | null
  lineItemId?: string | null
}

const VERDICT: Record<string, { label: string; cls: string }> = {
  agree:        { label: 'agree',        cls: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  disagree:     { label: 'disagree',     cls: 'bg-red-50 text-red-800 border-red-300' },
  drawing_only: { label: 'drawing only', cls: 'bg-amber-50 text-amber-800 border-amber-300' },
  model_only:   { label: 'model only',   cls: 'bg-sky-50 text-sky-800 border-sky-300' },
}

const STATUS_CLS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-800 border-amber-300',
  sent: 'bg-sky-50 text-sky-800 border-sky-300',
  answered: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  closed: 'bg-gray-100 text-gray-600 border-gray-300',
}

export function ReconciliationPanel({ rfqId, characteristicSetId, lineItemId }: Props) {
  const [setId, setSetId] = useState<string | null>(characteristicSetId ?? null)
  const [recon, setRecon] = useState<Reconciliation | null>(null)
  const [queries, setQueries] = useState<RFQQuery[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [answering, setAnswering] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [newQ, setNewQ] = useState('')

  const loadQueries = useCallback(() => {
    if (!rfqId) return
    listQueries(rfqId)
      .then((r) => { setQueries(r.queries); setOpenCount(r.open) })
      .catch(() => { /* register is secondary; reconciliation errors surface below */ })
  }, [rfqId])

  // Resolve this line item's characteristic set when one was not passed in.
  useEffect(() => {
    if (characteristicSetId) { setSetId(characteristicSetId); return }
    if (!rfqId) return
    getCharacteristicSet(rfqId, lineItemId ?? undefined)
      .then((s) => setSetId(s?.id ?? null))
      .catch(() => setSetId(null))
  }, [rfqId, lineItemId, characteristicSetId])

  const loadRecon = useCallback(() => {
    if (!setId) { setRecon(null); return }
    setLoading(true); setError(null)
    getReconciliation(setId)
      .then(setRecon)
      .catch((err: unknown) => {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } }
        setError(ax?.response?.status === 404
          ? 'Reconciliation service not found (404) - the backend needs a restart.'
          : ax?.response?.data?.detail ?? 'Reconciliation failed.')
        setRecon(null)
      })
      .finally(() => setLoading(false))
  }, [setId])

  useEffect(() => { loadRecon(); loadQueries() }, [loadRecon, loadQueries])

  const raise = async () => {
    if (!setId) return
    setBusy(true); setError(null); setMsg(null)
    try {
      const r = await raiseQueriesFromReconciliation(setId)
      setMsg(r.raised === 0
        ? 'No new queries - every difference already has one raised.'
        : `${r.raised} customer quer${r.raised === 1 ? 'y' : 'ies'} raised.`)
      loadQueries()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } } }
      const d = e?.response?.data?.detail
      setError(typeof d === 'string' ? d : 'Could not raise queries.')
    } finally { setBusy(false) }
  }

  const saveAnswer = async (id: string) => {
    if (!answerText.trim()) return
    try {
      await updateQuery(id, { answer: answerText.trim() })
      setAnswering(null); setAnswerText(''); loadQueries()
    } catch { setError('Could not save the answer.') }
  }

  const markSent = async (id: string) => {
    try { await updateQuery(id, { status: 'sent' }); loadQueries() }
    catch { setError('Could not update the query.') }
  }

  const addManual = async () => {
    if (!newQ.trim()) return
    try {
      await createQuery({ rfq_id: rfqId, rfq_line_item_id: lineItemId ?? null, question: newQ.trim(), category: 'manual' })
      setNewQ(''); loadQueries()
    } catch { setError('Could not raise the query.') }
  }

  const c = recon?.counts

  return (
    <div className="space-y-4">
      {/* Reconciliation summary */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={loadRecon} disabled={!setId || loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          <GitCompare className="h-3.5 w-3.5" /> {loading ? 'Comparing...' : 'Reconcile sources'}
        </button>
        <button type="button" onClick={raise} disabled={!recon || busy || (recon?.queries_warranted ?? 0) === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          <MessageSquarePlus className="h-3.5 w-3.5" /> {busy ? 'Raising...' : 'Raise customer queries'}
        </button>
        <button type="button" onClick={() => { loadRecon(); loadQueries() }}
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
          <RefreshCw className="h-3 w-3" />
        </button>
        {openCount > 0 && (
          <span className="ml-auto rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {openCount} open quer{openCount === 1 ? 'y' : 'ies'}
          </span>
        )}
      </div>

      {!setId && (
        <p className="text-sm text-gray-400">
          No characteristic set on this line item yet - extract the drawing first (OP20).
        </p>
      )}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{msg}</div>}

      {recon && (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-5">
            {([['Drawing chars', recon.drawing_count], ['Model chars', recon.model_count],
               ['Agree', c?.agree ?? 0], ['Disagree', c?.disagree ?? 0],
               ['Agreement', `${recon.agreement_pct}%`]] as const).map(([l, v]) => (
              <div key={l}>
                <div className="text-[11px] uppercase tracking-wide text-gray-500">{l}</div>
                <div className="font-mono text-sm font-semibold text-gray-900">{v}</div>
              </div>
            ))}
          </div>

          {recon.not_reconciled_count > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {recon.not_reconciled_count} characteristic(s) were not reconciled because they are
              neither drawing- nor model-sourced ({recon.not_reconciled_sources.join(', ')}) - there is
              nothing to compare them against. They remain in the characteristic set.
            </div>
          )}
          {recon.model_count === 0 && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              Only one source is present (no model-derived characteristics), so there is nothing to
              reconcile against. Upload a STEP AP242 model with semantic PMI to compare.
            </div>
          )}

          {recon.findings.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-2 py-2 text-left">Verdict</th>
                    <th className="px-2 py-2 text-left">Characteristic</th>
                    <th className="px-2 py-2 text-left">Drawing</th>
                    <th className="px-2 py-2 text-left">Model</th>
                    <th className="px-2 py-2 text-left">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {recon.findings.map((f, i) => {
                    const v = VERDICT[f.verdict]
                    const val = (ch: typeof f.drawing) => ch
                      ? `${ch.nominal ?? '-'}${ch.upper_tol != null ? ` +${ch.upper_tol}` : ''}${ch.lower_tol != null ? `/${ch.lower_tol}` : ''}${ch.unit ? ' ' + ch.unit : ''}`
                      : '-'
                    return (
                      <tr key={i} className="border-t border-gray-100 align-top">
                        <td className="px-2 py-2">
                          <span className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-medium ${v.cls}`}>{v.label}</span>
                        </td>
                        <td className="px-2 py-2">
                          {(f.drawing || f.model)?.raw_text || (f.drawing || f.model)?.feature_ref || '-'}
                          {(f.drawing || f.model)?.is_key && <span className="ml-1 text-[10px] font-semibold text-amber-700">KEY</span>}
                        </td>
                        <td className="px-2 py-2 font-mono text-xs text-gray-600">{val(f.drawing)}</td>
                        <td className="px-2 py-2 font-mono text-xs text-gray-600">{val(f.model)}</td>
                        <td className="px-2 py-2 text-xs text-gray-600">{f.differences.join('; ') || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Query register */}
      <div className="rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
          Customer query register {queries.length > 0 && <span className="text-gray-400">({queries.length})</span>}
        </div>
        {queries.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-400">No queries raised on this RFQ.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {queries.map((q) => (
              <li key={q.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-start gap-2">
                  <span className="font-mono text-xs text-gray-400">#{q.query_no}</span>
                  <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${STATUS_CLS[q.status] || STATUS_CLS.open}`}>{q.status}</span>
                  {q.category && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{q.category}</span>}
                  {q.source === 'reconciliation' && <span className="text-[11px] text-indigo-600">auto</span>}
                  <span className="min-w-[200px] flex-1 text-sm text-gray-800">{q.question}</span>
                  {q.status !== 'answered' && q.status !== 'closed' && (
                    <div className="flex gap-1">
                      {q.status === 'open' && (
                        <button type="button" onClick={() => markSent(q.id)} title="Mark sent to customer"
                          className="rounded p-1 text-gray-400 hover:bg-sky-50 hover:text-sky-700"><Send className="h-3.5 w-3.5" /></button>
                      )}
                      <button type="button" onClick={() => { setAnswering(q.id); setAnswerText(q.answer || '') }}
                        title="Record the customer's answer"
                        className="rounded p-1 text-gray-400 hover:bg-emerald-50 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
                {q.detail && <p className="mt-0.5 pl-8 text-xs text-gray-500">{q.detail}</p>}
                {q.answer && (
                  <p className="mt-1 pl-8 text-xs text-emerald-800">
                    <span className="font-semibold">Answer:</span> {q.answer}
                    {q.answered_by && <span className="text-gray-400"> - {q.answered_by}</span>}
                  </p>
                )}
                {answering === q.id && (
                  <div className="mt-2 flex gap-2 pl-8">
                    <input value={answerText} onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Customer's answer..."
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" />
                    <button type="button" onClick={() => saveAnswer(q.id)}
                      className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
                    <button type="button" onClick={() => { setAnswering(null); setAnswerText('') }}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600">Cancel</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 border-t border-gray-100 px-3 py-2">
          <input value={newQ} onChange={(e) => setNewQ(e.target.value)}
            placeholder="Raise a query manually..."
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm" />
          <button type="button" onClick={addManual} disabled={!newQ.trim()}
            className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Add</button>
        </div>
      </div>
    </div>
  )
}
