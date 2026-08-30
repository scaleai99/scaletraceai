/**
 * Supplier Quality Clause Library API client - Module 03 gap (Req 3.12/3.13).
 */
import axios from 'axios'

const V1 = '/api/v1'

export interface QualityClause {
  id: string
  supplier_id: string
  clause_number: string
  clause_title: string
  clause_text: string
  commodity_category: string | null
  is_mandatory: boolean
  created_at: string
}

export interface QualityClauseCreate {
  clause_number: string
  clause_title: string
  clause_text: string
  commodity_category?: string
  is_mandatory?: boolean
}

export async function listClauses(supplierId: string): Promise<QualityClause[]> {
  const { data } = await axios.get<QualityClause[]>(`${V1}/suppliers/${supplierId}/quality-clauses`)
  return data
}

export async function createClause(
  supplierId: string,
  body: QualityClauseCreate,
): Promise<QualityClause> {
  const { data } = await axios.post<QualityClause>(
    `${V1}/suppliers/${supplierId}/quality-clauses`,
    body,
  )
  return data
}

export async function deleteClause(supplierId: string, clauseId: string): Promise<void> {
  await axios.delete(`${V1}/suppliers/${supplierId}/quality-clauses/${clauseId}`)
}
