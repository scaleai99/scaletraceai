/**
 * EmployeeMasterPage - Module 26: Employee Master (live, CRUD-enabled).
 * List: filters, count, CSV export, per-row delete, pagination.
 * Detail: header + tabs. New / Edit / Save / Discard / Delete.
 * Backed by /api/v1/hr/employees/*.
 */
import { useState, useEffect, useCallback, ReactNode } from 'react'
import { Plus, Trash2, Download, User, Search, GraduationCap, CalendarCheck, CreditCard, Heart, FileText, Briefcase, Award, Clock, Upload, ChevronDown, Check, ArrowLeft } from 'lucide-react'
import { apiClient } from '../../api/axiosClient'

interface Employee {
  id: string
  emp_code?: string
  employee_code?: string
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  full_name?: string | null
  fathers_name?: string | null
  mothers_name?: string | null
  date_of_birth?: string | null
  gender?: string | null
  marital_status?: string | null
  nationality?: string | null
  place_of_birth?: string | null
  blood_group?: string | null
  aadhar_no?: string | null
  pan_no?: string | null
  uan_no?: string | null
  pf_no?: string | null
  esi_no?: string | null
  mobile_no?: string | null
  personal_email?: string | null
  alternate_email?: string | null
  current_address?: string | null
  permanent_address?: string | null
  designation?: string | null
  department?: string | null
  reporting_to?: string | null
  employee_type?: string | null
  grade?: string | null
  location?: string | null
  date_of_joining?: string | null
  confirmation_date?: string | null
  probation_period?: string | null
  notice_period?: string | null
  work_shift?: string | null
  status?: string
  pf_applicable?: boolean
  esi_applicable?: boolean
  tax_regime?: string | null
  lwf_number?: string | null
  current_ctc?: number | null
  total_experience_months?: number | null
  bank_name?: string | null
  bank_branch?: string | null
  bank_account_no?: string | null
  bank_ifsc?: string | null
  account_type?: string | null
  pan_linked?: boolean
  emergency_contact_name?: string | null
  emergency_relationship?: string | null
  emergency_mobile?: string | null
  emergency_alternate?: string | null
  photo_url?: string | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
  modified_by?: string | null
}
interface Competency {
  id: string
  process_operation: string
  skill_level: string | null
  certified_on: string | null
  expiry_date: string | null
  is_qualified: boolean
  is_expired?: boolean
  expiring_soon?: boolean
}
interface Training {
  id: string
  training_topic: string
  training_date: string | null
  trainer: string | null
  result: string | null
  next_due: string | null
}
interface Attendance {
  id: string
  attendance_date: string | null
  status: string
  check_in: string | null
  check_out: string | null
}
interface Education { id: string; qualification: string; institution: string | null; year: number | null; percentage: string | null }
interface Experience { id: string; organization: string; designation: string | null; from_date: string | null; to_date: string | null; total_experience: string | null; reason_for_leaving: string | null; document_name: string | null }
interface DocumentRec { id: string; doc_name: string; doc_type: string | null; file_size_kb: number | null; file_path: string | null }

const BASE = '/api/v1/hr'
const listEmployeesApi = (params: Record<string, unknown>) =>
  apiClient.get<Employee[]>(`${BASE}/employees`, { params }).then(r => r.data)
const getEmployeeApi = (id: string) =>
  apiClient.get<Employee & { competencies: Competency[]; training: Training[]; attendance: Attendance[]; education: Education[]; experience: Experience[]; documents: DocumentRec[] }>(`${BASE}/employees/${id}`).then(r => r.data)
const createEmployeeApi = (body: Partial<Employee>) =>
  apiClient.post<Employee>(`${BASE}/employees`, body).then(r => r.data)
const updateEmployeeApi = (id: string, body: Partial<Employee>) =>
  apiClient.patch<Employee>(`${BASE}/employees/${id}`, body).then(r => r.data)
const deleteEmployeeApi = (id: string) =>
  apiClient.delete(`${BASE}/employees/${id}`).then(r => r.data)
const addCompetencyApi = (id: string, body: Partial<Competency>) =>
  apiClient.post<Competency>(`${BASE}/employees/${id}/competencies`, body).then(r => r.data)
const addTrainingApi = (id: string, body: Partial<Training>) =>
  apiClient.post<Training>(`${BASE}/employees/${id}/training`, body).then(r => r.data)
const markAttendanceApi = (id: string, body: Partial<Attendance>) =>
  apiClient.post<Attendance>(`${BASE}/employees/${id}/attendance`, body).then(r => r.data)
const addEducationApi = (id: string, body: Partial<Education>) =>
  apiClient.post<Education>(`${BASE}/employees/${id}/education`, body).then(r => r.data)
const deleteEducationApi = (id: string, rid: string) =>
  apiClient.delete(`${BASE}/employees/${id}/education/${rid}`).then(r => r.data)
const addExperienceApi = (id: string, body: Partial<Experience>) =>
  apiClient.post<Experience>(`${BASE}/employees/${id}/experience`, body).then(r => r.data)
const deleteExperienceApi = (id: string, rid: string) =>
  apiClient.delete(`${BASE}/employees/${id}/experience/${rid}`).then(r => r.data)
const deleteDocumentApi = (id: string, rid: string) =>
  apiClient.delete(`${BASE}/employees/${id}/documents/${rid}`).then(r => r.data)

