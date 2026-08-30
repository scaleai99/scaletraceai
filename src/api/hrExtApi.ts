import { apiClient } from './axiosClient'

// ── Payroll ──────────────────────────────────────────────────────────────────
export interface PayrollRun { id: string; period: string; run_date?: string | null; status: string; total_gross: number; total_deductions: number; total_net: number }
export interface Payslip { id: string; run_id: string; employee_name: string; basic: number; hra: number; allowances: number; gross: number; pf: number; esi: number; tds: number; other_deductions: number; net_pay: number }
export const listRuns = () => apiClient.get<PayrollRun[]>('/api/v1/payroll/runs').then(r => Array.isArray(r.data) ? r.data : [])
export const createRun = (b: { period: string; run_date?: string }) => apiClient.post<PayrollRun>('/api/v1/payroll/runs', b).then(r => r.data)
export const getRun = (id: string) => apiClient.get<PayrollRun & { payslips: Payslip[] }>(`/api/v1/payroll/runs/${id}`).then(r => r.data)
export const addPayslip = (runId: string, b: { employee_name: string; basic: number; hra: number; allowances: number; tds?: number; other_deductions?: number }) => apiClient.post<Payslip>(`/api/v1/payroll/runs/${runId}/payslips`, b).then(r => r.data)
export const processRun = (id: string) => apiClient.post<PayrollRun>(`/api/v1/payroll/runs/${id}/process`).then(r => r.data)

// ── Appraisal ──────────────────────────────────────────────────────────────
export interface Appraisal { id: string; employee_name: string; period: string; rating?: number | null; goals?: string | null; achievements?: string | null; reviewer?: string | null; status: string }
export const listAppraisals = (status?: string) => apiClient.get<Appraisal[]>('/api/v1/appraisals/', { params: status ? { status } : {} }).then(r => Array.isArray(r.data) ? r.data : [])
export const createAppraisal = (b: Partial<Appraisal>) => apiClient.post<Appraisal>('/api/v1/appraisals/', b).then(r => r.data)
export const updateAppraisal = (id: string, b: Partial<Appraisal>) => apiClient.patch<Appraisal>(`/api/v1/appraisals/${id}`, b).then(r => r.data)

// ── Recruitment ──────────────────────────────────────────────────────────────
export interface JobRequisition { id: string; title: string; department?: string | null; positions: number; status: string }
export interface Candidate { id: string; requisition_id?: string | null; name: string; email?: string | null; phone?: string | null; stage: string; notes?: string | null }
export const listReqs = () => apiClient.get<JobRequisition[]>('/api/v1/recruitment/requisitions').then(r => Array.isArray(r.data) ? r.data : [])
export const createReq = (b: { title: string; department?: string; positions?: number }) => apiClient.post<JobRequisition>('/api/v1/recruitment/requisitions', b).then(r => r.data)
export const updateReq = (id: string, b: { status?: string; positions?: number }) => apiClient.patch<JobRequisition>(`/api/v1/recruitment/requisitions/${id}`, b).then(r => r.data)
export const listCandidates = (requisition_id?: string) => apiClient.get<Candidate[]>('/api/v1/recruitment/candidates', { params: requisition_id ? { requisition_id } : {} }).then(r => Array.isArray(r.data) ? r.data : [])
export const createCandidate = (b: Partial<Candidate>) => apiClient.post<Candidate>('/api/v1/recruitment/candidates', b).then(r => r.data)
export const updateCandidate = (id: string, b: { stage?: string; notes?: string }) => apiClient.patch<Candidate>(`/api/v1/recruitment/candidates/${id}`, b).then(r => r.data)

// ── Employee Self-Service (Leave) ───────────────────────────────────────────
export interface LeaveRequest { id: string; employee_name: string; leave_type: string; from_date: string; to_date: string; days: number; reason?: string | null; status: string }
export const listLeave = (status?: string) => apiClient.get<LeaveRequest[]>('/api/v1/ess/leave-requests', { params: status ? { status } : {} }).then(r => Array.isArray(r.data) ? r.data : [])
export const applyLeave = (b: { employee_name: string; leave_type: string; from_date: string; to_date: string; reason?: string }) => apiClient.post<LeaveRequest>('/api/v1/ess/leave-requests', b).then(r => r.data)
export const decideLeave = (id: string, decision: 'Approved' | 'Rejected') => apiClient.post<LeaveRequest>(`/api/v1/ess/leave-requests/${id}/decision`, null, { params: { decision } }).then(r => r.data)
