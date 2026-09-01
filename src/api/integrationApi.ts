import { apiClient } from './axiosClient'

export interface EDIMessage { id: string; direction: string; doc_type: string; partner?: string | null; reference?: string | null; payload?: string | null; status: string; created_at?: string | null }
export const listEdi = () => apiClient.get<EDIMessage[]>('/api/v1/integration/edi').then(r => r.data)
export const createEdi = (b: { direction: string; doc_type: string; partner?: string; reference?: string; payload?: string }) => apiClient.post<EDIMessage>('/api/v1/integration/edi', b).then(r => r.data)
export const processEdi = (id: string) => apiClient.post<EDIMessage>(`/api/v1/integration/edi/${id}/process`).then(r => r.data)

export interface PaymentTxn { id: string; txn_ref: string; gateway: string; direction: string; party?: string | null; invoice_ref?: string | null; amount: number; currency: string; status: string; created_at?: string | null }
export const listPayments = () => apiClient.get<PaymentTxn[]>('/api/v1/integration/payments').then(r => r.data)
export const createPayment = (b: { gateway: string; direction: string; party?: string; invoice_ref?: string; amount: number; currency?: string }) => apiClient.post<PaymentTxn>('/api/v1/integration/payments', b).then(r => r.data)
export const settlePayment = (id: string, result: 'Success' | 'Failed') => apiClient.post<PaymentTxn>(`/api/v1/integration/payments/${id}/settle`, null, { params: { result } }).then(r => r.data)

export interface SignatureRequest { id: string; document_type: string; document_ref?: string | null; signer_name: string; signer_email?: string | null; status: string; signature_hash?: string | null; signed_at?: string | null; created_at?: string | null }
export const listSignatures = () => apiClient.get<SignatureRequest[]>('/api/v1/integration/signatures').then(r => r.data)
export const createSignature = (b: { document_type: string; document_ref?: string; signer_name: string; signer_email?: string }) => apiClient.post<SignatureRequest>('/api/v1/integration/signatures', b).then(r => r.data)
export const signSignature = (id: string) => apiClient.post<SignatureRequest>(`/api/v1/integration/signatures/${id}/sign`).then(r => r.data)
