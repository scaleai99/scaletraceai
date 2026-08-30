/**
 * HRPage - Module 26: Human Resources (tabbed)
 *
 * Tabs:
 * - Dashboard: stat cards + headcount by department
 * - Employees: searchable table, New Employee modal, inline detail panel
 *   (sub-tabs: Profile | Competencies | Training | Attendance)
 * - Training: flat list of training records across all employees
 */

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  RefreshCw,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  StateMachineBadge,
  Table,
} from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import type { Column } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_EMPLOYEES } from '../../lib/demoData'
import {
  addCompetency,
  addTraining,
  createEmployee,
  getHRDashboard,
  listAttendance,
  listCompetencies,
  listEmployees,
  listTraining,
  markAttendance,
  type AttendanceRecord,
  type Employee,
  type EmployeeCompetency,
  type HRDashboard,
  type TrainingRecord,
} from '../../api/hrApi'

type EmpRow = Employee & Record<string, unknown>

// ---------------------------------------------------------------------------
// Tab bar (top-level)
// ---------------------------------------------------------------------------
type TabKey = 'dashboard' | 'employees' | 'training'

function TabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'employees', label: 'Employees' },
    { key: 'training', label: 'Training' },
  ]
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors mr-1 ${
            active === t.key
              ? 'border-indigo-500 text-indigo-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  colour: string
  valueClass?: string
  sub?: string
}