type TabId = 'personal' | 'job' | 'compensation' | 'documents' | 'qualifications' | 'experience' | 'performance' | 'attendance' | 'leave' | 'assets' | 'bank' | 'emergency' | 'history'
const TABS: { id: TabId; label: string }[] = [
  { id: 'personal', label: 'Personal Information' },
  { id: 'job', label: 'Job & Organization' },
  { id: 'compensation', label: 'Compensation & Payroll' },
  { id: 'documents', label: 'Documents' },
  { id: 'qualifications', label: 'Qualifications & Training' },
  { id: 'experience', label: 'Experience' },
  { id: 'performance', label: 'Performance' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave' },
  { id: 'assets', label: 'Assets' },
  { id: 'bank', label: 'Bank Details' },
  { id: 'emergency', label: 'Emergency Contact' },
  { id: 'history', label: 'History' },
]
const DEPARTMENTS = ['Quality', 'Production', 'Engineering', 'Stores & Logistics', 'Human Resources', 'Finance', 'Purchase', 'Planning', 'Maintenance']
const STATUS_VALUES = ['Active', 'Inactive', 'On Leave', 'Resigned']
const GENDERS = ['Male', 'Female', 'Other']
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed']
const EMP_TYPES = ['Permanent', 'Contract', 'Trainee', 'Consultant', 'Apprentice']
const ACCOUNT_TYPES = ['Savings', 'Current']
const TAX_REGIMES = ['Old Regime', 'New Regime']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

type FieldType = 'text' | 'date' | 'number' | 'select' | 'textarea' | 'checkbox'
interface FieldDef { key: keyof Employee; label: string; type?: FieldType; options?: string[]; required?: boolean; full?: boolean }
interface Section { title: string; fields: FieldDef[] }

const SECTIONS: Record<string, Section[]> = {
  personal: [
    { title: 'Personal Information', fields: [
      { key: 'first_name', label: 'First Name', required: true },
      { key: 'middle_name', label: 'Middle Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'fathers_name', label: "Father's Name" },
      { key: 'mothers_name', label: "Mother's Name" },
      { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'select', options: GENDERS },
      { key: 'marital_status', label: 'Marital Status', type: 'select', options: MARITAL },
      { key: 'nationality', label: 'Nationality' },
      { key: 'place_of_birth', label: 'Place of Birth' },
      { key: 'blood_group', label: 'Blood Group', type: 'select', options: BLOOD_GROUPS },
    ]},
    { title: 'Statutory IDs', fields: [
      { key: 'aadhar_no', label: 'Aadhaar No.' },
      { key: 'pan_no', label: 'PAN No.' },
      { key: 'uan_no', label: 'UAN No.' },
      { key: 'pf_no', label: 'PF No.' },
      { key: 'esi_no', label: 'ESI No.' },
      { key: 'pan_linked', label: 'PAN-Aadhaar Linked', type: 'checkbox' },
    ]},
    { title: 'Contact Information', fields: [
      { key: 'mobile_no', label: 'Mobile No.' },
      { key: 'personal_email', label: 'Personal Email' },
      { key: 'alternate_email', label: 'Alternate Email' },
      { key: 'current_address', label: 'Current Address', type: 'textarea', full: true },
      { key: 'permanent_address', label: 'Permanent Address', type: 'textarea', full: true },
    ]},
  ],
  job: [
    { title: 'Job & Organization', fields: [
      { key: 'designation', label: 'Designation' },
      { key: 'department', label: 'Department', type: 'select', options: DEPARTMENTS },
      { key: 'reporting_to', label: 'Reporting To' },
      { key: 'employee_type', label: 'Employee Type', type: 'select', options: EMP_TYPES },
      { key: 'grade', label: 'Grade' },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_VALUES },
    ]},
    { title: 'Dates & Terms', fields: [
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date' },
      { key: 'confirmation_date', label: 'Confirmation Date', type: 'date' },
      { key: 'probation_period', label: 'Probation Period' },
      { key: 'notice_period', label: 'Notice Period' },
      { key: 'work_shift', label: 'Work Shift' },
    ]},
  ],
  compensation: [
    { title: 'Compensation & Payroll', fields: [
      { key: 'current_ctc', label: 'Current CTC (Rs/yr)', type: 'number' },
      { key: 'total_experience_months', label: 'Total Experience (months)', type: 'number' },
      { key: 'tax_regime', label: 'Tax Regime', type: 'select', options: TAX_REGIMES },
      { key: 'lwf_number', label: 'LWF Number' },
      { key: 'pf_applicable', label: 'PF Applicable', type: 'checkbox' },
      { key: 'esi_applicable', label: 'ESI Applicable', type: 'checkbox' },
    ]},
  ],
  bank: [
    { title: 'Bank Details', fields: [
      { key: 'bank_name', label: 'Bank Name' },
      { key: 'bank_branch', label: 'Branch' },
      { key: 'bank_account_no', label: 'Account No.' },
      { key: 'bank_ifsc', label: 'IFSC Code' },
      { key: 'account_type', label: 'Account Type', type: 'select', options: ACCOUNT_TYPES },
    ]},
  ],
  emergency: [
    { title: 'Emergency Contact', fields: [
      { key: 'emergency_contact_name', label: 'Contact Name' },
      { key: 'emergency_relationship', label: 'Relationship' },
      { key: 'emergency_mobile', label: 'Mobile' },
      { key: 'emergency_alternate', label: 'Alternate Mobile' },
    ]},
  ],
}

// Personal-overview columns (reference-image layout)
const OV_CONTACT: FieldDef[] = SECTIONS.personal[2].fields
const OV_JOB: FieldDef[] = [...SECTIONS.job[0].fields, ...SECTIONS.job[1].fields]

function fullName(e: Employee): string {
  const n = [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(' ')
  return n || e.full_name || e.emp_code || e.employee_code || '-'
}
function formatDate(d: string | null | undefined): string {
  if (!d) return '-'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatCurrency(a: number | null | undefined): string {
  if (a == null) return '-'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a)
}
function formatExperience(m: number | null | undefined): string {
  if (m == null) return '-'
  return `${Math.floor(m / 12)} Years ${m % 12} Months`
}
function displayValue(e: Employee, f: FieldDef): string {
  const v = e[f.key]
  if (v == null || v === '') return '-'
  if (f.type === 'checkbox') return v ? 'Yes' : 'No'
  if (f.type === 'date') return formatDate(v as string)
  if (f.key === 'current_ctc') return formatCurrency(v as number)
  if (f.key === 'total_experience_months') return formatExperience(v as number)
  return String(v)
}

function StatusBadge({ status }: { status?: string }) {
  const s = status || 'Active'
  const colors = s === 'Active' ? 'bg-green-100 text-green-700'
    : s === 'Inactive' || s === 'Resigned' ? 'bg-red-100 text-red-600'
    : 'bg-amber-100 text-amber-700'
  return <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors}`}>{s}</span>
}

function SCard({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 self-start">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        {icon}<h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="px-3 py-2 space-y-0.5">{children}</div>
    </div>
  )
}

function F({ field, emp, editing, onChange, compact }: {
  field: FieldDef; emp: Employee; editing: boolean; onChange: (k: keyof Employee, v: unknown) => void; compact?: boolean
}) {
  const raw = emp[field.key]
  const lw = compact ? 'w-[74px]' : 'w-[116px]' 
  if (!editing) {
    return (
      <div className="flex items-start min-h-[26px] py-0.5">
        <span className={`text-[11px] text-gray-500 ${lw} shrink-0 leading-tight`}>
          {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
        <span className="text-xs text-gray-800 flex-1 break-words">{displayValue(emp, field)}</span>
      </div>
    )
  }
  const cls = 'flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#204577] focus:border-[#204577]'
  return (
    <div className="flex items-start min-h-[28px] py-0.5">
      <label className={`text-[11px] text-gray-500 ${lw} shrink-0 leading-tight pt-1.5`}>
        {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {field.type === 'checkbox' ? (
        <input type="checkbox" checked={!!raw} onChange={(e) => onChange(field.key, e.target.checked)} className="mt-1.5 accent-[#204577]" />
      ) : field.type === 'select' ? (
        <select value={(raw as string) ?? ''} onChange={(e) => onChange(field.key, e.target.value)} className={cls}>
          <option value="">- Select -</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea value={(raw as string) ?? ''} onChange={(e) => onChange(field.key, e.target.value)} rows={2} className={cls} />
      ) : (
        <input
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={(raw as string | number) ?? ''}
          onChange={(e) => onChange(field.key, field.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
          className={cls}
        />
      )}
    </div>
  )
}

function SectionGrid({ sections, emp, editing, onChange }: {
  sections: Section[]; emp: Employee; editing: boolean; onChange: (k: keyof Employee, v: unknown) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 items-start">
      {sections.map((sec) => (
        <SCard key={sec.title} title={sec.title}>
          {sec.fields.map((f) => (
            <F key={String(f.key)} field={f} emp={emp} editing={editing} onChange={onChange} />
          ))}
        </SCard>
      ))}
    </div>
  )
}

const EMPTY_EMPLOYEE: Employee = { id: '', emp_code: '', status: '', nationality: 'Indian', pan_linked: false, pf_applicable: false, esi_applicable: false }

// Normalise any API error (incl. FastAPI validation detail arrays / {field,message,type}) into a string.
function errMsg(e: unknown, fallback: string): string {
  const detail = (e as { response?: { data?: { detail?: unknown; message?: unknown } } })?.response?.data?.detail
  const fmt = (d: unknown): string => {
    if (typeof d === 'string') return d
    if (d && typeof d === 'object') {
      const oo = d as Record<string, unknown>
      const msg = (oo.message ?? oo.msg) as string | undefined
      const field = oo.field as string | undefined
      if (msg) return field ? `${field}: ${msg}` : msg
      try { return JSON.stringify(d) } catch { return String(d) }
    }
    return String(d)
  }
  if (Array.isArray(detail)) return detail.map(fmt).join('; ')
  if (detail != null) return fmt(detail)
  const top = (e as { response?: { data?: { message?: unknown } }; message?: unknown })
  if (typeof top?.response?.data?.message === 'string') return top.response.data.message as string
  if (typeof top?.message === 'string') return top.message as string
  return fallback
}

export function EmployeeMasterPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [mode, setMode] = useState<'list' | 'view' | 'edit' | 'new'>('list')
  const [draft, setDraft] = useState<Employee>(EMPTY_EMPLOYEE)
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [training, setTraining] = useState<Training[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [newComp, setNewComp] = useState({ process_operation: '', skill_level: 'Competent' })
  const [newTrain, setNewTrain] = useState({ training_topic: '', trainer: '', result: 'Attended' })
  const [newAtt, setNewAtt] = useState({ attendance_date: '', status: 'Present' })
  const [education, setEducation] = useState<Education[]>([])
  const [experience, setExperience] = useState<Experience[]>([])
  const [documents, setDocuments] = useState<DocumentRec[]>([])
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null)
  const [pendingDocs, setPendingDocs] = useState<{ file: File; docType?: string }[]>([])
  const [newEdu, setNewEdu] = useState({ qualification: '', institution: '', year: '', percentage: '' })
  const [newExp, setNewExp] = useState({ organization: '', designation: '', from_date: '', to_date: '', reason_for_leaving: '' })

  const loadList = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params: Record<string, unknown> = { limit: 200 }
      if (search) params.search = search
      if (deptFilter) params.department = deptFilter
      if (statusFilter) params.status = statusFilter
      const data = await listEmployeesApi(params)
      setEmployees(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(errMsg(e, 'Failed to load employees. Is the backend running?'))
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [search, deptFilter, statusFilter])

  useEffect(() => { loadList() }, [loadList])

  const loadDetail = async (id: string) => {
    try {
      const data = await getEmployeeApi(id)
      setCompetencies(data.competencies || [])
      setTraining(data.training || [])
      setAttendance(data.attendance || [])
      setEducation(data.education || [])
      setExperience(data.experience || [])
      setDocuments(data.documents || [])
      setDraft(data)
    } catch {
      setCompetencies([]); setTraining([]); setAttendance([]); setEducation([]); setExperience([]); setDocuments([])
    }
  }

  const openEmployee = async (e: Employee) => {
    setDraft(e); setMode('view'); setActiveTab('personal'); setSaveError(null)
    await loadDetail(e.id)
  }
  const openNew = () => {
    setDraft({ ...EMPTY_EMPLOYEE }); setCompetencies([]); setTraining([]); setAttendance([]); setEducation([]); setExperience([]); setDocuments([])
    setPendingPhoto(null); setPendingPhotoUrl(null); setPendingDocs([])
    setMode('new'); setActiveTab('personal'); setSaveError(null)
  }
  const backToList = () => { setMode('list'); setSaveError(null) }

  const setField = (k: keyof Employee, v: unknown) => setDraft((prev) => ({ ...prev, [k]: v }))

  const buildPayload = (): Partial<Employee> => {
    const p: Partial<Employee> = {}
    const keys: (keyof Employee)[] = [
      'first_name', 'middle_name', 'last_name', 'fathers_name', 'mothers_name', 'date_of_birth', 'gender',
      'marital_status', 'nationality', 'place_of_birth', 'blood_group', 'aadhar_no', 'pan_no', 'pan_linked',
      'uan_no', 'pf_no', 'esi_no', 'mobile_no', 'personal_email', 'alternate_email', 'current_address',
      'permanent_address', 'designation', 'department', 'reporting_to', 'employee_type', 'grade', 'location',
      'date_of_joining', 'confirmation_date', 'probation_period', 'notice_period', 'work_shift', 'status',
      'pf_applicable', 'esi_applicable', 'tax_regime', 'lwf_number', 'current_ctc', 'total_experience_months',
      'bank_name', 'bank_branch', 'bank_account_no', 'bank_ifsc', 'account_type',
      'emergency_contact_name', 'emergency_relationship', 'emergency_mobile', 'emergency_alternate', 'photo_url',
    ]
    for (const k of keys) {
      const v = draft[k]
      if (v !== undefined && v !== '') (p as Record<string, unknown>)[k] = v
    }
    return p
  }

  const handleSave = async () => {
    if (mode === 'new' && !(draft.emp_code || draft.employee_code || '').trim()) {
      setSaveError('Employee Code is required'); return
    }
    if (!(draft.first_name || '').trim() && !(draft.full_name || '').trim()) {
      setSaveError('First Name is required'); return
    }
    setSaving(true); setSaveError(null); setSaveSuccess(false)
    try {
      if (mode === 'new') {
        const _nm = [draft.first_name, draft.middle_name, draft.last_name].filter(Boolean).join(' ').trim()
        const created = await createEmployeeApi({
          employee_code: (draft.emp_code || draft.employee_code || '').trim(),
          full_name: _nm || (draft.emp_code || draft.employee_code || '').trim(),
          ...buildPayload(),
        })
        if (pendingPhoto) { try { await uploadPhotoTo(created.id, pendingPhoto) } catch { /* ignore */ } }
        for (const pd of pendingDocs) { try { await uploadDocTo(created.id, pd.file, pd.docType) } catch { /* ignore */ } }
        setPendingPhoto(null); setPendingPhotoUrl(null); setPendingDocs([])
        await loadList()
        await openEmployee(created)
      } else {
        const updated = await updateEmployeeApi(draft.id, buildPayload())
        await loadList()
        setDraft(updated)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (e) {
      setSaveError(errMsg(e, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e: Employee) => {
    if (!window.confirm(`Delete employee "${fullName(e)}" (${e.emp_code || e.employee_code})?\n\nThis deactivates the record and removes it from the active list.`)) return
    try {
      await deleteEmployeeApi(e.id)
      await loadList()
      if (mode !== 'list') backToList()
    } catch {
      alert('Failed to delete employee. Only Administrator / HR can delete.')
    }
  }

  const handleDiscard = () => {
    setSaveError(null)
    if (mode === 'new') { backToList() }
    else if (draft.id) { loadDetail(draft.id); setMode('view') }
  }

  const addCompetency = async () => {
    if (!newComp.process_operation.trim() || !draft.id) return
    try {
      const c = await addCompetencyApi(draft.id, newComp)
      setCompetencies((p) => [...p, c]); setNewComp({ process_operation: '', skill_level: 'Competent' })
    } catch { /* ignore */ }
  }
  const addTraining = async () => {
    if (!newTrain.training_topic.trim() || !draft.id) return
    try {
      const t = await addTrainingApi(draft.id, newTrain)
      setTraining((p) => [t, ...p]); setNewTrain({ training_topic: '', trainer: '', result: 'Attended' })
    } catch { /* ignore */ }
  }
  const markAttendance = async () => {
    if (!newAtt.attendance_date || !draft.id) return
    try {
      const a = await markAttendanceApi(draft.id, newAtt)
      setAttendance((p) => [a, ...p]); setNewAtt({ attendance_date: '', status: 'Present' })
    } catch { /* ignore */ }
  }

  const addEducation = async () => {
    if (!newEdu.qualification.trim() || !draft.id) return
    try {
      const x = await addEducationApi(draft.id, { qualification: newEdu.qualification.trim(), institution: newEdu.institution.trim() || undefined, year: newEdu.year ? Number(newEdu.year) : undefined, percentage: newEdu.percentage.trim() || undefined })
      setEducation((p) => [x, ...p]); setNewEdu({ qualification: '', institution: '', year: '', percentage: '' })
    } catch { /* ignore */ }
  }
  const deleteEducation = async (id: string) => {
    if (!draft.id) return
    try { await deleteEducationApi(draft.id, id); setEducation((p) => p.filter((r) => r.id !== id)) } catch { /* ignore */ }
  }
  const addExperience = async () => {
    if (!newExp.organization.trim() || !draft.id) return
    try {
      const x = await addExperienceApi(draft.id, { organization: newExp.organization.trim(), designation: newExp.designation.trim() || undefined, from_date: newExp.from_date || undefined, to_date: newExp.to_date || undefined, reason_for_leaving: newExp.reason_for_leaving.trim() || undefined })
      setExperience((p) => [x, ...p]); setNewExp({ organization: '', designation: '', from_date: '', to_date: '', reason_for_leaving: '' })
    } catch { /* ignore */ }
  }
  const deleteExperience = async (id: string) => {
    if (!draft.id) return
    try { await deleteExperienceApi(draft.id, id); setExperience((p) => p.filter((r) => r.id !== id)) } catch { /* ignore */ }
  }
  const deleteDocument = async (id: string) => {
    if (!draft.id) return
    try { await deleteDocumentApi(draft.id, id); setDocuments((p) => p.filter((r) => r.id !== id)) } catch { /* ignore */ }
  }

  const uploadPhotoTo = async (id: string, file: File): Promise<string> => {
    const fd = new FormData(); fd.append('file', file)
    const { data } = await apiClient.post<{ photo_url: string }>(`${BASE}/employees/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data.photo_url
  }
  const uploadDocTo = async (id: string, file: File, docType?: string): Promise<DocumentRec> => {
    const fd = new FormData(); fd.append('file', file)
    const { data } = await apiClient.post<DocumentRec>(`${BASE}/employees/${id}/documents/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, params: docType ? { doc_type: docType } : {} })
    return data
  }
  // For an existing employee: upload immediately. For a NEW (unsaved) employee: hold until Save.
  const onPickPhoto = (file: File) => {
    if (draft.id) {
      uploadPhotoTo(draft.id, file).then((url) => { setDraft((p) => ({ ...p, photo_url: url })); loadList() })
        .catch(() => alert('Photo upload failed. Use PNG/JPG/WebP up to 5MB.'))
    } else {
      setPendingPhoto(file); setPendingPhotoUrl(URL.createObjectURL(file))
    }
  }
  const onPickDoc = (file: File, docType?: string) => {
    if (draft.id) {
      uploadDocTo(draft.id, file, docType).then((d) => setDocuments((p) => [...p, d]))
        .catch(() => alert('Upload failed. Use PDF/PNG/JPG up to 10MB.'))
    } else {
      setPendingDocs((p) => [...p, { file, docType }])
    }
  }

  const exportCsv = () => {
    const header = ['Emp Code', 'Name', 'Designation', 'Department', 'Location', 'Status']
    const rows = employees.map((e) => [e.emp_code || e.employee_code, fullName(e), e.designation, e.department, e.location, e.status])
    const csv = [header, ...rows].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const filtered = employees.filter((e) => {
    const mDept = !deptFilter || e.department === deptFilter
    const mStatus = !statusFilter || (e.status || 'Active') === statusFilter
    const q = search.trim().toLowerCase()
    const mSearch = !q || [e.emp_code, e.employee_code, fullName(e), e.designation].some((v) => (v ?? '').toString().toLowerCase().includes(q))
    return mDept && mStatus && mSearch
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const clampedPage = Math.min(page, totalPages)
  const paginated = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize)
  const editing = mode !== 'list'  // detail + new are always editable (matches other masters)

  if (mode === 'list') {
    return (
      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Master</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Module 26 - People, competencies, training, attendance
              <span className="text-gray-400"> &middot; {employees.length} employee{employees.length === 1 ? '' : 's'}</span>
            </p>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#204577] text-white hover:bg-[#1a3860]">
            <Plus size={16} /> New Employee
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 max-w-sm relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search" placeholder="Search by code, name or designation..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#204577] focus:border-[#204577] placeholder:text-gray-400"
            />
          </div>
          <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }} className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#204577]">
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#204577]">
            <option value="">All statuses</option>
            {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <span className="text-xs text-gray-500 ml-auto">{filtered.length} records</span>
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={13} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Emp Code', 'Name', 'Designation', 'Department', 'Location', 'Status', 'Actions'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400 animate-pulse">Loading employees...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No employees found - click 'New Employee' to add one.</td></tr>
                ) : paginated.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEmployee(e)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#204577]">{e.emp_code || e.employee_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fullName(e)}</td>
                    <td className="px-4 py-3 text-gray-600">{e.designation || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.department || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.location || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" title="Delete employee" onClick={(ev) => { ev.stopPropagation(); handleDelete(e) }} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 text-xs text-gray-600">
              <span>{((clampedPage - 1) * pageSize) + 1}-{Math.min(clampedPage * pageSize, filtered.length)} of {filtered.length}</span>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={clampedPage === 1} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-2 py-1 font-medium">{clampedPage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={clampedPage === totalPages} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const emp = draft
  const confirmed = !!emp.confirmation_date && new Date(emp.confirmation_date) <= new Date()
  const hasCert = (t: string) => documents.some((d) => (d.doc_type || '').includes(t)) || pendingDocs.some((d) => (d.docType || '').includes(t))

  const eduCard = (
    <SCard title="Qualifications" icon={<GraduationCap size={12} className="text-[#204577]" />}>
      <table className="w-full text-[11px]">
        <thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-1">Qualification</th><th className="py-1">Institution</th><th className="py-1">Year</th><th className="py-1">%/CGPA</th><th></th></tr></thead>
        <tbody>
          {education.length === 0 ? (
            <tr><td colSpan={5} className="py-2 text-center text-gray-400">No records.</td></tr>
          ) : education.map((x) => (
            <tr key={x.id} className="border-b border-gray-50">
              <td className="py-1">{x.qualification}</td>
              <td className="py-1 text-gray-500">{x.institution || '-'}</td>
              <td className="py-1 text-gray-500">{x.year ?? '-'}</td>
              <td className="py-1 text-gray-500">{x.percentage || '-'}</td>
              <td className="py-1 text-right">{mode !== 'new' && <button onClick={() => deleteEducation(x.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={11} /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {mode !== 'new' && (
        <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-gray-100">
          <input value={newEdu.qualification} onChange={(e) => setNewEdu({ ...newEdu, qualification: e.target.value })} placeholder="Qualification" className="text-[11px] border border-gray-200 rounded px-2 py-1" />
          <input value={newEdu.institution} onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })} placeholder="Institution" className="text-[11px] border border-gray-200 rounded px-2 py-1" />
          <input value={newEdu.year} onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })} placeholder="Year" className="text-[11px] border border-gray-200 rounded px-2 py-1" />
          <div className="flex gap-1">
            <input value={newEdu.percentage} onChange={(e) => setNewEdu({ ...newEdu, percentage: e.target.value })} placeholder="%/CGPA" className="flex-1 text-[11px] border border-gray-200 rounded px-2 py-1" />
            <button onClick={addEducation} className="px-2 py-1 text-[11px] rounded bg-[#204577] text-white">Add</button>
          </div>
        </div>
      )}
    </SCard>
  )

  const trainCard = (
    <SCard title="Training Summary" icon={<Award size={12} className="text-[#204577]" />}>
      <table className="w-full text-[11px]">
        <thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-1">Training</th><th className="py-1">Date</th><th className="py-1">Next Due</th><th className="py-1">Result</th><th></th></tr></thead>
        <tbody>
          {training.length === 0 ? (
            <tr><td colSpan={5} className="py-2 text-center text-gray-400">No records.</td></tr>
          ) : training.map((t) => (
            <tr key={t.id} className="border-b border-gray-50"><td className="py-1">{t.training_topic}</td><td className="py-1 text-gray-500">{formatDate(t.training_date)}</td><td className="py-1 text-gray-500">{formatDate(t.next_due)}</td><td className="py-1 text-gray-500">{t.result || '-'}</td><td></td></tr>
          ))}
        </tbody>
      </table>
      {mode !== 'new' && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
          <input value={newTrain.training_topic} onChange={(e) => setNewTrain({ ...newTrain, training_topic: e.target.value })} placeholder="Training topic" className="flex-1 text-[11px] border border-gray-200 rounded px-2 py-1" />
          <input value={newTrain.trainer} onChange={(e) => setNewTrain({ ...newTrain, trainer: e.target.value })} placeholder="Provider" className="w-24 text-[11px] border border-gray-200 rounded px-2 py-1" />
          <button onClick={addTraining} className="px-2 py-1 text-[11px] rounded bg-[#204577] text-white">Add</button>
        </div>
      )}
    </SCard>
  )

  const attachCard = (
    <SCard title="Attachments" icon={<FileText size={12} className="text-[#204577]" />}>
      <label className="inline-flex items-center gap-1 text-[11px] text-[#204577] hover:underline cursor-pointer mb-1" title="Upload a certificate / document (PDF, PNG, JPG)">
        <Upload size={12} /> Upload Document
        <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) onPickDoc(fl); e.target.value = '' }} />
      </label>
      <table className="w-full text-[11px]">
        <thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-1">Document</th><th className="py-1">Type</th><th className="py-1">Size</th><th></th></tr></thead>
        <tbody>
          {documents.length === 0 && pendingDocs.length === 0 ? (
            <tr><td colSpan={4} className="py-2 text-center text-gray-400">No attachments.</td></tr>
          ) : (<>
            {documents.map((x) => (
              <tr key={x.id} className="border-b border-gray-50">
                <td className="py-1 text-blue-600">{x.file_path ? <a href={x.file_path} target="_blank" rel="noreferrer" className="hover:underline">{x.doc_name}</a> : x.doc_name}</td>
                <td className="py-1 text-gray-500">{x.doc_type || '-'}</td>
                <td className="py-1 text-gray-500">{x.file_size_kb ? `${x.file_size_kb} KB` : '-'}</td>
                <td className="py-1 text-right"><button onClick={() => deleteDocument(x.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={11} /></button></td>
              </tr>
            ))}
            {pendingDocs.map((pd, i) => (
              <tr key={`p${i}`} className="border-b border-gray-50">
                <td className="py-1 text-gray-700">{pd.file.name}</td>
                <td className="py-1 text-amber-600">{pd.docType ? `${pd.docType} · pending` : 'pending'}</td>
                <td className="py-1 text-gray-500">{Math.max(1, Math.round(pd.file.size / 1024))} KB</td>
                <td className="py-1 text-right"><button onClick={() => setPendingDocs((p) => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={11} /></button></td>
              </tr>
            ))}
          </>)}
        </tbody>
      </table>
    </SCard>
  )

  const expCard = (
    <SCard title="Employment History" icon={<Briefcase size={12} className="text-[#204577]" />}>
      <table className="w-full text-[11px]">
        <thead><tr className="text-left text-gray-500 border-b border-gray-100"><th className="py-1">Organization</th><th className="py-1">Designation</th><th className="py-1">From</th><th className="py-1">To</th><th className="py-1">Reason</th><th></th></tr></thead>
        <tbody>
          {experience.length === 0 ? (
            <tr><td colSpan={6} className="py-2 text-center text-gray-400">No employment history.</td></tr>
          ) : experience.map((x) => (
            <tr key={x.id} className="border-b border-gray-50">
              <td className="py-1">{x.organization}</td>
              <td className="py-1 text-gray-500">{x.designation || '-'}</td>
              <td className="py-1 text-gray-500">{formatDate(x.from_date)}</td>
              <td className="py-1 text-gray-500">{x.to_date ? formatDate(x.to_date) : 'Present'}</td>
              <td className="py-1 text-gray-500">{x.reason_for_leaving || '-'}</td>
              <td className="py-1 text-right">{mode !== 'new' && <button onClick={() => deleteExperience(x.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={11} /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {mode !== 'new' && (
        <div className="grid grid-cols-6 gap-1 mt-2 pt-2 border-t border-gray-100">
          <input value={newExp.organization} onChange={(e) => setNewExp({ ...newExp, organization: e.target.value })} placeholder="Organization" className="text-[11px] border border-gray-200 rounded px-2 py-1" />
          <input value={newExp.designation} onChange={(e) => setNewExp({ ...newExp, designation: e.target.value })} placeholder="Designation" className="text-[11px] border border-gray-200 rounded px-2 py-1" />
          <input type="date" value={newExp.from_date} onChange={(e) => setNewExp({ ...newExp, from_date: e.target.value })} className="text-[11px] border border-gray-200 rounded px-1 py-1" />
          <input type="date" value={newExp.to_date} onChange={(e) => setNewExp({ ...newExp, to_date: e.target.value })} className="text-[11px] border border-gray-200 rounded px-1 py-1" />
          <input value={newExp.reason_for_leaving} onChange={(e) => setNewExp({ ...newExp, reason_for_leaving: e.target.value })} placeholder="Reason" className="text-[11px] border border-gray-200 rounded px-2 py-1" />
          <button onClick={addExperience} className="px-2 py-1 text-[11px] rounded bg-[#204577] text-white">Add</button>
        </div>
      )}
    </SCard>
  )

  return (
    <div className="w-full flex flex-col gap-0">
      <div className="bg-white border border-gray-200 rounded-t-xl px-4 py-3">
        <button onClick={backToList} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#204577] mb-2">
          <ArrowLeft size={13} /> Back to Employees
        </button>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
          <button onClick={backToList} className="hover:text-[#204577]">Master Data</button>
          <ChevronDown size={11} className="-rotate-90" />
          <button onClick={backToList} className="hover:text-[#204577]">Employee Master</button>
          <ChevronDown size={11} className="-rotate-90" />
          <span className="text-[#204577] font-medium">{mode === 'new' ? 'New' : mode === 'edit' ? 'Edit' : 'View'}</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 shrink-0 group">
            {emp.photo_url ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" /> : pendingPhotoUrl ? <img src={pendingPhotoUrl} alt="" className="w-full h-full object-cover" /> : <User size={30} className="text-gray-400" />}
            <label className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" title="Upload photo">
              <Upload size={13} className="text-white" />
              <span className="text-white text-[8px] font-medium">Photo</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) onPickPhoto(fl); e.target.value = '' }} />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">{mode === 'new' ? 'New Employee' : fullName(emp)}</h1>
              {mode === 'new' ? <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Draft</span> : (emp.status ? <StatusBadge status={emp.status} /> : null)}
            </div>
            <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-1 flex-wrap">
              <span>EMP Code : <span className="text-[#204577] font-semibold">{emp.emp_code || emp.employee_code || '-'}</span></span>
              <span className="text-gray-300">|</span>
              <span>DOJ : <span className="text-[#204577] font-semibold">{formatDate(emp.date_of_joining)}</span></span>
              {confirmed ? (<><span className="text-gray-300">|</span><span className="text-emerald-600 font-medium">Confirmed</span></>) : null}
            </div>
            <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5 flex-wrap">
              <span>Designation : <span className="text-gray-700 font-medium">{emp.designation || '-'}</span></span>
              <span className="text-gray-300">|</span>
              <span>Department : <span className="text-gray-700 font-medium">{emp.department || '-'}</span></span>
            </div>
            <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5 flex-wrap">
              <span>Location : <span className="text-gray-700 font-medium">{emp.location || '-'}</span></span>
              <span className="text-gray-300">|</span>
              <span>Employee Type : <span className="text-gray-700 font-medium">{emp.employee_type || '-'}</span></span>
            </div>
          </div>
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <label className={`relative flex flex-col items-center justify-center rounded px-3 py-2 cursor-pointer transition-colors border ${hasCert('Certificate 1') ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-gray-300 hover:border-[#204577] hover:bg-gray-50'}`} title="Upload Certificate 1 (PDF or image)">
              <div className="flex items-center gap-1 text-gray-700"><Upload size={11} /><span className="text-[10px] font-semibold">Certificate 1</span></div>
              <span className={`text-[8px] mt-0.5 ${hasCert('Certificate 1') ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{hasCert('Certificate 1') ? 'Certificate uploaded' : 'Upload certificate'}</span>
              {hasCert('Certificate 1') ? <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={9} className="text-white" /></span> : null}
              <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) onPickDoc(fl, 'Certificate 1'); e.target.value = '' }} />
            </label>
            <label className={`relative flex flex-col items-center justify-center rounded px-3 py-2 cursor-pointer transition-colors border ${hasCert('Certificate 2') ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-gray-300 hover:border-[#204577] hover:bg-gray-50'}`} title="Upload Certificate 2 (PDF or image)">
              <div className="flex items-center gap-1 text-gray-700"><Upload size={11} /><span className="text-[10px] font-semibold">Certificate 2</span></div>
              <span className={`text-[8px] mt-0.5 ${hasCert('Certificate 2') ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{hasCert('Certificate 2') ? 'Certificate uploaded' : 'Upload certificate'}</span>
              {hasCert('Certificate 2') ? <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={9} className="text-white" /></span> : null}
              <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) onPickDoc(fl, 'Certificate 2'); e.target.value = '' }} />
            </label>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="relative">
              <button onClick={() => setShowActions((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
                Actions <ChevronDown size={12} />
              </button>
              {showActions ? (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-30 py-1">
                  <button onClick={() => { openNew(); setShowActions(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">New Employee</button>
                  <button onClick={() => { setShowActions(false); window.print() }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">Print</button>
                  {mode === 'view' && draft.id ? <button onClick={() => { setShowActions(false); handleDelete(emp) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Delete</button> : null}
                </div>
              ) : null}
            </div>
            <div className="text-[10px] text-gray-400 text-right leading-relaxed">
              <div>Created On : <span className="text-gray-600">{formatDate(emp.created_at)}</span></div>
              <div>Created By : <span className="text-gray-600">{emp.created_by || 'Admin User'}</span></div>
              <div>Last Modified On : <span className="text-gray-600">{formatDate(emp.updated_at)}</span></div>
              <div>Last Modified By : <span className="text-gray-600">{emp.modified_by || 'Admin User'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-x border-gray-200 px-1 flex flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-2 py-1.5 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-[#204577] text-[#204577]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 border-x border-gray-200 p-3 min-h-[300px]">
        {activeTab === 'personal' && (
          <div>
            {mode === 'new' && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 flex items-center gap-3">
                <label className="text-[11px] text-gray-500 w-[140px] shrink-0">Employee Code<span className="text-red-400 ml-0.5">*</span></label>
                <input value={emp.emp_code || ''} onChange={(e) => setField('emp_code', e.target.value)} placeholder="EMP-10050"
                  className="flex-1 max-w-xs text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#204577]" />
              </div>
            )}
            <div className="columns-1 md:columns-2 xl:columns-4 gap-3">
              <div className="break-inside-avoid mb-3">
                <SCard title="Personal Information" icon={<User size={12} className="text-[#204577]" />}>
                  {SECTIONS.personal[0].fields.map((fd) => <F key={String(fd.key)} field={fd} emp={emp} editing={editing} onChange={setField} />)}
                </SCard>
              </div>
              <div className="break-inside-avoid mb-3">
                <SCard title="Statutory IDs" icon={<FileText size={12} className="text-[#204577]" />}>
                  {SECTIONS.personal[1].fields.map((fd) => <F key={String(fd.key)} field={fd} emp={emp} editing={editing} onChange={setField} />)}
                </SCard>
              </div>
              <div className="break-inside-avoid mb-3">
                <SCard title="Contact Information" icon={<Search size={12} className="text-[#204577]" />}>
                  {OV_CONTACT.map((fd) => <F key={String(fd.key)} field={fd} emp={emp} editing={editing} onChange={setField} />)}
                </SCard>
              </div>
              <div className="break-inside-avoid mb-3">
                <SCard title="Job Information" icon={<Briefcase size={12} className="text-[#204577]" />}>
                  {OV_JOB.map((fd) => <F key={String(fd.key)} field={fd} emp={emp} editing={editing} onChange={setField} />)}
                </SCard>
              </div>
              <div className="break-inside-avoid mb-3">
                <SCard title="Quick Summary" icon={<Clock size={12} className="text-[#204577]" />}>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">EMP Code</span><span className="text-gray-800 font-mono">{emp.emp_code || emp.employee_code || '-'}</span></div>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">DOJ</span><span className="text-gray-800">{formatDate(emp.date_of_joining)}</span></div>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">Total Experience</span><span className="text-gray-800">{formatExperience(emp.total_experience_months)}</span></div>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">Current CTC</span><span className="text-gray-800">{formatCurrency(emp.current_ctc)}</span></div>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">PF Applicable</span><span className="text-gray-800">{emp.pf_applicable ? 'Yes' : 'No'}</span></div>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">ESI Applicable</span><span className="text-gray-800">{emp.esi_applicable ? 'Yes' : 'No'}</span></div>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">Tax Regime</span><span className="text-gray-800">{emp.tax_regime || '-'}</span></div>
                  <div className="flex justify-between text-[11px] py-0.5"><span className="text-gray-500">LWF Number</span><span className="text-gray-800">{emp.lwf_number || '-'}</span></div>
                  <div className="flex justify-between items-center text-[11px] py-0.5"><span className="text-gray-500">Employee Status</span>{emp.status ? <StatusBadge status={emp.status} /> : <span className="text-gray-400">-</span>}</div>
                </SCard>
              </div>
              <div className="break-inside-avoid mb-3">
                <SCard title="Bank Details" icon={<CreditCard size={12} className="text-[#204577]" />}>
                  {SECTIONS.bank[0].fields.map((fd) => <F key={String(fd.key)} field={fd} emp={emp} editing={editing} onChange={setField} />)}
                </SCard>
              </div>
              <div className="break-inside-avoid mb-3">
                <SCard title="Emergency Contact" icon={<Heart size={12} className="text-[#204577]" />}>
                  {SECTIONS.emergency[0].fields.map((fd) => <F key={String(fd.key)} field={fd} emp={emp} editing={editing} onChange={setField} />)}
                </SCard>
              </div>
              <div className="break-inside-avoid mb-3">{eduCard}</div>
              <div className="break-inside-avoid mb-3">{trainCard}</div>
              <div className="break-inside-avoid mb-3">{attachCard}</div>
            </div>
            {expCard}
          </div>
        )}
        {(activeTab === 'job' || activeTab === 'compensation' || activeTab === 'bank' || activeTab === 'emergency') && (
          <SectionGrid sections={SECTIONS[activeTab]} emp={emp} editing={editing} onChange={setField} />
        )}

        {activeTab === 'qualifications' && (
          <div className="space-y-3">
            <SCard title="Competencies / Skills" icon={<GraduationCap size={12} className="text-[#204577]" />}>
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-1">Process / Operation</th><th className="py-1">Skill Level</th><th className="py-1">Certified</th><th className="py-1">Expiry</th><th className="py-1">Status</th>
                </tr></thead>
                <tbody>
                  {competencies.length === 0 ? (
                    <tr><td colSpan={5} className="py-3 text-center text-gray-400">No competencies recorded.</td></tr>
                  ) : competencies.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50">
                      <td className="py-1">{c.process_operation}</td>
                      <td className="py-1 text-gray-500">{c.skill_level || '-'}</td>
                      <td className="py-1 text-gray-500">{formatDate(c.certified_on)}</td>
                      <td className="py-1 text-gray-500">{formatDate(c.expiry_date)}</td>
                      <td className="py-1">{c.is_expired ? <span className="text-red-600">Expired</span> : c.expiring_soon ? <span className="text-amber-600">Expiring</span> : <span className="text-green-600">Qualified</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mode !== 'new' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <input value={newComp.process_operation} onChange={(e) => setNewComp({ ...newComp, process_operation: e.target.value })} placeholder="e.g. CNC Turning" className="flex-1 text-xs border border-gray-200 rounded px-2 py-1" />
                  <select value={newComp.skill_level} onChange={(e) => setNewComp({ ...newComp, skill_level: e.target.value })} className="text-xs border border-gray-200 rounded px-2 py-1">
                    {['Trainee', 'Competent', 'Expert'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={addCompetency} className="px-3 py-1 text-xs rounded bg-[#204577] text-white hover:bg-[#1a3860]">Add</button>
                </div>
              )}
            </SCard>
            <SCard title="Training Records" icon={<GraduationCap size={12} className="text-[#204577]" />}>
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-1">Topic</th><th className="py-1">Date</th><th className="py-1">Trainer</th><th className="py-1">Result</th><th className="py-1">Next Due</th>
                </tr></thead>
                <tbody>
                  {training.length === 0 ? (
                    <tr><td colSpan={5} className="py-3 text-center text-gray-400">No training records.</td></tr>
                  ) : training.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50">
                      <td className="py-1">{t.training_topic}</td>
                      <td className="py-1 text-gray-500">{formatDate(t.training_date)}</td>
                      <td className="py-1 text-gray-500">{t.trainer || '-'}</td>
                      <td className="py-1 text-gray-500">{t.result || '-'}</td>
                      <td className="py-1 text-gray-500">{formatDate(t.next_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mode !== 'new' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <input value={newTrain.training_topic} onChange={(e) => setNewTrain({ ...newTrain, training_topic: e.target.value })} placeholder="Training topic" className="flex-1 text-xs border border-gray-200 rounded px-2 py-1" />
                  <input value={newTrain.trainer} onChange={(e) => setNewTrain({ ...newTrain, trainer: e.target.value })} placeholder="Trainer" className="w-32 text-xs border border-gray-200 rounded px-2 py-1" />
                  <button onClick={addTraining} className="px-3 py-1 text-xs rounded bg-[#204577] text-white hover:bg-[#1a3860]">Add</button>
                </div>
              )}
            </SCard>
          </div>
        )}

        {activeTab === 'attendance' && (
          <SCard title="Attendance (recent)" icon={<CalendarCheck size={12} className="text-[#204577]" />}>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-1">Date</th><th className="py-1">Status</th><th className="py-1">Check In</th><th className="py-1">Check Out</th>
              </tr></thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={4} className="py-3 text-center text-gray-400">No attendance records.</td></tr>
                ) : attendance.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-1">{formatDate(a.attendance_date)}</td>
                    <td className="py-1">{a.status}</td>
                    <td className="py-1 text-gray-500">{a.check_in || '-'}</td>
                    <td className="py-1 text-gray-500">{a.check_out || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mode !== 'new' && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <input type="date" value={newAtt.attendance_date} onChange={(e) => setNewAtt({ ...newAtt, attendance_date: e.target.value })} className="text-xs border border-gray-200 rounded px-2 py-1" />
                <select value={newAtt.status} onChange={(e) => setNewAtt({ ...newAtt, status: e.target.value })} className="text-xs border border-gray-200 rounded px-2 py-1">
                  {['Present', 'Absent', 'Leave', 'Holiday'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={markAttendance} className="px-3 py-1 text-xs rounded bg-[#204577] text-white hover:bg-[#1a3860]">Mark</button>
              </div>
            )}
          </SCard>
        )}

        {activeTab === 'experience' && expCard}
        {activeTab === 'documents' && attachCard}
        {(activeTab === 'performance' || activeTab === 'leave' || activeTab === 'assets' || activeTab === 'history') && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-xs text-gray-400">
            {TABS.find((t) => t.id === activeTab)?.label} - coming soon.
          </div>
        )}
      </div>

      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl px-4 py-3 flex items-center justify-end gap-2">
        {saveError ? <span className="text-xs text-red-600 mr-auto">{saveError}</span> : null}
        {saveSuccess ? <span className="text-xs text-green-600 mr-auto">Saved successfully.</span> : null}
        <button onClick={handleDiscard} disabled={saving} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Discard Changes</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-xs text-white bg-[#204577] rounded hover:bg-[#1a3860] disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  )
}
