import { apiClient } from './axiosClient'

export interface MaintenanceRecord {
  id: string
  machine_id: string | null
  maintenance_type: string  // Planned / Breakdown
  description: string | null
  fault_description: string | null
  scheduled_date: string | null
  completed_date: string | null
  next_due_date: string | null
  downtime_hours: number | null
  spare_parts_used: unknown[] | null
  root_cause: string | null
  repair_actions: string | null
  status: string
  performed_by: string | null
  created_at: string
}

export interface MaintenanceDashboard {
  pm_due_within_7_days: number
  machines_under_breakdown: number
  avg_availability_pct: number
  total_records: number
  recent_records: MaintenanceRecord[]
}

export const listMaintenanceRecords = (params?: Record<string, unknown>) =>
  apiClient.get<MaintenanceRecord[]>('/api/v1/maintenance/records', { params }).then(r => r.data)

export const createMaintenanceRecord = (data: Partial<MaintenanceRecord>) =>
  apiClient.post<MaintenanceRecord>('/api/v1/maintenance/records', data).then(r => r.data)

export const updateMaintenanceRecord = (id: string, data: Partial<MaintenanceRecord>) =>
  apiClient.patch<MaintenanceRecord>(`/api/v1/maintenance/records/${id}`, data).then(r => r.data)

export const getMachineMaintenance = (machineId: string) =>
  apiClient.get<{ availability_pct: number; records: MaintenanceRecord[] }>(
    `/api/v1/maintenance/availability/${machineId}`
  ).then(r => r.data)

export const getMaintenanceDashboard = () =>
  apiClient.get<MaintenanceDashboard>('/api/v1/maintenance/dashboard').then(r => r.data)
