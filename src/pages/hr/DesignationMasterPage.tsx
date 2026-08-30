/**
 * DesignationMasterPage - matches reference image exactly
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Layers, Building2, Clock, Plus, RefreshCw,
  Pencil, Trash2, Eye, ChevronDown, Filter, Download, Printer,
  Settings, UserCheck, X,
} from 'lucide-react'
import {
  listDesignations, updateDesignation, deleteDesignation,
  type Designation, type DesignationCreate,
} from '../../api/orgMasterApi'

type TabId = 'information' | 'hierarchy' | 'payGrade' | 'deptMapping' | 'documents' | 'history'

const TABS: { id: TabId; label: string }[] = [
  { id: 'information', label: 'Designation Information' },
  { id: 'hierarchy', label: 'Hierarchy Structure' },
  { id: 'payGrade', label: 'Pay Grade Mapping' },
  { id: 'deptMapping', label: 'Department Mapping' },
  { id: 'documents', label: 'Documents' },
  { id: 'history', label: 'History' },
]

const DEPT_OPTIONS = ['', 'Top Management', 'Quality Assurance', 'Production', 'Engineering',
  'Supply Chain Management', 'Finance & Accounts', 'Human Resources', 'Stores & Logistics',
  'Maintenance', 'Information Technology', 'Research & Development', 'Planning & Control']

const LEVEL_OPTIONS = ['', 'Level 1 - Executive', 'Level 2 - Executive', 'Level 3 - Senior',
  'Level 4 - Head', 'Level 5 - Manager', 'Level 6 - Engineer', 'Level 7 - Executive', 'Level 8 - Staff']

const PAY_GRADE_OPTIONS = ['', 'PG-01', 'PG-02', 'PG-03', 'PG-04', 'PG-05', 'PG-06', 'PG-07', 'PG-08', 'PG-09', 'PG-10']
const EDUCATION_OPTIONS = ['', 'B.E / B.Tech', 'M.E / M.Tech', 'MBA', 'B.Sc', 'M.Sc', 'Diploma', 'ITI', 'Any Graduate']

const LEVEL_BADGE: Record<string, string> = {
  'Level 1 - Executive': 'bg-red-100 text-red-700',
  'Level 2 - Executive': 'bg-orange-100 text-orange-700',
  'Level 3 - Senior': 'bg-amber-100 text-amber-700',
  'Level 4 - Head': 'bg-yellow-100 text-yellow-700',
  'Level 5 - Manager': 'bg-blue-100 text-blue-700',
  'Level 6 - Engineer': 'bg-teal-100 text-teal-700',
  'Level 7 - Executive': 'bg-purple-100 text-purple-700',
  'Level 8 - Staff': 'bg-gray-100 text-gray-600',
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Level 1 - Executive', 2: 'Level 2 - Executive', 3: 'Level 3 - Senior',
  4: 'Level 4 - Head', 5: 'Level 5 - Manager', 6: 'Level 6 - Engineer',
  7: 'Level 7 - Executive', 8: 'Level 8 - Staff',
}

const LEVEL_VALUES: Record<string, number> = {
  'Level 1 - Executive': 1, 'Level 2 - Executive': 2, 'Level 3 - Senior': 3,
  'Level 4 - Head': 4, 'Level 5 - Manager': 5, 'Level 6 - Engineer': 6,
  'Level 7 - Executive': 7, 'Level 8 - Staff': 8,
}

function getLevelLabel(level: number | null | undefined): string {
  if (level == null) return ''
  return LEVEL_LABELS[level] ?? `Level ${level}`
}

const DEMO: Designation[] = [
  { id: 'd01', designation_code: 'CEO-01', designation_name: 'Chief Executive Officer', short_name: 'CEO', department: 'Top Management', level: 1, reporting_to: null, function: 'Management', pay_grade: 'PG-10', min_salary: 800000, max_salary: 1200000, min_experience_years: 15, education_required: 'MBA', skills_required: 'Leadership, Strategy', responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd02', designation_code: 'COO-01', designation_name: 'Chief Operating Officer', short_name: 'COO', department: 'Top Management', level: 2, reporting_to: 'CEO', function: 'Management', pay_grade: 'PG-09', min_salary: 700000, max_salary: 1000000, min_experience_years: 12, education_required: 'MBA', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd03', designation_code: 'HO-PRD-01', designation_name: 'Head - Production', short_name: 'HOP', department: 'Production', level: 4, reporting_to: 'COO', function: 'Head', pay_grade: 'PG-07', min_salary: 500000, max_salary: 750000, min_experience_years: 10, education_required: 'B.E / B.Tech', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd04', designation_code: 'QM-01', designation_name: 'Quality Manager', short_name: 'QM', department: 'Quality Assurance', level: 5, reporting_to: 'Head - Quality Assurance', function: 'Management', pay_grade: 'PG-05', min_salary: 800000, max_salary: 1200000, min_experience_years: 8, education_required: 'B.E / B.Tech', skills_required: 'AS9100 Rev D, Nadcap, PPAP', responsibilities: 'QMS management\nAudits\nCompliance', is_active: true, created_at: '2024-05-20T04:15:00Z', updated_at: '2024-05-20T04:15:00Z' },
  { id: 'd05', designation_code: 'QA-EN-01', designation_name: 'Quality Engineer', short_name: 'QE', department: 'Quality Assurance', level: 6, reporting_to: 'Quality Manager', function: 'Direct', pay_grade: 'PG-03', min_salary: 300000, max_salary: 500000, min_experience_years: 2, education_required: 'B.E / B.Tech', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd06', designation_code: 'PD-01', designation_name: 'Production Engineer', short_name: 'PE', department: 'Production', level: 6, reporting_to: 'Head - Production', function: 'Direct', pay_grade: 'PG-03', min_salary: 300000, max_salary: 500000, min_experience_years: 2, education_required: 'B.E / B.Tech', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd07', designation_code: 'SD-01', designation_name: 'Store Incharge', short_name: 'STORE', department: 'Stores & Logistics', level: 6, reporting_to: 'Head - Stores', function: 'Direct', pay_grade: 'PG-03', min_salary: 250000, max_salary: 400000, min_experience_years: 3, education_required: 'Any Graduate', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd08', designation_code: 'MM-01', designation_name: 'Manager - Maintenance', short_name: 'MM', department: 'Maintenance', level: 5, reporting_to: 'COO', function: 'Management', pay_grade: 'PG-05', min_salary: 400000, max_salary: 650000, min_experience_years: 7, education_required: 'B.E / B.Tech', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd09', designation_code: 'HRM-01', designation_name: 'HR Manager', short_name: 'HRM', department: 'Human Resources', level: 5, reporting_to: 'COO', function: 'Management', pay_grade: 'PG-05', min_salary: 400000, max_salary: 600000, min_experience_years: 6, education_required: 'MBA', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
  { id: 'd10', designation_code: 'AC-EX-01', designation_name: 'Executive - Accounts', short_name: 'ACEX', department: 'Finance & Accounts', level: 7, reporting_to: 'Finance Manager', function: 'Executive', pay_grade: 'PG-02', min_salary: 200000, max_salary: 350000, min_experience_years: 1, education_required: 'B.Sc', skills_required: null, responsibilities: null, is_active: true, created_at: null, updated_at: null },
]

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[28px] py-0.5">
      <span className="text-[11px] text-gray-500 w-[140px] shrink-0 leading-tight">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function FInput({ value, onChange, placeholder, disabled, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      disabled={disabled}
      className="w-full text-xs text-gray-800 bg-transparent border-0 border-b border-gray-200 focus:border-[#204577] focus:outline-none py-0.5 px-0 placeholder-gray-300 disabled:text-gray-400" />
  )
}

function FSelect({ value, onChange, options, disabled }: {
  value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      className="w-full text-xs text-gray-800 bg-transparent border-0 border-b border-gray-200 focus:border-[#204577] focus:outline-none py-0.5 px-0 disabled:text-gray-400">
      {options.map(o => <option key={o} value={o}>{o || '-- Select --'}</option>)}
    </select>
  )
}

function SCard({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200" style={{ alignSelf: 'start' }}>
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 ${color}`}>
        {icon}<h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="px-3 py-2 space-y-0.5">{children}</div>
    </div>
  )
}

function SkillTag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium">
      {label}
      {onRemove && <button onClick={onRemove} className="hover:text-red-500"><X size={9} /></button>}
    </span>
  )
}

interface FormState {
  designation_code: string
  designation_name: string
  short_name: string
  department: string
  level_display: string
  reporting_to: string
  function_type: string
  pay_grade: string
  min_salary: string
  max_salary: string
  min_experience_years: string
  education_required: string
  skills_required: string
  responsibilities: string
  is_active: boolean
}

function makeFormState(d: Designation | null): FormState {
  if (!d) return {
    designation_code: '', designation_name: '', short_name: '', department: '',
    level_display: '', reporting_to: '', function_type: '', pay_grade: '',
    min_salary: '', max_salary: '', min_experience_years: '', education_required: '',
    skills_required: '', responsibilities: '', is_active: true,
  }
  return {
    designation_code: d.designation_code ?? '',
    designation_name: d.designation_name ?? '',
    short_name: d.short_name ?? '',
    department: d.department ?? '',
    level_display: getLevelLabel(d.level),
    reporting_to: d.reporting_to ?? '',
    function_type: d.function ?? '',
    pay_grade: d.pay_grade ?? '',
    min_salary: d.min_salary != null ? String(d.min_salary) : '',
    max_salary: d.max_salary != null ? String(d.max_salary) : '',
    min_experience_years: d.min_experience_years != null ? String(d.min_experience_years) : '',
    education_required: d.education_required ?? '',
    skills_required: d.skills_required ?? '',
    responsibilities: d.responsibilities ?? '',
    is_active: d.is_active ?? true,
  }
}

function formToCreate(f: FormState): DesignationCreate {
  return {
    designation_code: f.designation_code,
    designation_name: f.designation_name,
    short_name: f.short_name || undefined,
    department: f.department || undefined,
    level: f.level_display ? LEVEL_VALUES[f.level_display] : undefined,
    reporting_to: f.reporting_to || undefined,
    function: f.function_type || undefined,
    pay_grade: f.pay_grade || undefined,
    min_salary: f.min_salary ? Number(f.min_salary.replace(/,/g, '')) : undefined,
    max_salary: f.max_salary ? Number(f.max_salary.replace(/,/g, '')) : undefined,
    min_experience_years: f.min_experience_years ? Number(f.min_experience_years) : undefined,
    education_required: f.education_required || undefined,
    skills_required: f.skills_required || undefined,
    responsibilities: f.responsibilities || undefined,
    is_active: f.is_active,
  }
}

export function DesignationMasterPage() {
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('information')
  const [selected, setSelected] = useState<Designation | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [form, setForm] = useState<FormState>(makeFormState(null))
  const [deptFilter, setDeptFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await listDesignations({ limit: 200 })
      let data: Designation[] = []
      if (Array.isArray(raw)) {
        data = raw
      } else if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>
        if (Array.isArray(obj.items)) data = obj.items as Designation[]
        else if (Array.isArray(obj.data)) data = obj.data as Designation[]
      }
      if (data.length === 0) {
        setDesignations(DEMO)
        setIsDemo(true)
        setSelected(DEMO[3])
      } else {
        setDesignations(data)
        setIsDemo(false)
        if (data.length > 0) setSelected(data[0])
      }
    } catch {
      setDesignations(DEMO)
      setIsDemo(true)
      setSelected(DEMO[3])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setForm(makeFormState(selected)); setIsEditing(false) }, [selected])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await updateDesignation(selected.id, formToCreate(form))
      setSaveMsg({ ok: true, text: 'Saved successfully' })
      setIsEditing(false)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setSaveMsg({ ok: false, text: err?.response?.data?.detail ?? 'Save failed' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  const handleDelete = async (d: Designation, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${d.designation_name}"?`)) return
    try { await deleteDesignation(d.id); load() } catch { load() }
  }

  const filtered = designations.filter(d => {
    const mDept = !deptFilter || d.department === deptFilter
    const mLevel = !levelFilter || getLevelLabel(d.level) === levelFilter
    const mStatus = !statusFilter || (statusFilter === 'Active' ? d.is_active : !d.is_active)
    return mDept && mLevel && mStatus
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalActive = designations.filter(d => d.is_active).length
  const totalInactive = designations.length - totalActive
  const levels = new Set(designations.map(d => getLevelLabel(d.level)).filter(Boolean)).size
  const depts = new Set(designations.map(d => d.department).filter(Boolean)).size

  return (
    <div className="w-full flex flex-col gap-0">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 rounded-t-xl px-4 py-3">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <span>Master Data</span><span>/</span>
          <span className="text-[#204577] font-medium">Designation</span>
          <span>/</span><span>View</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 min-w-[140px]">
            <div className="w-10 h-10 rounded-lg bg-[#204577]/10 flex items-center justify-center shrink-0">
              <Layers size={20} className="text-[#204577]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Total Designations</p>
              <p className="text-xl font-bold text-gray-900">{designations.length}</p>
              <p className="text-[10px] text-green-600">- {totalActive} Active</p>
              <p className="text-[10px] text-gray-400">Inactive: {totalInactive}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 min-w-[120px]">
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Structure</p>
              <div className="flex gap-4">
                <div><p className="text-[10px] text-gray-400">Levels</p><p className="text-xl font-bold text-gray-900">{levels}</p></div>
                <div><p className="text-[10px] text-gray-400">Departments</p><p className="text-xl font-bold text-gray-900">{depts}</p></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 min-w-[160px]">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Last Modified</p>
              <p className="text-xs font-semibold text-gray-700">20/05/2024 04:15 PM</p>
              <p className="text-[10px] text-gray-400">By: Admin User</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="border-2 border-[#204577] rounded-lg px-3 py-1.5 text-center shrink-0">
            <div className="text-[8px] font-bold text-[#204577] leading-tight">AS 9100</div>
            <div className="text-[8px] font-bold text-[#204577] leading-tight">REV D</div>
            <div className="text-[8px] text-[#204577] leading-tight">CERTIFIED</div>
          </div>
          <div className="border-2 border-blue-900 rounded-lg px-3 py-1.5 text-center shrink-0">
            <div className="text-[8px] font-bold text-blue-900 leading-tight">Nadcap</div>
            <div className="text-[8px] text-blue-900 leading-tight">Administered by PRI</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#204577] text-white hover:bg-[#1a3860]">
              <Plus size={13} /> New Designation
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
              Actions <ChevronDown size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white border-x border-b border-gray-200 px-3 flex gap-0">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-[#204577] text-[#204577]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {saveMsg && (
        <div className={`px-4 py-1.5 text-xs border-x ${saveMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {saveMsg.text}
        </div>
      )}
      {isDemo && <div className="px-4 py-1.5 text-xs border-x border-amber-200 bg-amber-50 text-amber-700">Showing demo data</div>}

      {/* TAB CONTENT */}
      <div className="bg-gray-50 border-x border-b border-gray-200 rounded-b-xl p-3">
        {activeTab === 'information' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-3 items-start">
              {/* Col 1 "" Designation Details */}
              <SCard icon={<Layers size={12} className="text-[#204577]" />} title="Designation Details" color="bg-blue-50">
                <FieldRow label="Designation Code" required>
                  <FInput value={form.designation_code} onChange={v => set('designation_code', v)} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Designation Name" required>
                  <FInput value={form.designation_name} onChange={v => set('designation_name', v)} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Short Name">
                  <FInput value={form.short_name} onChange={v => set('short_name', v)} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Designation Level" required>
                  <FSelect value={form.level_display} onChange={v => set('level_display', v)} options={LEVEL_OPTIONS} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Parent Designation">
                  <FSelect value={form.reporting_to} onChange={v => set('reporting_to', v)}
                    options={['', ...designations.map(d => d.designation_name)]} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Status" required>
                  <FSelect value={form.is_active ? 'Active' : 'Inactive'} onChange={v => set('is_active', v === 'Active')} options={['Active', 'Inactive']} disabled={!isEditing} />
                </FieldRow>
              </SCard>

              {/* Col 2 "" Department & Reporting */}
              <SCard icon={<Building2 size={12} className="text-purple-500" />} title="Department & Reporting" color="bg-purple-50">
                <FieldRow label="Department" required>
                  <FSelect value={form.department} onChange={v => set('department', v)} options={DEPT_OPTIONS} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Reporting To" required>
                  <FSelect value={form.reporting_to} onChange={v => set('reporting_to', v)}
                    options={['', ...designations.map(d => d.designation_name)]} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Function">
                  <FSelect value={form.function_type} onChange={v => set('function_type', v)}
                    options={['', 'Management', 'Executive', 'Direct', 'Support', 'Head']} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Location">
                  <FSelect value={''} onChange={() => {}} options={['', 'Bengaluru - Aerospace SEZ', 'Chennai', 'Pune', 'Remote']} disabled={!isEditing} />
                </FieldRow>
              </SCard>

              {/* Col 3 "" Role & Responsibilities */}
              <SCard icon={<Settings size={12} className="text-green-600" />} title="Role & Responsibilities (Key)" color="bg-green-50">
                <div className="space-y-1 py-1">
                  {form.responsibilities.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[#204577] text-xs shrink-0 mt-0.5">"¢</span>
                      <span className="text-xs text-gray-700 leading-snug">{line}</span>
                    </div>
                  ))}
                  {!form.responsibilities.trim() && (
                    <p className="text-xs text-gray-400 italic">No responsibilities defined</p>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <textarea value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} rows={5}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:border-[#204577] focus:outline-none resize-none"
                      placeholder="One responsibility per line..." />
                  </div>
                )}
                {!isEditing && form.responsibilities.trim() && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <button className="inline-flex items-center gap-1 text-xs text-[#204577] hover:underline">
                      <Eye size={11} /> View Full Roles & Responsibilities
                    </button>
                  </div>
                )}
              </SCard>

              {/* Col 4 "" Other Information */}
              <SCard icon={<UserCheck size={12} className="text-amber-500" />} title="Other Information" color="bg-amber-50">
                <FieldRow label="Pay Grade">
                  <FSelect value={form.pay_grade} onChange={v => set('pay_grade', v)} options={PAY_GRADE_OPTIONS} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Grade Minimum (INR)">
                  <FInput value={form.min_salary} onChange={v => set('min_salary', v)} disabled={!isEditing} placeholder="8,00,000" />
                </FieldRow>
                <FieldRow label="Grade Maximum (INR)">
                  <FInput value={form.max_salary} onChange={v => set('max_salary', v)} disabled={!isEditing} placeholder="12,00,000" />
                </FieldRow>
                <FieldRow label="Skills Required">
                  <div className="flex flex-wrap gap-1 py-0.5">
                    {form.skills_required.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                      <SkillTag key={i} label={s} onRemove={isEditing ? () => {
                        const arr = form.skills_required.split(',').map(x => x.trim()).filter(Boolean)
                        set('skills_required', arr.filter((_, j) => j !== i).join(', '))
                      } : undefined} />
                    ))}
                    {!form.skills_required.trim() && <span className="text-xs text-gray-300">None</span>}
                  </div>
                </FieldRow>
                <FieldRow label="Experience (Years)">
                  <FInput value={form.min_experience_years} onChange={v => set('min_experience_years', v)} disabled={!isEditing} placeholder="8" />
                </FieldRow>
                <FieldRow label="Education">
                  <FSelect value={form.education_required} onChange={v => set('education_required', v)} options={EDUCATION_OPTIONS} disabled={!isEditing} />
                </FieldRow>
                <FieldRow label="Status">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${form.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </span>
                </FieldRow>
              </SCard>
            </div>

            {/* Edit / Save */}
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-xs bg-[#204577] text-white rounded hover:bg-[#1a3860] disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs border border-[#204577] text-[#204577] rounded hover:bg-[#204577]/5">
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>

            {/* Designation List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#204577]" />
                  <h3 className="text-sm font-semibold text-gray-700">Designation List</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }}
                    className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none">
                    <option value="">All Departments...</option>
                    {DEPT_OPTIONS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1) }}
                    className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none">
                    <option value="">All Levels</option>
                    {LEVEL_OPTIONS.filter(Boolean).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                    className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none">
                    <option value="">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <button className="inline-flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 hover:bg-gray-50">
                    <Filter size={11} /> Filter
                  </button>
                  <button onClick={load} className="p-1.5 text-gray-400 hover:text-[#204577] border border-gray-200 rounded"><RefreshCw size={13} /></button>
                  <button className="p-1.5 text-gray-400 hover:text-[#204577] border border-gray-200 rounded"><Download size={13} /></button>
                  <button className="p-1.5 text-gray-400 hover:text-[#204577] border border-gray-200 rounded"><Printer size={13} /></button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['S. No.','Designation Code','Designation Name','Short Name','Department','Level','Reporting To','No. of Direct Reports','Pay Grade','Status','Action'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-400 animate-pulse">Loading...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-400">No designations found</td></tr>
                    ) : paginated.map((d, idx) => {
                      const levelLabel = getLevelLabel(d.level)
                      return (
                        <tr key={d.id} onClick={() => setSelected(d)}
                          className={`border-b border-gray-50 cursor-pointer hover:bg-blue-50 transition-colors ${selected?.id === d.id ? 'bg-blue-50' : ''}`}>
                          <td className="px-3 py-2 text-gray-400">{(page-1)*pageSize+idx+1}</td>
                          <td className="px-3 py-2 font-semibold text-[#204577]">{d.designation_code}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{d.designation_name}</td>
                          <td className="px-3 py-2 text-gray-500">{d.short_name ?? '-'}</td>
                          <td className="px-3 py-2 text-gray-700">{d.department ?? '-'}</td>
                          <td className="px-3 py-2">
                            {levelLabel ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${LEVEL_BADGE[levelLabel] ?? 'bg-gray-100 text-gray-600'}`}>
                                {levelLabel}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{d.reporting_to ?? '-'}</td>
                          <td className="px-3 py-2 text-center text-gray-700">-</td>
                          <td className="px-3 py-2 font-mono text-amber-700 text-[10px] font-medium">{d.pay_grade ?? '-'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${d.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {d.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setSelected(d); setIsEditing(true) }} className="p-1 text-gray-400 hover:text-[#204577]"><Pencil size={12} /></button>
                              <button className="p-1 text-gray-400 hover:text-[#204577]"><Eye size={12} /></button>
                              <button onClick={e => handleDelete(d, e)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Showing {filtered.length === 0 ? 0 : (page-1)*pageSize+1} to {Math.min(page*pageSize, filtered.length)} of {filtered.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">10 / page</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                      className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-40">"¹</button>
                    {Array.from({length: Math.min(totalPages,7)}, (_,i)=>i+1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-6 h-6 flex items-center justify-center border rounded text-xs ${p===page ? 'bg-[#204577] text-white border-[#204577]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    ))}
                    {totalPages > 7 && <span className="text-xs text-gray-400">...</span>}
                    <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page>=totalPages}
                      className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-40">"º</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'information' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
            {TABS.find(t => t.id === activeTab)?.label} "" coming soon
          </div>
        )}
      </div>
    </div>
  )
}
