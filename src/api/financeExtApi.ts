import { apiClient } from './axiosClient'

// ── General Ledger ──────────────────────────────────────────────────────────
export interface GLAccount { id: string; code: string; name: string; account_type: string; parent_code?: string | null; is_active: boolean }
export interface JournalLine { account_code: string; description?: string | null; debit: number; credit: number }
export interface JournalEntry { id: string; entry_no: string; entry_date: string; narration?: string | null; reference?: string | null; status: string; total_debit: number; total_credit: number; lines: JournalLine[] }
export interface TrialBalanceRow { account_code: string; account_name: string; debit: number; credit: number; balance: number }

export const listAccounts = () => apiClient.get<GLAccount[]>('/api/v1/gl/accounts').then(r => r.data)
export const createAccount = (b: Omit<GLAccount, 'id'>) => apiClient.post<GLAccount>('/api/v1/gl/accounts', b).then(r => r.data)
export const listJournalEntries = (status?: string) => apiClient.get<JournalEntry[]>('/api/v1/gl/journal-entries', { params: status ? { status } : {} }).then(r => r.data)
export const createJournalEntry = (b: { entry_date: string; narration?: string; reference?: string; lines: JournalLine[] }) => apiClient.post<JournalEntry>('/api/v1/gl/journal-entries', b).then(r => r.data)
export const postJournalEntry = (id: string) => apiClient.post(`/api/v1/gl/journal-entries/${id}/post`).then(r => r.data)
export const getTrialBalance = () => apiClient.get<{ rows: TrialBalanceRow[]; total_debit: number; total_credit: number }>('/api/v1/gl/trial-balance').then(r => r.data)

// ── Fixed Assets ──────────────────────────────────────────────────────────
export interface FixedAsset { id: string; asset_code: string; name: string; category?: string | null; acquisition_date?: string | null; cost: number; useful_life_years: number; salvage_value: number; depreciation_method: string; accumulated_depreciation: number; book_value: number; location?: string | null; status: string }
export const listAssets = () => apiClient.get<FixedAsset[]>('/api/v1/fixed-assets/').then(r => r.data)
export const createAsset = (b: Partial<FixedAsset>) => apiClient.post<FixedAsset>('/api/v1/fixed-assets/', b).then(r => r.data)
export const depreciateAsset = (id: string) => apiClient.post(`/api/v1/fixed-assets/${id}/depreciate`).then(r => r.data)

// ── Budget ──────────────────────────────────────────────────────────────────
export interface BudgetLine { id: string; fy: string; department: string; category: string; period: string; budget_amount: number; actual_amount: number; variance: number; variance_pct: number }
export const listBudgets = (fy?: string) => apiClient.get<BudgetLine[]>('/api/v1/budgets/', { params: fy ? { fy } : {} }).then(r => r.data)
export const createBudget = (b: { fy: string; department: string; category: string; period?: string; budget_amount?: number; actual_amount?: number }) => apiClient.post<BudgetLine>('/api/v1/budgets/', b).then(r => r.data)
export const getBudgetVariance = (fy?: string) => apiClient.get<{ rows: { category: string; budget: number; actual: number; variance: number }[] }>('/api/v1/budgets/variance', { params: fy ? { fy } : {} }).then(r => r.data)
