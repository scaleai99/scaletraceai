/**
 * AI Agents API client — the 12 operation-scoped agents on the RFQ flow.
 * Agents RUN (real output only) and a human SIGNS to accept — see api/agents.py.
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/agents'

export interface AgentSpec {
  key: string
  op: string
  stage: number
  name: string
  type: string
  status: 'live' | 'planned' | string
  description: string
}

export interface AgentRun {
  id: string
  rfq_id: string
  agent_key: string
  agent_name: string
  op: string | null
  status: 'success' | 'partial' | 'no_data' | 'failed' | 'manual' | string
  summary: string | null
  output: unknown | null
  ran_by: string | null
  ran_at: string | null
  signed_by: string | null
  signed_at: string | null
}

export const listAgents = () =>
  apiClient.get<{ agents: AgentSpec[] }>(BASE).then((r) => r.data.agents)

export const listAgentRuns = (rfqId: string) =>
  apiClient.get<{ runs: AgentRun[] }>(`${BASE}/runs`, { params: { rfq_id: rfqId } }).then((r) => r.data.runs)

export const runAgent = (agentKey: string, rfqId: string) =>
  apiClient.post<AgentRun>(`${BASE}/${agentKey}/run`, { rfq_id: rfqId }).then((r) => r.data)

export const signAgentRun = (runId: string) =>
  apiClient.post<AgentRun>(`${BASE}/runs/${runId}/sign`, {}).then((r) => r.data)
