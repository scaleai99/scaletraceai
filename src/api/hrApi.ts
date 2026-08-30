import { apiClient } from './axiosClient'

export interface Employee {
  id: string
  employee_code: string
  full_name: string
  email: string | null
  mobile: string | null
  department: string | null
  designation: string | null
  date_of_joining: string | null
  aadhaar_last4: string | null
  pan_masked: string | null
  user_id: string | null
  is_active: boolean
  created_at: string
}

export interface EmployeeCompetency {
  id: string
  employee_id: string
  process_operation: string
  skill_level: string | null
  certified_on: string | null
  expiry_date: string | null
  is_qualified: boolean
  created_at: string
}

export interface TrainingRecord {
  id: string
  employee_id: string
  training_topic: string
  training_date: string | null
  trainer: string | null
  result: string | null
  next_due: string | null
  created_at: string
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  attendance_date: string
  status: string
  check_in: string | null
  check_out: string | null
  created_at: string
}

export interface HRDashboard {
  total_employees: number
  active_employees: number
  expiring_qualifications: number
  pending_training: number
  absent_today: number
  headcount_by_dept: Record<string, number>
}

export const listEmployees = (params?: Record<string, unknown>) =>
  apiClient.get<Employee[]>('/api/v1/hr/employees', { params }).then(r => Array.isArray(r.data) ? r.data : [])

export const getEmployee = (id: string) =>
  apiClient.get<Employee>(`/api/v1/hr/employees/${id}`).then(r => r.data)

export const createEmployee = (data: Partial<Employee>) =>
  apiClient.post<Employee>('/api/v1/hr/employees', data).then(r => r.data)

export const updateEmployee = (id: string, data: Partial<Employee>) =>
  apiClient.patch<Employee>(`/api/v1/hr/employees/${id}`, data).then(r => r.data)

export const listCompetencies = (employeeId: string) =>
  apiClient.get<EmployeeCompetency[]>(`/api/v1/hr/employees/${employeeId}/competencies`).then(r => Array.isArray(r.data) ? r.data : [])

export const addCompetency = (employeeId: string, data: Partial<EmployeeCompetency>) =>
  apiClient.post<EmployeeCompetency>(`/api/v1/hr/employees/${employeeId}/competencies`, data).then(r => r.data)

export const listTraining = (employeeId: string) =>
  apiClient.get<TrainingRecord[]>(`/api/v1/hr/employees/${employeeId}/training`).then(r => Array.isArray(r.data) ? r.data : [])

export const addTraining = (employeeId: string, data: Partial<TrainingRecord>) =>
  apiClient.post<TrainingRecord>(`/api/v1/hr/employees/${employeeId}/training`, data).then(r => r.data)

export const listAttendance = (employeeId: string) =>
  apiClient.get<AttendanceRecord[]>(`/api/v1/hr/employees/${employeeId}/attendance`).then(r => Array.isArray(r.data) ? r.data : [])

export const markAttendance = (employeeId: string, data: Partial<AttendanceRecord>) =>
  apiClient.post<AttendanceRecord>(`/api/v1/hr/employees/${employeeId}/attendance`, data).then(r => r.data)

export const getHRDashboard = () =>
  apiClient.get<HRDashboard>('/api/v1/hr/dashboard').then(r => r.data)
