/**
 * WhatsApp delivery API client - Module 34 gap (Req 34.5).
 */
import { apiClient } from './axiosClient'

const BASE = '/api/v1/documents'

export interface WhatsAppLog {
  id: string
  doc_type: string | null
  doc_id: string | null
  recipient_number: string | null
  delivery_status: string | null
  send_timestamp: string | null
}

export async function sendWhatsApp(
  docType: 'quotation' | 'dc' | 'invoice',
  docId: string,
  recipientNumber: string,
) {
  const { data } = await apiClient.post(`${BASE}/${docType}/${docId}/send-whatsapp`, {
    recipient_number: recipientNumber,
  })
  return data
}

export async function listWhatsAppLog(docType?: string): Promise<WhatsAppLog[]> {
  const { data } = await apiClient.get<WhatsAppLog[]>(`${BASE}/whatsapp-delivery-log`, {
    params: docType ? { doc_type: docType } : {},
  })
  return Array.isArray(data) ? data : []
}
