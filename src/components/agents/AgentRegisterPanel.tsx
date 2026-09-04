/**
 * AgentRegisterPanel — the 12 operation-scoped AI agents for one RFQ job.
 *
 * Grounded, not simulated: "live" agents call real backend endpoints and show
 * real output; "planned" agents show an honest status and cannot fabricate a
 * result. A produced result is accepted only when a human signs it.
 */
import { useCallback, useEffect, useState } from 'react'
import { Bot, Play, Check, Loader2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import {
  listAgents,
  listAgentRuns,
  runAgent,
  signAgentRun,
  type AgentSpec,
  type AgentRun,
} from '../../api/agentsApi'

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    planned: 'bg-gray-50 text-gray-500 border-gray-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    no_data: 'bg-gray-50 text-gray-500 border-gray-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    manual: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  const label: Record<string, string> = {
    live: 'Live', planned: 'Planned', success: 'Success', partial: 'Differences',
    no_data: 'No data', failed: 'Failed', manual: 'Manual',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? map.planned}`}>
      {label[status] ?? status}
    </span>
  )
}

export function AgentRegisterPanel({ rfqId }: { rfqId: string }) {
  const [agents, setAgents] = useState<AgentSpec[]>([])
  const [runs, setRuns] = useState<Record<string, AgentRun>>({})
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listAgents().then(setAgents).catch(() => setAgents([]))
    listAgentRuns(rfqId)
      .then((rs) => {
        const byKey: Record<string, AgentRun> = {}
        for (const r of rs) byKey[r.agent_key] = r
        setRuns(byKey)
      })
      .catch(() => {})
  }, [rfqId])

  useEffect(() => { if (open) load() }, [open, load])

  const liveCount = agents.filter((a) => a.status === 'live').length
  const ranCount = Object.values(runs).filter((r) => r.status !== 'manual').length

  const doRun = async (key: string) => {
    setBusy(key); setError(null)
    try {
      const run = await runAgent(key, rfqId)
      setRuns((prev) => ({ ...prev, [key]: run }))
      setExpanded(key)
    } catch (e) {
      const ax = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(ax?.response?.data?.detail ?? ax?.message ?? 'Agent run failed')
    } finally { setBusy(null) }
  }

  const doSign = async (run: AgentRun) => {
    setBusy(run.agent_key); setError(null)
    try {
      const signed = await signAgentRun(run.id)
      setRuns((prev) => ({ ...prev, [run.agent_key]: signed }))
    } catch (e) {
      const ax = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(ax?.response?.data?.detail ?? ax?.message ?? 'Could not sign')
    } finally { setBusy(null) }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <Bot size={18} className="text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">AI Agents</span>
          <span className="text-xs text-gray-400">
            {liveCount} live · {agents.length ? `${agents.length} in the route` : ''}{ranCount ? ` · ${ranCount} run on this job` : ''}
          </span>
        </span>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-2">
          <p className="text-xs text-gray-500 -mt-1 mb-2">
            Each agent is scoped to one operation and writes its result back to this job. Live agents
            run against real data; nothing is accepted until a human signs it.
          </p>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={13} /> {error}
            </div>
          )}
          {agents.map((a) => {
            const run = runs[a.key]
            const isLive = a.status === 'live'
            const signable = run && ['success', 'partial'].includes(run.status) && !run.signed_at
            const isOpen = expanded === a.key
            return (
              <div key={a.key} className="rounded-lg border border-gray-200">
                <div className="flex items-start gap-3 px-3 py-2.5">
                  <span className="mt-0.5 font-mono text-[10px] text-gray-400 w-8 shrink-0">Op {a.op}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{a.name}</span>
                      <StatusPill status={a.status} />
                      {run && run.status !== 'manual' && <StatusPill status={run.status} />}
                      {run?.signed_at && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <Check size={11} /> Signed
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-mono">{a.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                    {run?.summary && (
                      <p className={`text-xs mt-1 ${run.status === 'failed' ? 'text-red-600' : run.status === 'manual' || run.status === 'no_data' ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                        {run.summary}
                      </p>
                    )}
                    {run?.output != null && (
                      <button type="button" onClick={() => setExpanded(isOpen ? null : a.key)} className="mt-1 text-[11px] text-indigo-600 hover:text-indigo-800">
                        {isOpen ? 'Hide details' : 'View details'}
                      </button>
                    )}
                    {isOpen && run?.output != null && (
                      <pre className="mt-1 max-h-64 overflow-auto rounded bg-gray-50 border border-gray-100 p-2 text-[11px] leading-snug text-gray-700 whitespace-pre-wrap break-words">
                        {JSON.stringify(run.output, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {isLive ? (
                      <button
                        type="button"
                        onClick={() => doRun(a.key)}
                        disabled={busy === a.key}
                        className="inline-flex items-center gap-1.5 rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                      >
                        {busy === a.key ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        {run ? 'Re-run' : 'Run'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">manual</span>
                    )}
                    {signable && (
                      <button
                        type="button"
                        onClick={() => doSign(run!)}
                        disabled={busy === a.key}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={12} /> Accept &amp; Sign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