function StatCard({ label, value, icon, colour, valueClass, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colour}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${valueClass ?? 'text-gray-900'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Employee Modal
// ---------------------------------------------------------------------------
interface NewEmployeeModalProps {
  open: boolean
  onClose: () => void
  onCreated: (emp: Employee) => void
}

function NewEmployeeModal({ open, onClose, onCreated }: NewEmployeeModalProps) {
  const [form, setForm] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    mobile: '',
    department: '',
    designation: '',
    date_of_joining: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        employee_code: '',
        full_name: '',
        email: '',
        mobile: '',
        department: '',
        designation: '',
        date_of_joining: new Date().toISOString().split('T')[0],
      })
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    if (!form.employee_code || !form.full_name) {
      setError('Employee Code and Full Name are required.')
      return
    }
    setSaving(true)
    setError(null)
    createEmployee({
      employee_code: form.employee_code,
      full_name: form.full_name,
      email: form.email || null,
      mobile: form.mobile || null,
      department: form.department || null,
      designation: form.designation || null,
      date_of_joining: form.date_of_joining || null,
    })
      .then((emp) => {
        onCreated(emp)
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to create employee')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Employee"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Add Employee
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Employee Code"
            value={form.employee_code}
            onChange={(e) => setForm((f) => ({ ...f, employee_code: e.target.value }))}
            placeholder="EMP-001"
            required
          />
          <Input
            label="Full Name"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="john@example.com"
          />
          <Input
            label="Mobile"
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
            placeholder="+91 99999 00000"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Department"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="e.g. Production"
          />
          <Input
            label="Designation"
            value={form.designation}
            onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
            placeholder="e.g. Operator"
          />
        </div>
        <Input
          label="Date of Joining"
          type="date"
          value={form.date_of_joining}
          onChange={(e) => setForm((f) => ({ ...f, date_of_joining: e.target.value }))}
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Add Competency Modal
// ---------------------------------------------------------------------------
interface AddCompetencyModalProps {
  open: boolean
  employeeId: string
  onClose: () => void
  onAdded: () => void
}

const SKILL_LEVEL_OPTIONS = [
  { label: 'Trainee', value: 'Trainee' },
  { label: 'Competent', value: 'Competent' },
  { label: 'Proficient', value: 'Proficient' },
  { label: 'Expert', value: 'Expert' },
]

function AddCompetencyModal({ open, employeeId, onClose, onAdded }: AddCompetencyModalProps) {
  const [form, setForm] = useState({
    process_operation: '',
    skill_level: 'Competent',
    certified_on: '',
    expiry_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({ process_operation: '', skill_level: 'Competent', certified_on: '', expiry_date: '' })
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    if (!form.process_operation) {
      setError('Process / Operation is required.')
      return
    }
    setSaving(true)
    setError(null)
    addCompetency(employeeId, {
      process_operation: form.process_operation,
      skill_level: form.skill_level || null,
      certified_on: form.certified_on || null,
      expiry_date: form.expiry_date || null,
    })
      .then(() => {
        onAdded()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to add competency')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Competency"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Add</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Process / Operation"
          value={form.process_operation}
          onChange={(e) => setForm((f) => ({ ...f, process_operation: e.target.value }))}
          placeholder="e.g. CNC Turning"
          required
        />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Skill Level</label>
          <Select
            options={SKILL_LEVEL_OPTIONS}
            value={form.skill_level}
            onChange={(e) => setForm((f) => ({ ...f, skill_level: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Certified On"
            type="date"
            value={form.certified_on}
            onChange={(e) => setForm((f) => ({ ...f, certified_on: e.target.value }))}
          />
          <Input
            label="Expiry Date"
            type="date"
            value={form.expiry_date}
            onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Add Training Modal
// ---------------------------------------------------------------------------
interface AddTrainingModalProps {
  open: boolean
  employeeId: string
  onClose: () => void
  onAdded: () => void
}

function AddTrainingModal({ open, employeeId, onClose, onAdded }: AddTrainingModalProps) {
  const [form, setForm] = useState({
    training_topic: '',
    training_date: '',
    trainer: '',
    result: '',
    next_due: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        training_topic: '',
        training_date: new Date().toISOString().split('T')[0],
        trainer: '',
        result: '',
        next_due: '',
      })
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    if (!form.training_topic) {
      setError('Training Topic is required.')
      return
    }
    setSaving(true)
    setError(null)
    addTraining(employeeId, {
      training_topic: form.training_topic,
      training_date: form.training_date || null,
      trainer: form.trainer || null,
      result: form.result || null,
      next_due: form.next_due || null,
    })
      .then(() => {
        onAdded()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to add training')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Training Record"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Add</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Training Topic"
          value={form.training_topic}
          onChange={(e) => setForm((f) => ({ ...f, training_topic: e.target.value }))}
          placeholder="e.g. ISO 9001 Awareness"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Training Date"
            type="date"
            value={form.training_date}
            onChange={(e) => setForm((f) => ({ ...f, training_date: e.target.value }))}
          />
          <Input
            label="Trainer"
            value={form.trainer}
            onChange={(e) => setForm((f) => ({ ...f, trainer: e.target.value }))}
            placeholder="Trainer name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Result"
            value={form.result}
            onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
            placeholder="Pass / Fail"
          />
          <Input
            label="Next Due"
            type="date"
            value={form.next_due}
            onChange={(e) => setForm((f) => ({ ...f, next_due: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Mark Attendance Modal
// ---------------------------------------------------------------------------
interface MarkAttendanceModalProps {
  open: boolean
  employeeId: string
  onClose: () => void
  onMarked: () => void
}

const ATTENDANCE_STATUS_OPTIONS = [
  { label: 'Present', value: 'Present' },
  { label: 'Absent', value: 'Absent' },
  { label: 'Half Day', value: 'Half Day' },
  { label: 'Leave', value: 'Leave' },
  { label: 'Holiday', value: 'Holiday' },
]

function MarkAttendanceModal({ open, employeeId, onClose, onMarked }: MarkAttendanceModalProps) {
  const [form, setForm] = useState({
    attendance_date: new Date().toISOString().split('T')[0],
    status: 'Present',
    check_in: '',
    check_out: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        attendance_date: new Date().toISOString().split('T')[0],
        status: 'Present',
        check_in: '',
        check_out: '',
      })
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    setSaving(true)
    setError(null)
    markAttendance(employeeId, {
      attendance_date: form.attendance_date,
      status: form.status,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
    })
      .then(() => {
        onMarked()
        onClose()
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to mark attendance')
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Attendance"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Mark</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Date"
          type="date"
          value={form.attendance_date}
          onChange={(e) => setForm((f) => ({ ...f, attendance_date: e.target.value }))}
          required
        />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <Select
            options={ATTENDANCE_STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Check In"
            type="time"
            value={form.check_in}
            onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))}
          />
          <Input
            label="Check Out"
            type="time"
            value={form.check_out}
            onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Employee Detail Panel
// ---------------------------------------------------------------------------
type DetailTab = 'profile' | 'competencies' | 'training' | 'attendance'

function DetailTabBar({ active, onChange }: { active: DetailTab; onChange: (t: DetailTab) => void }) {
  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'competencies', label: 'Competencies' },
    { key: 'training', label: 'Training' },
    { key: 'attendance', label: 'Attendance' },
  ]
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors mr-1 ${
            active === t.key
              ? 'border-indigo-400 text-indigo-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined | boolean }) {
  const display =
    value === null || value === undefined
      ? '-'
      : typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : String(value)
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium">{display}</span>
    </div>
  )
}

/** Returns colour class based on expiry relative to today */
function expiryColour(expiry: string | null): string {
  if (!expiry) return 'text-gray-600'
  const d = new Date(expiry)
  const now = new Date()
  if (d < now) return 'text-red-600 font-semibold'
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'text-amber-600 font-semibold'
  return 'text-gray-600'
}

interface EmployeeDetailPanelProps {
  employee: Employee
  onClose: () => void
}

function EmployeeDetailPanel({ employee, onClose }: EmployeeDetailPanelProps) {
  const [detailTab, setDetailTab] = useState<DetailTab>('profile')

  const [competencies, setCompetencies] = useState<EmployeeCompetency[]>([])
  const [loadingComp, setLoadingComp] = useState(false)
  const [showAddComp, setShowAddComp] = useState(false)

  const [trainingRecs, setTrainingRecs] = useState<TrainingRecord[]>([])
  const [loadingTrain, setLoadingTrain] = useState(false)
  const [showAddTrain, setShowAddTrain] = useState(false)

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loadingAtt, setLoadingAtt] = useState(false)
  const [showMarkAtt, setShowMarkAtt] = useState(false)

  const fetchCompetencies = () => {
    setLoadingComp(true)
    listCompetencies(employee.id)
      .then(setCompetencies)
      .catch(() => {/* silent */})
      .finally(() => setLoadingComp(false))
  }

  const fetchTraining = () => {
    setLoadingTrain(true)
    listTraining(employee.id)
      .then(setTrainingRecs)
      .catch(() => {/* silent */})
      .finally(() => setLoadingTrain(false))
  }

  const fetchAttendance = () => {
    setLoadingAtt(true)
    // last 30 days filter "" backend should support this, we just list all
    listAttendance(employee.id)
      .then((recs) => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        setAttendance(recs.filter((r) => new Date(r.attendance_date) >= cutoff))
      })
      .catch(() => {/* silent */})
      .finally(() => setLoadingAtt(false))
  }

  useEffect(() => {
    if (detailTab === 'competencies' && competencies.length === 0) fetchCompetencies()
    if (detailTab === 'training' && trainingRecs.length === 0) fetchTraining()
    if (detailTab === 'attendance' && attendance.length === 0) fetchAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailTab])

  return (
    <div className="bg-white rounded-xl border border-indigo-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{employee.full_name}</h3>
          <p className="text-xs text-gray-500 font-mono">
            {employee.employee_code}
            {employee.department ? ` · ${employee.department}` : ''}
            {employee.designation ? ` · ${employee.designation}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={employee.is_active ? 'success' : 'default'} size="sm">
            {employee.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <DetailTabBar active={detailTab} onChange={setDetailTab} />

      {/* Profile */}
      {detailTab === 'profile' && (
        <div className="space-y-2">
          <FieldRow label="Employee Code" value={employee.employee_code} />
          <FieldRow label="Full Name" value={employee.full_name} />
          <FieldRow label="Email" value={employee.email} />
          <FieldRow label="Mobile" value={employee.mobile} />
          <FieldRow label="Department" value={employee.department} />
          <FieldRow label="Designation" value={employee.designation} />
          <FieldRow label="Date of Joining" value={formatDate(employee.date_of_joining)} />
          <FieldRow label="Aadhaar (last 4)" value={employee.aadhaar_last4} />
          <FieldRow label="PAN" value={employee.pan_masked} />
          <FieldRow label="Active" value={employee.is_active} />
        </div>
      )}

      {/* Competencies */}
      {detailTab === 'competencies' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowAddComp(true)}>
              + Add Competency
            </Button>
          </div>
          {loadingComp ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
          ) : competencies.length === 0 ? (
            <p className="text-sm text-gray-400">No competencies recorded.</p>
          ) : (
            <div className="space-y-2">
              {competencies.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-sm flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-800">{c.process_operation}</p>
                    <p className="text-xs text-gray-500">
                      {c.skill_level ?? 'N/A'}
                      {c.certified_on ? ` · Certified: ${formatDate(c.certified_on)}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {c.expiry_date ? (
                      <p className={`text-xs ${expiryColour(c.expiry_date)}`}>
                        Expires: {formatDate(c.expiry_date)}
                      </p>
                    ) : null}
                    <Badge variant={c.is_qualified ? 'success' : 'warning'} size="sm">
                      {c.is_qualified ? 'Qualified' : 'Not Qualified'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <AddCompetencyModal
            open={showAddComp}
            employeeId={employee.id}
            onClose={() => setShowAddComp(false)}
            onAdded={() => {
              setShowAddComp(false)
              setCompetencies([])
              fetchCompetencies()
            }}
          />
        </div>
      )}

      {/* Training */}
      {detailTab === 'training' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowAddTrain(true)}>
              + Add Training
            </Button>
          </div>
          {loadingTrain ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
          ) : trainingRecs.length === 0 ? (
            <p className="text-sm text-gray-400">No training records.</p>
          ) : (
            <div className="space-y-2">
              {trainingRecs.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{t.training_topic}</p>
                    {t.result && (
                      <Badge
                        variant={
                          t.result.toLowerCase() === 'pass' ? 'success' : 'danger'
                        }
                        size="sm"
                      >
                        {t.result}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.training_date ? formatDate(t.training_date) : 'Date TBD'}
                    {t.trainer ? ` · Trainer: ${t.trainer}` : ''}
                    {t.next_due ? ` · Next: ${formatDate(t.next_due)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
          <AddTrainingModal
            open={showAddTrain}
            employeeId={employee.id}
            onClose={() => setShowAddTrain(false)}
            onAdded={() => {
              setShowAddTrain(false)
              setTrainingRecs([])
              fetchTraining()
            }}
          />
        </div>
      )}

      {/* Attendance */}
      {detailTab === 'attendance' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowMarkAtt(true)}>
              + Mark Attendance
            </Button>
          </div>
          {loadingAtt ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
          ) : attendance.length === 0 ? (
            <p className="text-sm text-gray-400">No attendance in the last 30 days.</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-800">{formatDate(a.attendance_date)}</p>
                    {(a.check_in || a.check_out) && (
                      <p className="text-xs text-gray-500">
                        {a.check_in ?? ''} "" {a.check_out ?? ''}
                      </p>
                    )}
                  </div>
                  <StateMachineBadge state={a.status} size="sm" />
                </div>
              ))}
            </div>
          )}
          <MarkAttendanceModal
            open={showMarkAtt}
            employeeId={employee.id}
            onClose={() => setShowMarkAtt(false)}
            onMarked={() => {
              setShowMarkAtt(false)
              setAttendance([])
              fetchAttendance()
            }}
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Employee table columns
// ---------------------------------------------------------------------------
function buildEmpColumns(): Column<EmpRow>[] {
  return [
    {
      key: 'employee_code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-indigo-700">
          {row.employee_code as string}
        </span>
      ),
    },
    {
      key: 'full_name',
      header: 'Name',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-900">{row.full_name as string}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <span className="text-sm text-gray-700">{(row.department as string) ?? '-'}</span>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (row) => (
        <span className="text-sm text-gray-700">{(row.designation as string) ?? '-'}</span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'default'} size="sm">
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Dashboard Tab
// ---------------------------------------------------------------------------
interface DashboardTabProps {
  dashboard: HRDashboard | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function DashboardTab({ dashboard, loading, error, onRefresh }: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">HR Overview</h2>
        <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading dashboard...
        </div>
      ) : dashboard ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Employees"
              value={dashboard.total_employees}
              icon={<Users size={16} className="text-indigo-600" />}
              colour="bg-indigo-50"
            />
            <StatCard
              label="Active"
              value={dashboard.active_employees}
              icon={<UserCheck size={16} className="text-green-600" />}
              colour="bg-green-50"
              valueClass="text-green-700"
            />
            <StatCard
              label="Expiring Qualifications"
              value={dashboard.expiring_qualifications}
              icon={<AlertTriangle size={16} className="text-amber-600" />}
              colour="bg-amber-50"
              valueClass={dashboard.expiring_qualifications > 0 ? 'text-amber-700' : 'text-gray-900'}
            />
            <StatCard
              label="Absent Today"
              value={dashboard.absent_today}
              icon={<UserMinus size={16} className="text-red-600" />}
              colour="bg-red-50"
              valueClass={dashboard.absent_today > 0 ? 'text-red-700' : 'text-gray-900'}
            />
          </div>

          {/* Headcount by department */}
          {Object.keys(dashboard.headcount_by_dept).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Headcount by Department</h3>
              <div className="space-y-3">
                {Object.entries(dashboard.headcount_by_dept)
                  .sort((a, b) => b[1] - a[1])
                  .map(([dept, count]) => {
                    const max = Math.max(...Object.values(dashboard.headcount_by_dept))
                    const pct = max > 0 ? Math.round((count / max) * 100) : 0
                    return (
                      <div key={dept} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-36 shrink-0 truncate">{dept}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-400 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-700 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          No HR data available.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Employees Tab
// ---------------------------------------------------------------------------
interface EmployeesTabProps {
  employees: EmpRow[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onEmployeeAdded: (emp: Employee) => void
}

function EmployeesTab({
  employees,
  loading,
  error,
  onRefresh,
  onEmployeeAdded,
}: EmployeesTabProps) {
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)

  const filtered = search
    ? employees.filter(
        (e) =>
          (e.full_name as string).toLowerCase().includes(search.toLowerCase()) ||
          (e.employee_code as string).toLowerCase().includes(search.toLowerCase()) ||
          ((e.department as string) ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : employees

  const columns = buildEmpColumns()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="w-72">
          <Input
            placeholder="Search by name, code, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            + New Employee
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {selectedEmp && (
        <EmployeeDetailPanel
          employee={selectedEmp}
          onClose={() => setSelectedEmp(null)}
        />
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading employees...
        </div>
      ) : (
        <Table<EmpRow>
          data={filtered}
          columns={columns}
          onRowClick={(row) => setSelectedEmp(row as unknown as Employee)}
          rowKey={(r) => r.id as string}
          exportable
          exportFilename="employees"
          emptyMessage="No employees found."
        />
      )}

      <NewEmployeeModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(emp) => {
          onEmployeeAdded(emp)
          setShowNew(false)
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Training Tab (flat list across all employees)
// ---------------------------------------------------------------------------
interface TrainingTabProps {
  allTraining: TrainingRecord[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function TrainingTab({ allTraining, loading, error, onRefresh }: TrainingTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Training Records</h2>
        <Button variant="secondary" size="sm" onClick={onRefresh} icon={<RefreshCw size={13} />} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading training records...
        </div>
      ) : allTraining.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="mx-auto w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
            <BookOpen size={20} className="text-indigo-400" />
          </div>
          <p className="text-sm text-gray-400">No training records found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allTraining.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{t.training_topic}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Employee: {t.employee_id}
                  {t.training_date ? ` · ${formatDate(t.training_date)}` : ''}
                  {t.trainer ? ` · Trainer: ${t.trainer}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {t.result && (
                  <Badge
                    variant={t.result.toLowerCase() === 'pass' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {t.result}
                  </Badge>
                )}
                {t.next_due && (
                  <span className="text-xs text-gray-500">
                    Next: {formatDate(t.next_due)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function HRPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  const [dashboard, setDashboard] = useState<HRDashboard | null>(null)
  const [loadingDash, setLoadingDash] = useState(false)
  const [errorDash, setErrorDash] = useState<string | null>(null)

  const {
    data: employees,
    isDemo: employeesIsDemo,
    loading: loadingEmps,
    error: errorEmps,
    refetch: fetchEmployees,
  } = useDemoFallback(() => listEmployees({ limit: 500 }), DEMO_EMPLOYEES, [])

  // Training tab uses per-employee listTraining; here we'd normally call a
  // dedicated flat endpoint. We re-use listEmployees + fetch training per emp.
  // For simplicity: load from a hypothetical all-training endpoint, or stub empty
  // until a proper endpoint exists.
  const [allTraining, setAllTraining] = useState<TrainingRecord[]>([])
  const [loadingTrain, setLoadingTrain] = useState(false)
  const [errorTrain, setErrorTrain] = useState<string | null>(null)

  const fetchDashboard = () => {
    setLoadingDash(true)
    setErrorDash(null)
    getHRDashboard()
      .then(setDashboard)
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setErrorDash(e?.response?.data?.detail ?? e?.message ?? 'Failed to load HR dashboard')
      })
      .finally(() => setLoadingDash(false))
  }

  const fetchAllTraining = () => {
    // Fetch training for first N employees and flatten "" graceful if empty
    setLoadingTrain(true)
    setErrorTrain(null)
    listEmployees({ limit: 100 })
      .then(async (emps) => {
        const results = await Promise.allSettled(
          emps.slice(0, 20).map((emp) => listTraining(emp.id))
        )
        const flat: TrainingRecord[] = []
        for (const r of results) {
          if (r.status === 'fulfilled') flat.push(...r.value)
        }
        flat.sort((a, b) => {
          const da = a.training_date ?? ''
          const db = b.training_date ?? ''
          return db.localeCompare(da)
        })
        setAllTraining(flat)
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string }
        setErrorTrain(e?.response?.data?.detail ?? e?.message ?? 'Failed to load training')
      })
      .finally(() => setLoadingTrain(false))
  }

  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboard) fetchDashboard()
    if (activeTab === 'training' && allTraining.length === 0) fetchAllTraining()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleEmployeeAdded = (_emp: Employee) => {
    fetchEmployees()
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Human Resources</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 26 "" Employees, Competencies, Training &amp; Attendance
        </p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'dashboard' && (
        <DashboardTab
          dashboard={dashboard}
          loading={loadingDash}
          error={errorDash}
          onRefresh={fetchDashboard}
        />
      )}
      {activeTab === 'employees' && (
        <>
          {employeesIsDemo && <DemoBanner />}
          <EmployeesTab
            employees={employees as EmpRow[]}
            loading={loadingEmps}
            error={errorEmps}
            onRefresh={fetchEmployees}
            onEmployeeAdded={handleEmployeeAdded}
          />
        </>
      )}
      {activeTab === 'training' && (
        <TrainingTab
          allTraining={allTraining}
          loading={loadingTrain}
          error={errorTrain}
          onRefresh={fetchAllTraining}
        />
      )}
    </div>
  )
}
