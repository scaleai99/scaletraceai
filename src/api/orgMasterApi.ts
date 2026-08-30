/**
 * orgMasterApi.ts - Designation Master & Department Master API client
 * Endpoints: /api/v1/hr/designations, /api/v1/hr/departments
 */
import { apiClient as api } from './axiosClient'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Designation {
  id: string
  designation_code: string
  designation_name: string
  short_name: string | null
  department: string | null
  level: number | null
  reporting_to: string | null
  function: string | null
  pay_grade: string | null
  min_salary: number | null
  max_salary: number | null
  min_experience_years: number | null
  education_required: string | null
  responsibilities: string | null
  skills_required: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface DesignationCreate {
  designation_code: string
  designation_name: string
  short_name?: string
  department?: string
  level?: number
  reporting_to?: string
  function?: string
  pay_grade?: string
  min_salary?: number
  max_salary?: number
  min_experience_years?: number
  education_required?: string
  responsibilities?: string
  skills_required?: string
  is_active?: boolean
}

export interface Department {
  id: string
  department_code: string
  department_name: string
  short_name: string | null
  department_type: string | null
  parent_department: string | null
  head_designation: string | null
  head_name: string | null
  reports_to: string | null
  cost_center_code: string | null
  department_email: string | null
  department_phone: string | null
  working_hours_start: string | null
  working_hours_end: string | null
  established_date: string | null
  budget_fy: number | null
  location: string | null
  responsibilities: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface DepartmentCreate {
  department_code: string
  department_name: string
  short_name?: string
  department_type?: string
  parent_department?: string
  head_designation?: string
  head_name?: string
  reports_to?: string
  cost_center_code?: string
  department_email?: string
  department_phone?: string
  working_hours_start?: string
  working_hours_end?: string
  established_date?: string
  budget_fy?: number
  location?: string
  responsibilities?: string
  is_active?: boolean
}

// ---------------------------------------------------------------------------
// Designation APIs
// ---------------------------------------------------------------------------
export async function listDesignations(params?: {
  search?: string
  department?: string
  is_active?: boolean
  limit?: number
}): Promise<Designation[]> {
  const res = await api.get('/hr/designations', { params })
  return res.data
}

export async function createDesignation(body: DesignationCreate): Promise<Designation> {
  const res = await api.post('/hr/designations', body)
  return res.data
}

export async function getDesignation(id: string): Promise<Designation> {
  const res = await api.get(`/hr/designations/${id}`)
  return res.data
}

export async function updateDesignation(id: string, body: Partial<DesignationCreate>): Promise<Designation> {
  const res = await api.patch(`/hr/designations/${id}`, body)
  return res.data
}

export async function deleteDesignation(id: string): Promise<void> {
  await api.delete(`/hr/designations/${id}`)
}

// ---------------------------------------------------------------------------
// Department APIs
// ---------------------------------------------------------------------------
export async function listDepartments(params?: {
  search?: string
  department_type?: string
  is_active?: boolean
  limit?: number
}): Promise<Department[]> {
  const res = await api.get('/hr/departments', { params })
  return res.data
}

export async function createDepartment(body: DepartmentCreate): Promise<Department> {
  const res = await api.post('/hr/departments', body)
  return res.data
}

export async function getDepartment(id: string): Promise<Department> {
  const res = await api.get(`/hr/departments/${id}`)
  return res.data
}

export async function updateDepartment(id: string, body: Partial<DepartmentCreate>): Promise<Department> {
  const res = await api.patch(`/hr/departments/${id}`, body)
  return res.data
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/hr/departments/${id}`)
}

