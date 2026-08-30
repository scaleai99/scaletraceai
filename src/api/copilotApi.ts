import { apiClient } from './axiosClient'

export interface ChatResponse {
  response: string
  results: unknown[]
  modules_queried: string[]
  fallback: boolean
}

export const sendCopilotMessage = (message: string, conversation_history?: unknown[]) =>
  apiClient.post<ChatResponse>('/api/v1/copilot/chat', {
    message,
    conversation_history: conversation_history ?? [],
  }).then(r => r.data)

export const getCopilotHistory = () =>
  apiClient.get<{ query: string; timestamp: string }[]>('/api/v1/copilot/history').then(r => r.data)
