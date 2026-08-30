/**
 * CompanyMasterPage - Module 01: Company Master
 *
 * FIXED GAPS (2024-08-28):
 *   1. Documents tab now connected to listCompanyDocuments API
 *   2. Deactivate button now calls deactivateCompany API  
 *   3. Configuration tab now shows Document Numbering with CRUD
 *   4. Added AddDocumentModal and AddDocNumberingModal
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Calendar, ChevronDown,
  Building2, Shield, IndianRupee, Phone, Info, Upload, Check,
  FileText, Trash2, Pencil, Clock, Download,
} from 'lucide-react'
import {
  Button, Input, Textarea, Select, StateMachineBadge,
  ConfidenceBadge, Modal, GSTINInput, AuditTrailPanel,
} from '../../components/ui'
import { formatDate, validateGSTIN } from '../../lib/utils'

import {
  Company, CompanyCreatePayload, Plant, CompanyDocument, DocumentNumbering,
  getCompanies, getCompany, createCompany, updateCompany,
  activateCompany, listPlants, createPlant, seedHolidays, createHoliday, deleteHoliday,
  gstinLookup, GSTINLookupResponse, PublicHoliday, listHolidays,
  listCompanyDocuments, createCompanyDocument, deleteCompanyDocument, updateCompanyDocument,
  deactivateCompany, deleteCompany, listDocNumbering, createDocNumbering, deleteDocNumbering,
  updateDocNumbering, deletePlant, uploadCompanyLogo, uploadDocumentFile, deleteCompanyLogo,
} from '../../api/companyApi'

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const COMPANY_TYPE_OPTIONS = [
  { value: '', label: '- Select Type -' },
  { value: 'Private Limited', label: 'Private Limited' },
  { value: 'LLP', label: 'LLP' },
  { value: 'Proprietorship', label: 'Proprietorship' },
  { value: 'Public Limited', label: 'Public Limited' },
]

const INDUSTRY_OPTIONS = [
  { value: '', label: '- Select Industry -' },
  { value: 'Aerospace', label: 'Aerospace' },
  { value: 'Defence', label: 'Defence' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'General Engineering', label: 'General Engineering' },
  { value: 'Other', label: 'Other' },
]

const BUSINESS_TYPE_OPTIONS = [
  { value: '', label: '- Select Business Type -' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Services', label: 'Services' },
  { value: 'Trading', label: 'Trading' },
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
]

const FINANCIAL_YEAR_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: '01 Apr - 31 Mar', label: '01 Apr - 31 Mar' },
  { value: '01 Jan - 31 Dec', label: '01 Jan - 31 Dec' },
]

const YES_NO_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const ACCOUNTING_STANDARD_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Ind AS', label: 'Ind AS' },
  { value: 'GAAP', label: 'GAAP' },
  { value: 'IFRS', label: 'IFRS' },
]

const COSTING_METHOD_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Standard Costing', label: 'Standard Costing' },
  { value: 'Actual Costing', label: 'Actual Costing' },
  { value: 'FIFO', label: 'FIFO' },
  { value: 'LIFO', label: 'LIFO' },
]

const ROUNDING_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: '0 Decimal Places', label: '0 Decimal Places' },
  { value: '2 Decimal Places', label: '2 Decimal Places' },
  { value: '3 Decimal Places', label: '3 Decimal Places' },
]

const BANK_ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Current', label: 'Current' },
  { value: 'Savings', label: 'Savings' },
  { value: 'Cash Credit', label: 'Cash Credit' },
  { value: 'Overdraft', label: 'Overdraft' },
]

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

const INDIAN_STATES = [
  { value: '', label: '- Select State -' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Rajasthan', label: 'Rajasthan' },
]

const COUNTRY_OPTIONS = [
  { value: 'India', label: 'India' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'United Kingdom' },
]

const DOC_TYPE_OPTIONS = [
  { value: '', label: '- Select Document Type -' },
  { value: 'AS 9100 Rev D Certificate', label: 'AS 9100 Rev D Certificate' },
  { value: 'NADCAP Certificate', label: 'NADCAP Certificate' },
  { value: 'Factory Licence', label: 'Factory Licence' },
  { value: 'GST Registration', label: 'GST Registration' },
  { value: 'PAN Card', label: 'PAN Card' },
  { value: 'Other', label: 'Other' },
]

const DOC_STATUS_OPTIONS = [
  { value: 'Valid', label: 'Valid' },
  { value: 'Permanent', label: 'Permanent' },
  { value: 'Expiring Soon', label: 'Expiring Soon' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Pending', label: 'Pending' },
]

const DOC_NUMBERING_TYPES = [
  { value: '', label: '- Select -' },
  { value: 'RFQ', label: 'Request for Quotation' },
  { value: 'PO', label: 'Purchase Order' },
  { value: 'SO', label: 'Sales Order' },
  { value: 'INV', label: 'Invoice' },
  { value: 'NCR', label: 'Non-Conformance Report' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOC_STATUS_CLASSES: Record<string, string> = {
  'Valid': 'bg-green-100 text-green-700 border-green-200',
  'Permanent': 'bg-blue-100 text-blue-700 border-blue-200',
  'Expiring Soon': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Expired': 'bg-red-100 text-red-700 border-red-200',
  'Pending': 'bg-gray-100 text-gray-600 border-gray-200',
}

function SectionCard({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 ${color}`}>
        <span>{icon}</span>
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[30px] px-3 py-1">
      <span className="text-[11px] text-gray-500 shrink-0 w-[120px] leading-tight">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Plant Modal
// ---------------------------------------------------------------------------
function AddPlantModal({ open, onClose, onSaved, companyId }: { open: boolean; onClose: () => void; onSaved: (plant: Plant) => void; companyId: string }) {
  const [plantCode, setPlantCode] = useState('')
  const [plantName, setPlantName] = useState('')
  const [address, setAddress] = useState('')
  const [gstin, setGstin] = useState('')
  const [costCentre, setCostCentre] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setPlantCode(''); setPlantName(''); setAddress(''); setGstin(''); setCostCentre(''); setError(null) }
  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!plantCode.trim()) { setError('Plant code is required'); return }
    if (!plantName.trim()) { setError('Plant name is required'); return }
    setSaving(true); setError(null)
    try {
      const plant = await createPlant(companyId, { plant_code: plantCode.trim().toUpperCase(), plant_name: plantName.trim(), address: address.trim() || undefined, gstin: gstin.trim() || undefined, cost_centre: costCentre.trim() || undefined })
      onSaved(plant); reset(); onClose()
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setError(axErr?.response?.data?.detail ?? 'Failed to add plant')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Plant" footer={<><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>Save Plant</Button></>}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col gap-4">
        <Input label="Plant Code" value={plantCode} onChange={(e) => setPlantCode(e.target.value.toUpperCase())} required placeholder="PL001" maxLength={10} />
        <Input label="Plant Name" value={plantName} onChange={(e) => setPlantName(e.target.value)} required placeholder="Bangalore Unit" />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
        <Input label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={15} className="font-mono" />
        <Input label="Cost Centre" value={costCentre} onChange={(e) => setCostCentre(e.target.value)} placeholder="CC-001" />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Add Document Modal (NEW)
// ---------------------------------------------------------------------------
function AddDocumentModal({ open, onClose, onSaved, companyId }: { open: boolean; onClose: () => void; onSaved: (doc: CompanyDocument) => void; companyId: string }) {
  const [docType, setDocType] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [revision, setRevision] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [issuingAuthority, setIssuingAuthority] = useState('')
  const [status, setStatus] = useState('Pending')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setDocType(''); setDocNumber(''); setRevision(''); setIssueDate(''); setExpiryDate(''); setIssuingAuthority(''); setStatus('Pending'); setFile(null); setError(null) }
  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!docType) { setError('Document type is required'); return }
    setSaving(true); setError(null)
    try {
      let doc = await createCompanyDocument(companyId, { doc_type: docType, doc_number: docNumber.trim() || undefined, revision: revision.trim() || undefined, issue_date: issueDate || undefined, expiry_date: expiryDate || undefined, issuing_authority: issuingAuthority.trim() || undefined, status })
      if (file) {
        doc = await uploadDocumentFile(companyId, doc.id, file)
      }
      onSaved(doc); reset(); onClose()
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setError(axErr?.response?.data?.detail ?? 'Failed to add document')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Document" footer={<><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>Save Document</Button></>}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col gap-4">
        <Select label="Document Type" options={DOC_TYPE_OPTIONS} value={docType} onChange={(e) => setDocType(e.target.value)} required />
        <Input label="Document Number" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="font-mono" />
        <Input label="Revision" value={revision} onChange={(e) => setRevision(e.target.value)} maxLength={10} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Issue Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
        <Input label="Issuing Authority" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} />
        <Select label="Status" options={DOC_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Attach File (optional)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && <div className="mt-1 text-[11px] text-gray-500">Selected: {file.name}</div>}
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Add Document Numbering Modal (NEW)
// ---------------------------------------------------------------------------
function AddDocNumberingModal({ open, onClose, onSaved, companyId }: { open: boolean; onClose: () => void; onSaved: (config: DocumentNumbering) => void; companyId: string }) {
  const [docType, setDocType] = useState('')
  const [prefix, setPrefix] = useState('')
  const [yearFormat, setYearFormat] = useState('YYYY')
  
  const [resetPolicy, setResetPolicy] = useState('annual')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setDocType(''); setPrefix(''); setYearFormat('YYYY'); setResetPolicy('annual'); setError(null) }
  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!docType) { setError('Document type is required'); return }
    if (!prefix.trim()) { setError('Prefix is required'); return }
    setSaving(true); setError(null)
    try {
      const config = await createDocNumbering(companyId, { doc_type: docType, prefix: prefix.trim().toUpperCase() || undefined, year_format: yearFormat || undefined, reset_policy: resetPolicy || undefined })
      onSaved(config); reset(); onClose()
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setError(axErr?.response?.data?.detail ?? 'Failed to add numbering')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Document Numbering" footer={<><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>Save</Button></>}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col gap-4">
        <Select label="Document Type" options={DOC_NUMBERING_TYPES} value={docType} onChange={(e) => setDocType(e.target.value)} required />
        <Input label="Prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} required placeholder="PO" maxLength={10} />
        <Select label="Year Format" options={[{ value: 'YYYY', label: 'YYYY (2024)' }, { value: 'YY', label: 'YY (24)' }, { value: '', label: 'None' }]} value={yearFormat} onChange={(e) => setYearFormat(e.target.value)} />
        
        <Select label="Reset Policy" options={[{ value: 'annual', label: 'Annual' }, { value: 'never', label: 'Never' }]} value={resetPolicy} onChange={(e) => setResetPolicy(e.target.value)} />
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600"><strong>Preview:</strong> {prefix || 'PO'}-{yearFormat || 'YYYY'}-0001</div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Edit Document Modal
// ---------------------------------------------------------------------------
function EditDocumentModal({ open, onClose, onSaved, companyId, doc }: { open: boolean; onClose: () => void; onSaved: (doc: CompanyDocument) => void; companyId: string; doc: CompanyDocument | null }) {
  const [docType, setDocType] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [revision, setRevision] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [issuingAuthority, setIssuingAuthority] = useState('')
  const [status, setStatus] = useState('Pending')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (doc) {
      setDocType(doc.doc_type)
      setDocNumber(doc.doc_number ?? '')
      setRevision(doc.revision ?? '')
      setIssueDate(doc.issue_date ?? '')
      setExpiryDate(doc.expiry_date ?? '')
      setIssuingAuthority(doc.issuing_authority ?? '')
      setStatus(doc.status)
      setError(null)
    }
  }, [doc])

  const handleSave = async () => {
    if (!doc) return
    setSaving(true); setError(null)
    try {
      const updated = await updateCompanyDocument(companyId, doc.id, {
        doc_type: docType, doc_number: docNumber.trim() || undefined,
        revision: revision.trim() || undefined, issue_date: issueDate || undefined,
        expiry_date: expiryDate || undefined, issuing_authority: issuingAuthority.trim() || undefined, status,
      })
      onSaved(updated); onClose()
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setError(axErr?.response?.data?.detail ?? 'Failed to update document')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Document" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>Save Changes</Button></>}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col gap-4">
        <Select label="Document Type" options={DOC_TYPE_OPTIONS} value={docType} onChange={(e) => setDocType(e.target.value)} required />
        <Input label="Document Number" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="font-mono" />
        <Input label="Revision" value={revision} onChange={(e) => setRevision(e.target.value)} maxLength={10} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Issue Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
        <Input label="Issuing Authority" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} />
        <Select label="Status" options={DOC_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Edit Document Numbering Modal
// ---------------------------------------------------------------------------
function EditDocNumberingModal({ open, onClose, onSaved, companyId, config }: { open: boolean; onClose: () => void; onSaved: (config: DocumentNumbering) => void; companyId: string; config: DocumentNumbering | null }) {
  const [prefix, setPrefix] = useState('')
  const [yearFormat, setYearFormat] = useState('YYYY')
  const [resetPolicy, setResetPolicy] = useState('annual')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (config) {
      setPrefix(config.prefix ?? '')
      setYearFormat(config.year_format ?? 'YYYY')
      setResetPolicy(config.reset_policy ?? 'annual')
      setError(null)
    }
  }, [config])

  const handleSave = async () => {
    if (!config) return
    setSaving(true); setError(null)
    try {
      const updated = await updateDocNumbering(companyId, config.id, {
        prefix: prefix.trim().toUpperCase() || undefined,
        year_format: yearFormat || undefined,
        reset_policy: resetPolicy || undefined,
      })
      onSaved(updated); onClose()
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setError(axErr?.response?.data?.detail ?? 'Failed to update numbering')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Numbering — ${config?.doc_type ?? ''}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>Save Changes</Button></>}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col gap-4">
        <Input label="Prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} required maxLength={10} />
        <Select label="Year Format" options={[{ value: 'YYYY', label: 'YYYY (2024)' }, { value: 'YY', label: 'YY (24)' }, { value: '', label: 'None' }]} value={yearFormat} onChange={(e) => setYearFormat(e.target.value)} />
        <Select label="Reset Policy" options={[{ value: 'annual', label: 'Annual' }, { value: 'never', label: 'Never' }]} value={resetPolicy} onChange={(e) => setResetPolicy(e.target.value)} />
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600"><strong>Preview:</strong> {prefix || config?.prefix || 'PO'}-{yearFormat || 'YYYY'}-0001</div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Activation Error Modal
// ---------------------------------------------------------------------------
function ActivationErrorModal({ open, onClose, missing }: { open: boolean; onClose: () => void; missing: string[] }) {
  return (
    <Modal open={open} onClose={onClose} title="Activation Failed" footer={<Button variant="primary" onClick={onClose}>Close</Button>}>
      <p className="text-sm text-gray-600 mb-4">Missing items:</p>
      <ul className="list-disc pl-5 space-y-1">
        {missing.map((item) => <li key={item} className="text-sm text-red-700 font-medium">{item}</li>)}
      </ul>
    </Modal>
  )
}

const TABS = [
  { key: 'general', label: 'General Information' },
  { key: 'contact', label: 'Contact Details' },
  { key: 'address', label: 'Address' },
  { key: 'banking', label: 'Banking Information' },
  { key: 'factory', label: 'Factory Licence' },
  { key: 'statutory', label: 'Statutory & Compliance' },
  { key: 'business', label: 'Business Details' },
  { key: 'documents', label: 'Documents' },
  { key: 'audit', label: 'Audit & Notes' },
  { key: 'config', label: 'Configuration' },
]


// Compute current Indian Financial Year (Apr-Mar) in DD-Mon-YYYY format
function getCurrentFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth() // 0-11
  const year = now.getFullYear()
  // FY starts in April (month 3)
  const fyStart = month >= 3 ? year : year - 1
  const fyEnd = fyStart + 1
  return `01-Apr-${fyStart} - 31-Mar-${fyEnd}`
}

// Validate CIN format: L/U + 5 digits + 2 chars state + 4 digits year + 3 chars type + 6 digits
// Example: L17110MH1973PLC019786
function isValidCIN(cin: string): boolean {
  if (!cin || cin.length !== 21) return false
  const pattern = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/
  return pattern.test(cin.toUpperCase())
}

// Compute the NEXT document number for preview WITHOUT calling the backend
// generator (that endpoint commits & consumes a sequence). Mirrors the server
// format {PREFIX}-{YYYY}-{NNNN} from app/services/doc_number.py.
function nextDocNumberPreview(c: DocumentNumbering): string {
  const now = new Date()
  const yr = c.year_format === 'YY' ? String(now.getFullYear()).slice(-2) : String(now.getFullYear())
  const seq = String((c.current_sequence ?? 0) + 1).padStart(4, '0')
  return `${c.prefix}-${yr}-${seq}`
}
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Static demo company — used when no backend is available
// ---------------------------------------------------------------------------
const DEMO_COMPANY: Company = {
  id: 'demo-company-001',
  company_code: 'SCALEAI',
  legal_name: 'Scale Trace AI Private Limited',
  trade_name: 'Scale AI',
  short_name: 'Scale AI',
  status: 'Active',
  cin_number: 'U72200KA2024PTC185123',
  company_type: 'Private Limited',
  incorporation_date: '2024-01-15',
  industry: 'Aerospace',
  business_type: 'Manufacturing',
  base_currency: 'INR',
  country: 'India',
  timezone: 'Asia/Kolkata',
  pan: 'AABCS1234A',
  gstin: '29AABCS1234A1ZV',
  tan: 'BLRS12345A',
  registered_address_line1: '123 Tech Park, Electronic City',
  registered_city: 'Bangalore',
  registered_state: 'Karnataka',
  registered_country: 'India',
  registered_pin: '560100',
  phone: '+91-80-12345678',
  email: 'contact@scaletrace.ai',
  website: 'https://scaletrace.ai',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T14:30:00Z',
}

export function CompanyMasterPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  // Data state — pre-seeded with demo company so list view always shows content
  const [companiesList, setCompaniesList] = useState<Company[]>([DEMO_COMPANY])
  const [companySearch, setCompanySearch] = useState('')
  const [companyStatus, setCompanyStatus] = useState('')
  const [company, setCompany] = useState<Company | null>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [companyDocs, setCompanyDocs] = useState<CompanyDocument[]>([])
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const [pendingCerts, setPendingCerts] = useState<{type: string, file: File, preview: string}[]>([])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [docNumberingConfigs, setDocNumberingConfigs] = useState<DocumentNumbering[]>([])
  const [holidays, setHolidays] = useState<PublicHoliday[]>([])
  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayDesc, setNewHolidayDesc] = useState('')
  const [newHolidayType, setNewHolidayType] = useState('Central')
  const [addingHoliday, setAddingHoliday] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('general')

  // Form state - Basic
  const [companyCode, setCompanyCode] = useState('')
  const [legalName, setLegalName] = useState('')
  const [shortName, setShortName] = useState('')
  const [cinNumber, setCinNumber] = useState('')
  const [companyType, setCompanyType] = useState('')
  const [incorporationDate, setIncorporationDate] = useState('')
  const [statusField, setStatusField] = useState('Draft')
  const [corporateEmail, setCorporateEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('Aerospace')
  const [businessType, setBusinessType] = useState('Manufacturing')
  const [country, setCountry] = useState('India')
  const [timezone, setTimezone] = useState('Asia/Kolkata')

  // Registration
  const [pan, setPan] = useState('')
  const [gstin, setGstin] = useState('')
  const [tan, setTan] = useState('')
  const [iecCode, setIecCode] = useState('')
  const [msmeRegistration, setMsmeRegistration] = useState('')
  const [pfNumber, setPfNumber] = useState('')
  const [esiNumber, setEsiNumber] = useState('')
  const [professionTaxNo, setProfessionTaxNo] = useState('')

  // Financial
  const [baseCurrency, setBaseCurrency] = useState('INR')
  const [financialYearStart, setFinancialYearStart] = useState(getCurrentFinancialYear())
  const [tdsApplicable, setTdsApplicable] = useState('Yes')
  const [tcsApplicable, setTcsApplicable] = useState('No')
  const [accountingStandard, setAccountingStandard] = useState('Ind AS')
  const [auditRequired, setAuditRequired] = useState('Yes')
  const [costMethod, setCostMethod] = useState('Standard Costing')
  const [roundingOffLevel, setRoundingOffLevel] = useState('2 Decimal Places')

  // Contact
  const [phoneNo, setPhoneNo] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [landlineNo, setLandlineNo] = useState('')
  const [email, setEmail] = useState('')
  const [alternateEmail, setAlternateEmail] = useState('')
  const [faxNo, setFaxNo] = useState('')

  // Registered Address
  const [regAddrLine1, setRegAddrLine1] = useState('')
  const [regAddrLine2, setRegAddrLine2] = useState('')
  const [regCity, setRegCity] = useState('')
  const [regState, setRegState] = useState('')
  const [regCountry, setRegCountry] = useState('India')
  const [regPin, setRegPin] = useState('')

  // Corporate Address
  const [corpSameAsReg, setCorpSameAsReg] = useState(false)
  const [corpAddrLine1, setCorpAddrLine1] = useState('')
  const [corpAddrLine2, setCorpAddrLine2] = useState('')
  const [corpCity, setCorpCity] = useState('')
  const [corpState, setCorpState] = useState('')
  const [corpCountry, setCorpCountry] = useState('India')
  const [corpPin, setCorpPin] = useState('')

  // Banking
  const [bankName, setBankName] = useState('')
  const [bankBranch, setBankBranch] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountType, setBankAccountType] = useState('')
  const [bankIfscCode, setBankIfscCode] = useState('')
  const [bankMicrCode, setBankMicrCode] = useState('')
  const [bankUpiId, setBankUpiId] = useState('')

  // Factory
  const [factoryLicenceNumber, setFactoryLicenceNumber] = useState('')
  const [factoryLicenceDate, setFactoryLicenceDate] = useState('')
  const [factoryLicenceValidUpto, setFactoryLicenceValidUpto] = useState('')
  const [factoryLicenceIssuingAuthority, setFactoryLicenceIssuingAuthority] = useState('')
  const [kspcbConsentNumber, setKspcbConsentNumber] = useState('')
  const [kspcbConsentValidUpto, setKspcbConsentValidUpto] = useState('')

  // Certifications
  const [as9100CertNumber, setAs9100CertNumber] = useState('')
  const [as9100CertValidUpto, setAs9100CertValidUpto] = useState('')
  const [nadcapCertNumber, setNadcapCertNumber] = useState('')
  const [nadcapCertValidUpto, setNadcapCertValidUpto] = useState('')

  // Notes
  const [notes, setNotes] = useState('')

  // GSTIN Lookup
  const [gstinLookupValue, setGstinLookupValue] = useState('')
  const [gstinLookupResult, setGstinLookupResult] = useState<GSTINLookupResponse | null>(null)
  const [gstinLookupLoading, setGstinLookupLoading] = useState(false)
  const [gstinLookupError, setGstinLookupError] = useState<string | null>(null)

  // Modals
  const [showAddPlant, setShowAddPlant] = useState(false)
  const [showAddDocument, setShowAddDocument] = useState(false)
  const [showAddDocNumbering, setShowAddDocNumbering] = useState(false)
  const [showEditDocument, setShowEditDocument] = useState(false)
  const [editingDoc, setEditingDoc] = useState<CompanyDocument | null>(null)
  const [showEditDocNumbering, setShowEditDocNumbering] = useState(false)
  const [editingDocNumbering, setEditingDocNumbering] = useState<DocumentNumbering | null>(null)
  const [activationMissing, setActivationMissing] = useState<string[]>([])
  const [showActivationError, setShowActivationError] = useState(false)

  // Action state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activating, setActivating] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [seedingHolidays, setSeedingHolidays] = useState(false)
  const [holidaysSeedMsg, setHolidaysSeedMsg] = useState<string | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  // Reset all form state to blank defaults (used when navigating to New Company)
  const resetForm = useCallback(() => {
    setCompany(null)
    setCompanyCode(''); setLegalName(''); setShortName(''); setCinNumber('')
    setCompanyType(''); setIncorporationDate(''); setStatusField('Draft')
    setCorporateEmail(''); setWebsite(''); setIndustry('Aerospace')
    setBusinessType('Manufacturing'); setCountry('India'); setTimezone('Asia/Kolkata')
    setPan(''); setGstin(''); setTan(''); setIecCode(''); setMsmeRegistration('')
    setPfNumber(''); setEsiNumber(''); setProfessionTaxNo('')
    setBaseCurrency('INR'); setFinancialYearStart(getCurrentFinancialYear())
    setTdsApplicable('Yes'); setTcsApplicable('No')
    setAccountingStandard('Ind AS'); setAuditRequired('Yes')
    setCostMethod('Standard Costing'); setRoundingOffLevel('2 Decimal Places')
    setPhoneNo(''); setMobileNo(''); setLandlineNo('')
    setEmail(''); setAlternateEmail(''); setFaxNo('')
    setRegAddrLine1(''); setRegAddrLine2(''); setRegCity('')
    setRegState(''); setRegCountry('India'); setRegPin('')
    setCorpSameAsReg(false)
    setCorpAddrLine1(''); setCorpAddrLine2(''); setCorpCity('')
    setCorpState(''); setCorpCountry('India'); setCorpPin('')
    setBankName(''); setBankBranch(''); setBankAccountNumber('')
    setBankAccountType(''); setBankIfscCode(''); setBankMicrCode(''); setBankUpiId('')
    setFactoryLicenceNumber(''); setFactoryLicenceDate(''); setFactoryLicenceValidUpto('')
    setFactoryLicenceIssuingAuthority(''); setKspcbConsentNumber(''); setKspcbConsentValidUpto('')
    setAs9100CertNumber(''); setAs9100CertValidUpto('')
    setNadcapCertNumber(''); setNadcapCertValidUpto('')
    setNotes('')
    setGstinLookupValue(''); setGstinLookupResult(null); setGstinLookupError(null)
    setPlants([]); setLogoUrl(null); setCompanyDocs([]); setDocNumberingConfigs([]); setHolidays([])
    setPendingLogoFile(null); setPendingCerts([])
    setSaveError(null); setSaveSuccess(false); setActiveTab('general')
  }, [])


  // Populate form from company
  const populateForm = useCallback((c: Company) => {
    const f = c as unknown as Record<string, string | boolean | number | null>
    setCompanyCode(c.company_code)
    setLogoUrl(c.logo_file_path || null)
    setLegalName(c.legal_name)
    setShortName((f.short_name as string) ?? '')
    setCinNumber(c.cin_number ?? '')
    setCompanyType(c.company_type)
    setIncorporationDate(c.incorporation_date ?? '')
    setStatusField(c.status)
    setCorporateEmail((f.email as string) ?? '')
    setWebsite(c.website ?? '')
    setIndustry(c.industry)
    setBusinessType(c.business_type)
    setCountry(c.country)
    setTimezone(c.timezone)
    setPan((f.pan as string) ?? '')
    setGstin((f.gstin as string) ?? '')
    setTan((f.tan as string) ?? '')
    setIecCode((f.iec_code as string) ?? '')
    setMsmeRegistration((f.msme_registration as string) ?? '')
    setPfNumber((f.pf_number as string) ?? '')
    setEsiNumber((f.esi_number as string) ?? '')
    setProfessionTaxNo((f.profession_tax_no as string) ?? '')
    setBaseCurrency(c.base_currency)
    setFinancialYearStart((f.financial_year_start as string) || getCurrentFinancialYear())
    setTdsApplicable((f.tds_applicable as string) ?? 'Yes')
    setTcsApplicable((f.tcs_applicable as string) ?? 'No')
    setAccountingStandard((f.accounting_standard as string) ?? 'Ind AS')
    setAuditRequired((f.audit_required as string) ?? 'Yes')
    setCostMethod((f.cost_method as string) ?? 'Standard Costing')
    setRoundingOffLevel((f.rounding_off_level as string) ?? '2 Decimal Places')
    setPhoneNo((f.phone as string) ?? '')
    setMobileNo((f.mobile_no as string) ?? '')
    setLandlineNo((f.landline_no as string) ?? '')
    setEmail((f.email as string) ?? '')
    setAlternateEmail((f.alternate_email as string) ?? '')
    setFaxNo((f.fax_no as string) ?? '')
    setRegAddrLine1((f.registered_address_line1 as string) ?? '')
    setRegAddrLine2((f.registered_address_line2 as string) ?? '')
    setRegCity((f.registered_city as string) ?? '')
    setRegState((f.registered_state as string) ?? '')
    setRegCountry((f.registered_country as string) ?? 'India')
    setRegPin((f.registered_pin as string) ?? '')
    setCorpSameAsReg((f.corporate_same_as_registered as boolean) ?? false)
    setCorpAddrLine1((f.corporate_address_line1 as string) ?? '')
    setCorpAddrLine2((f.corporate_address_line2 as string) ?? '')
    setCorpCity((f.corporate_city as string) ?? '')
    setCorpState((f.corporate_state as string) ?? '')
    setCorpCountry((f.corporate_country as string) ?? 'India')
    setCorpPin((f.corporate_pin as string) ?? '')
    setBankName((f.bank_name as string) ?? '')
    setBankBranch((f.bank_branch as string) ?? '')
    setBankAccountNumber((f.bank_account_number as string) ?? '')
    setBankAccountType((f.bank_account_type as string) ?? '')
    setBankIfscCode((f.bank_ifsc_code as string) ?? '')
    setBankMicrCode((f.bank_micr_code as string) ?? '')
    setBankUpiId((f.bank_upi_id as string) ?? '')
    setFactoryLicenceNumber((f.factory_licence_number as string) ?? '')
    setFactoryLicenceDate((f.factory_licence_date as string) ?? '')
    setFactoryLicenceValidUpto((f.factory_licence_valid_upto as string) ?? '')
    setFactoryLicenceIssuingAuthority((f.factory_licence_issuing_authority as string) ?? '')
    setKspcbConsentNumber((f.kspcb_consent_number as string) ?? '')
    setKspcbConsentValidUpto((f.kspcb_consent_valid_upto as string) ?? '')
    setAs9100CertNumber((f.as9100_cert_number as string) ?? '')
    setAs9100CertValidUpto((f.as9100_cert_valid_upto as string) ?? '')
    setNadcapCertNumber((f.nadcap_cert_number as string) ?? '')
    setNadcapCertValidUpto((f.nadcap_cert_valid_upto as string) ?? '')
    setNotes((f.notes as string) ?? '')
  }, [])

  // Load on mount
  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true); setLoadError(null)
      try {
        if (id && !isNew) {
          // Detail / edit view — load specific company
          const [companies, companyPlants, docs, docNum, hols] = await Promise.all([
            getCompanies(), listPlants(id),
            listCompanyDocuments(id).catch(() => []),
            listDocNumbering(id).catch(() => []),
            listHolidays(id).catch(() => []),
          ])
          if (!active) return
          const found = companies.find((c) => c.id === id)
          if (found) { setCompany(found); populateForm(found) }
          setPlants(companyPlants)
          setCompanyDocs(docs)
          setDocNumberingConfigs(docNum)
          setHolidays(hols)
        } else if (isNew && id === 'new') {
          // New company form — reset everything to blank defaults
          if (active) resetForm()
        } else {
          // List view — load all companies, fall back to demo if empty
          const companies = await getCompanies()
          if (!active) return
          setCompaniesList(companies.length > 0 ? companies : [DEMO_COMPANY])
        }
      } catch {
        // Static demo mode — no backend, use demo company data
        if (!active) return
        if (id && !isNew) {
          setCompany(DEMO_COMPANY)
          populateForm(DEMO_COMPANY)
          setPlants([{ id: 'demo-plant-001', company_id: 'demo-company-001', plant_code: 'PL001', plant_name: 'Bangalore Unit', address: 'Electronic City, Bangalore', gstin: '29AABCS1234A1ZV', created_at: '2024-01-15T10:00:00Z' }])
          setCompanyDocs([])
          setDocNumberingConfigs([])
          setHolidays([])
        } else if (!isNew) {
          setCompaniesList([DEMO_COMPANY])
        }
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [id, isNew, populateForm, resetForm])

  // Sync corporate address
  useEffect(() => {
    if (corpSameAsReg) {
      setCorpAddrLine1(regAddrLine1); setCorpAddrLine2(regAddrLine2)
      setCorpCity(regCity); setCorpState(regState)
      setCorpCountry(regCountry); setCorpPin(regPin)
    }
  }, [corpSameAsReg, regAddrLine1, regAddrLine2, regCity, regState, regCountry, regPin])

  // GSTIN Lookup — auto-fills form fields from live GSP data
  const handleGstinLookup = async () => {
    const cleaned = gstinLookupValue.trim().toUpperCase()
    if (!cleaned) return
    setGstinLookupLoading(true); setGstinLookupError(null); setGstinLookupResult(null)
    try {
      const result = await gstinLookup(cleaned)
      setGstinLookupResult(result)

      // ── Always: extract PAN & state from the GSTIN number itself ────────
      const panFromGstin = cleaned.substring(2, 12)
      const stateFromGstin = result.state_name ?? ''

      // Set GSTIN in Registration tab
      setGstin(cleaned)
      if (panFromGstin && !pan) setPan(panFromGstin)
      if (stateFromGstin) { setRegState(stateFromGstin); setRegCountry('India') }

      // ── Company name & code suggestion ───────────────────────────────────
      if (result.legal_name) {
        setLegalName(result.legal_name)
        if (!companyCode) {
          const words = result.legal_name.trim().split(/\s+/)
          const raw = words.length >= 3
            ? words.slice(0, 3).map((w: string) => w[0]).join('').toUpperCase()
            : words.map((w: string) => w.substring(0, 2)).join('').toUpperCase()
          const clean = raw.replace(/[^A-Z0-9]/g, '').substring(0, 6)
          if (clean.length >= 3) setCompanyCode(clean)
        }
      }
      if (result.trade_name && result.trade_name !== result.legal_name) setShortName(result.trade_name)

      // ── Business constitution → Company Type ─────────────────────────────
      if (result.business_constitution && !companyType) {
        const map: Record<string, string> = {
          'Proprietorship': 'Proprietorship', 'Partnership': 'LLP',
          'Limited Liability Partnership': 'LLP', 'Private Limited Company': 'Private Limited',
          'Public Limited Company': 'Public Limited', 'One Person Company': 'Private Limited',
        }
        const mapped = map[result.business_constitution]
        if (mapped) setCompanyType(mapped)
      }

      // ── Registration date → Incorporation Date ───────────────────────────
      if (result.registration_date && !incorporationDate) setIncorporationDate(result.registration_date)

      // ── PIN Code (direct field from gstinapi.in) ─────────────────────────
      if (result.pincode) setRegPin(result.pincode)

      // ── Address parsing ──────────────────────────────────────────────────
      if (result.registered_address) {
        const addr = result.registered_address
        const parts = addr.split(',').map((p: string) => p.trim()).filter(Boolean)
        if (!result.pincode) {
          const pinMatch = addr.match(/\b(\d{6})\b/)
          if (pinMatch) setRegPin(pinMatch[1])
        }
        if (parts.length >= 1) setRegAddrLine1(parts[0].substring(0, 200))
        if (parts.length >= 2) setRegAddrLine2(parts[1].substring(0, 200))
        if (parts.length >= 3) {
          const cityPart = parts[Math.max(0, parts.length - 2)].replace(/\b\d{6}\b/, '').replace(/-\s*$/, '').trim()
          if (cityPart) setRegCity(cityPart)
        }
      }

    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setGstinLookupError(axErr?.response?.data?.detail ?? 'GSTIN lookup failed')
    } finally { setGstinLookupLoading(false) }
  }


  // Discard Changes — re-fetch from server for existing company, reset form for new
  const handleDiscard = async () => {
    if (!company) {
      // New company form — navigate back to list
      if (window.confirm('Discard new company form and go back to the list?')) {
        navigate('/masters/company')
      }
      return
    }
    // Existing company — re-fetch from server to get true last-saved state
    try {
      const fresh = await getCompany(company.id)
      setCompany(fresh)
      populateForm(fresh)
      setSaveError(null)
      setSaveSuccess(false)
    } catch {
      // Fallback: reset from in-memory company object
      populateForm(company)
      setSaveError(null)
    }
  }

  // Build payload
  const buildPayload = (): CompanyCreatePayload => ({
    company_code: companyCode.trim().toUpperCase(), legal_name: legalName.trim(), trade_name: shortName.trim() || undefined,
    company_type: companyType, cin_number: cinNumber.trim() || undefined, incorporation_date: incorporationDate || undefined,
    industry, business_type: businessType, base_currency: baseCurrency, country, timezone,
    pan: pan.trim().toUpperCase() || undefined, gstin: gstin.trim().toUpperCase() || undefined, tan: tan.trim().toUpperCase() || undefined,
    iec_code: iecCode.trim().toUpperCase() || undefined, msme_registration: msmeRegistration.trim() || undefined,
    pf_number: pfNumber.trim() || undefined, esi_number: esiNumber.trim() || undefined,
    profession_tax_no: professionTaxNo.trim() || undefined,
    factory_licence_number: factoryLicenceNumber.trim() || undefined,
    phone: phoneNo.trim() || undefined, mobile_no: mobileNo.trim() || undefined, landline_no: landlineNo.trim() || undefined,
    email: email.trim() || undefined, alternate_email: alternateEmail.trim() || undefined, fax_no: faxNo.trim() || undefined,
    website: website.trim() || undefined,
    registered_address_line1: regAddrLine1.trim() || undefined, registered_address_line2: regAddrLine2.trim() || undefined,
    registered_city: regCity.trim() || undefined, registered_state: regState || undefined,
    registered_country: regCountry || undefined, registered_pin: regPin.trim() || undefined,
    corporate_same_as_registered: corpSameAsReg,
    corporate_address_line1: corpAddrLine1.trim() || undefined, corporate_address_line2: corpAddrLine2.trim() || undefined,
    corporate_city: corpCity.trim() || undefined, corporate_state: corpState || undefined,
    corporate_country: corpCountry || undefined, corporate_pin: corpPin.trim() || undefined,
    bank_name: bankName.trim() || undefined, bank_branch: bankBranch.trim() || undefined,
    bank_account_number: bankAccountNumber.trim() || undefined, bank_ifsc_code: bankIfscCode.trim().toUpperCase() || undefined,
    bank_account_type: bankAccountType || undefined, bank_micr_code: bankMicrCode.trim() || undefined, bank_upi_id: bankUpiId.trim() || undefined,
    factory_licence_date: factoryLicenceDate || undefined, factory_licence_valid_upto: factoryLicenceValidUpto || undefined,
    factory_licence_issuing_authority: factoryLicenceIssuingAuthority.trim() || undefined,
    kspcb_consent_number: kspcbConsentNumber.trim() || undefined, kspcb_consent_valid_upto: kspcbConsentValidUpto || undefined,
    as9100_cert_number: as9100CertNumber.trim() || undefined, as9100_cert_valid_upto: as9100CertValidUpto || undefined,
    nadcap_cert_number: nadcapCertNumber.trim() || undefined, nadcap_cert_valid_upto: nadcapCertValidUpto || undefined,
    financial_year_start: financialYearStart || undefined, cost_method: costMethod || undefined,
    tds_applicable: tdsApplicable, tcs_applicable: tcsApplicable,
    accounting_standard: accountingStandard || undefined, audit_required: auditRequired,
    rounding_off_level: roundingOffLevel || undefined, notes: notes.trim() || undefined,
  } as unknown as CompanyCreatePayload)

  // Save
  const handleSave = async () => {
    const errors: string[] = []
    // Required fields — only checked at create (code is immutable after, type/industry/business preset).
    if (!company) {
      if (!companyCode.trim()) errors.push('Company Code is required')
      else if (companyCode.trim().length < 3) errors.push('Company Code must be at least 3 characters')
      else if (companyCode.trim().length > 6) errors.push('Company Code must be at most 6 characters')
      else if (!/^[A-Z0-9]+$/.test(companyCode.trim())) errors.push('Company Code must be uppercase alphanumeric')
      if (!companyType) errors.push('Company Type is required')
      if (!industry) errors.push('Industry is required')
      if (!businessType) errors.push('Business Type is required')
    }
    // Company Name required on create AND edit (guard against blanking it).
    // Backend enforces min_length=2 (schemas/company.py) -- mirror it here so
    // a 1-character name fails fast with a clear message, not a 422 round trip.
    if (!legalName.trim()) errors.push('Company Name is required')
    else if (legalName.trim().length < 2) errors.push('Company Name must be at least 2 characters')
    // Optional statutory / banking / contact fields — format-checked only when filled (create + edit).
    const _pan = pan.trim().toUpperCase()
    if (_pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(_pan)) errors.push('PAN is invalid (format AAAAA0000A)')
    const _gstin = gstin.trim().toUpperCase()
    if (_gstin && !validateGSTIN(_gstin)) errors.push('GSTIN is invalid (15-char format)')
    const _cin = cinNumber.trim().toUpperCase()
    if (_cin && !isValidCIN(_cin)) errors.push('CIN is invalid (21-char format)')
    const _tan = tan.trim().toUpperCase()
    if (_tan && !/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(_tan)) errors.push('TAN is invalid (format AAAA00000A)')
    const _ifsc = bankIfscCode.trim().toUpperCase()
    if (_ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(_ifsc)) errors.push('IFSC is invalid (format AAAA0XXXXXX)')
    if (regPin.trim() && !/^[0-9]{6}$/.test(regPin.trim())) errors.push('Registered PIN must be 6 digits')
    if (corpPin.trim() && !/^[0-9]{6}$/.test(corpPin.trim())) errors.push('Corporate PIN must be 6 digits')
    const _em = email.trim()
    if (_em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_em)) errors.push('Email is invalid')
    const _aem = alternateEmail.trim()
    if (_aem && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_aem)) errors.push('Alternate email is invalid')
    if (errors.length > 0) { setSaveError(errors.join('. ')); return }
    setSaving(true); setSaveError(null); setSaveSuccess(false)
    const payload = buildPayload()
    try {
      if (!company) {
        const created = await createCompany(payload)
        
        // Upload pending logo if selected during creation
        if (pendingLogoFile) {
          try {
            const logoRes = await uploadCompanyLogo(created.id, pendingLogoFile)
            setLogoUrl(logoRes.logo_url)
            setPendingLogoFile(null)
          } catch (logoErr) { console.error('Logo upload failed:', logoErr) }
        }
        
        // Upload pending certificates if selected during creation
        for (const cert of pendingCerts) {
          try {
            const doc = await createCompanyDocument(created.id, {
              doc_type: cert.type + ' Certificate',
              doc_number: '',
              issue_date: new Date().toISOString().slice(0, 10),
              status: 'Active'
            })
            await uploadDocumentFile(created.id, doc.id, cert.file)
          } catch (certErr) { console.error('Cert upload failed:', certErr) }
        }
        setPendingCerts([])
        setCompany(created); populateForm(created)
        navigate(`/masters/company/${created.id}`, { replace: true })
      } else {
        const { company_code: _cc, ...updatePayload } = payload
        const updated = await updateCompany(company.id, updatePayload)
        setCompany(updated); populateForm(updated); setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: unknown } } }
      const detail = axErr?.response?.data?.detail
      setSaveError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally { setSaving(false) }
  }

  // Activate
  const handleActivate = async () => {
    if (!company) return
    setActivating(true)
    try {
      const updated = await activateCompany(company.id)
      setCompany(updated); setStatusField(updated.status)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: { missing?: string[] } } } }
      const detail = axErr?.response?.data?.detail
      if (detail?.missing && Array.isArray(detail.missing)) {
        setActivationMissing(detail.missing); setShowActivationError(true)
      } else {
        setSaveError(typeof detail === 'string' ? detail : 'Activation failed')
      }
    } finally { setActivating(false) }
  }

  // Deactivate - NOW CONNECTED TO API
  const handleDeactivate = async () => {
    if (!company) return
    if (!window.confirm(`Are you sure you want to deactivate "${company.legal_name}"?`)) return
    setDeactivating(true); setShowActionsMenu(false)
    try {
      const updated = await deactivateCompany(company.id)
      setCompany(updated); setStatusField(updated.status)
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Deactivation failed')
    } finally { setDeactivating(false) }
  }

  // Seed Holidays
  const handleSeedHolidays = async () => {
    if (!company) return
    setSeedingHolidays(true); setHolidaysSeedMsg(null)
    try {
      const result = await seedHolidays(company.id)
      setHolidaysSeedMsg(result.message)
      setTimeout(() => setHolidaysSeedMsg(null), 5000)
      // Refresh holidays list
      const hols = await listHolidays(company.id)
      setHolidays(hols)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Failed to seed holidays')
    } finally { setSeedingHolidays(false) }
  }

  // Add a single public holiday
  const handleAddHoliday = async () => {
    if (!company) return
    if (!newHolidayDate) { setSaveError('Holiday date is required'); return }
    setAddingHoliday(true); setSaveError(null)
    try {
      await createHoliday(company.id, { holiday_date: newHolidayDate, description: newHolidayDesc.trim() || undefined, holiday_type: newHolidayType })
      const hols = await listHolidays(company.id)
      setHolidays(hols)
      setNewHolidayDate(''); setNewHolidayDesc(''); setNewHolidayType('Central'); setShowAddHoliday(false)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Failed to add holiday')
    } finally { setAddingHoliday(false) }
  }

  // Delete a single public holiday
  const handleDeleteHoliday = async (holidayId: string) => {
    if (!company) return
    if (!window.confirm('Remove this holiday?')) return
    try {
      await deleteHoliday(company.id, holidayId)
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId))
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Failed to delete holiday')
    }
  }


  // Delete entire company
  // Logo upload / delete — works for NEW (pending) and SAVED companies
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // New company: store as pending, show preview via data URL
    if (!company) {
      setPendingLogoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setLogoUrl(ev.target?.result as string)
      reader.readAsDataURL(file)
      return
    }

    // Saved company: upload immediately
    setUploadingLogo(true)
    try {
      const res = await uploadCompanyLogo(company.id, file)
      setLogoUrl(res.logo_url)
      setPendingLogoFile(null)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail || 'Logo upload failed')
    } finally { setUploadingLogo(false) }
  }

  const handleLogoDelete = async () => {
    // New company with pending logo: just clear it
    if (!company) {
      setPendingLogoFile(null)
      setLogoUrl(null)
      return
    }
    if (!logoUrl) return
    if (!window.confirm('Delete company logo?')) return
    try { await deleteCompanyLogo(company.id); setLogoUrl(null) }
    catch { alert('Failed to delete logo') }
  }


  // Certificate upload handler for header - supports pending and saved
  const handleCertUpload = async (certType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // For new companies, store as pending
    if (!company) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPendingCerts(prev => {
          const filtered = prev.filter(c => c.type !== certType)
          return [...filtered, { type: certType, file, preview: ev.target?.result as string }]
        })
      }
      reader.readAsDataURL(file)
      return
    }
    
    // For saved companies, create document and upload file
    try {
      const doc = await createCompanyDocument(company.id, {
        doc_type: certType + ' Certificate',
        issue_date: new Date().toISOString().slice(0, 10),
        status: 'Active'
      })
      await uploadDocumentFile(company.id, doc.id, file)
      // Refresh docs
      const docs = await listCompanyDocuments(company.id)
      setCompanyDocs(docs)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail || 'Certificate upload failed')
    }
  }

  // Per-row upload/replace for any document in the Documents tab table (not
  // just the 4 hardcoded header cert slots handled by handleCertUpload).
  const handleDocFileUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !company) return
    try {
      const updated = await uploadDocumentFile(company.id, docId, file)
      setCompanyDocs(prev => prev.map(d => (d.id === docId ? updated : d)))
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail || 'File upload failed')
    } finally {
      e.target.value = ''
    }
  }

  const handleCertDelete = async (certType: string, savedDoc?: CompanyDocument) => {
    setPendingCerts(prev => prev.filter(c => c.type !== certType))
    if (!savedDoc || !company) return
    if (!window.confirm('Remove the saved ' + certType + ' certificate?')) return
    try {
      await deleteCompanyDocument(company.id, savedDoc.id)
      setCompanyDocs(prev => prev.filter(d => d.id !== savedDoc.id))
    } catch {
      alert('Failed to delete certificate')
    }
  }

  const handleDeleteCompany = async () => {
    if (!company) return
    if (!window.confirm('Delete company ' + company.legal_name + ' (' + company.company_code + ')?\n\nThis action cannot be undone.')) return
    setShowActionsMenu(false)
    try {
      await deleteCompany(company.id)
      navigate('/masters/company')
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Failed to delete company')
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!company) return
    if (!window.confirm('Delete this document?')) return
    try {
      await deleteCompanyDocument(company.id, docId)
      setCompanyDocs((prev) => prev.filter((d) => d.id !== docId))
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Failed to delete')
    }
  }

  // Delete plant
  const handleDeletePlant = async (plantId: string, plantCode: string) => {
    if (!company) return
    if (!window.confirm(`Delete plant "${plantCode}"? This cannot be undone.`)) return
    try {
      await deletePlant(company.id, plantId)
      setPlants((prev) => prev.filter((p) => p.id !== plantId))
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Failed to delete plant')
    }
  }

  // Delete doc numbering - NOW FUNCTIONAL
  const handleDeleteDocNumbering = async (configId: string) => {
    if (!company) return
    if (!window.confirm('Delete this numbering configuration?')) return
    try {
      await deleteDocNumbering(company.id, configId)
      setDocNumberingConfigs((prev) => prev.filter((c) => c.id !== configId))
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axErr?.response?.data?.detail ?? 'Failed to delete')
    }
  }

  // Loading/Error states
  if (loading) return <div className="max-w-7xl"><div className="animate-pulse bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">Loading company...</div></div>
  if (loadError) return <div className="max-w-7xl"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">{loadError}</div></div>

  const currentStatus = company?.status ?? statusField ?? 'Draft'

  // ---------------------------------------------------------------------------
  // Render — List View (no id in URL)
  // ---------------------------------------------------------------------------
  if (!id) {
    const statusColor: Record<string, string> = {
      Active: 'bg-green-100 text-green-700',
      Draft: 'bg-gray-100 text-gray-600',
      Inactive: 'bg-red-100 text-red-600',
    }
    const COMPANY_STATUS_OPTIONS = [
      { value: '', label: 'All statuses' },
      { value: 'Active', label: 'Active' },
      { value: 'Draft', label: 'Draft' },
      { value: 'Inactive', label: 'Inactive' },
    ]
    const visibleCompanies = companiesList.filter((c) => {
      const q = companySearch.trim().toLowerCase()
      const matchesSearch = !q || [c.company_code, c.legal_name, c.company_type, c.industry].some((v) => (v ?? '').toLowerCase().includes(q))
      const matchesStatus = !companyStatus || c.status === companyStatus
      return matchesSearch && matchesStatus
    })
    const exportCompaniesCsv = () => {
      const header = ['Code', 'Legal Name', 'Type', 'Industry', 'Currency', 'Status']
      const rows = visibleCompanies.map((c) => [c.company_code, c.legal_name, c.company_type, c.industry, c.base_currency, c.status])
      const csv = [header, ...rows].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'companies.csv'; a.click()
      URL.revokeObjectURL(url)
    }
    return (
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Company Master</h1>
            <p className="text-xs text-gray-500 mt-0.5">{companiesList.length} compan{companiesList.length === 1 ? 'y' : 'ies'} registered</p>
          </div>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/masters/company/new')}>New Company</Button>
        </div>

        {/* Filters + Export */}
        {companiesList.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-sm">
              <input
                type="search"
                placeholder="Search by code, name or industry..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-400"
              />
            </div>
            <div className="w-44">
              <Select options={COMPANY_STATUS_OPTIONS} value={companyStatus} onChange={(e) => setCompanyStatus(e.target.value)} />
            </div>
            <span className="text-xs text-gray-500 ml-auto">{visibleCompanies.length} records</span>
            <button
              onClick={exportCompaniesCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export CSV"
            >
              <Download size={14} /> Export
            </button>
          </div>
        )}

        {loadError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{loadError}</div>}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">Loading companies...</div>
        ) : companiesList.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No companies yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Create your first company to get started</p>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/masters/company/new')}>New Company</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Code', 'Legal Name', 'Type', 'Industry', 'Currency', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-gray-400">No companies match your search.</td>
                  </tr>
                ) : visibleCompanies.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/masters/company/${c.id}`)}
                  >
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#204577]">{c.company_code}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{c.legal_name}</td>
                    <td className="py-3 px-4 text-gray-600">{c.company_type}</td>
                    <td className="py-3 px-4 text-gray-600">{c.industry}</td>
                    <td className="py-3 px-4 text-gray-600">{c.base_currency}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          className="text-xs text-[#005c87] hover:underline font-medium"
                          onClick={(e) => { e.stopPropagation(); navigate(`/masters/company/${c.id}`) }}
                        >
                          Open →
                        </button>
                        <button
                          title="Delete company"
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!window.confirm(`Delete company "${c.legal_name}" (${c.company_code})?\n\nThis action cannot be undone.`)) return
                            deleteCompany(c.id)
                              .then(() => setCompaniesList((prev) => prev.filter((x) => x.id !== c.id)))
                              .catch((err: unknown) => {
                                const axErr = err as { response?: { data?: { detail?: string } } }
                                alert(axErr?.response?.data?.detail ?? 'Failed to delete company')
                              })
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render — Detail / Create View (id present)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-0">
      <button onClick={() => navigate('/masters/company')} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-2">
        <ArrowLeft size={14} /> Back to Companies
      </button>
      {/* ── Company Header ───────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-t-xl">
        {/* Top row: logo | company info | cert badges | actions */}
        <div className="px-5 py-4 flex items-center gap-4 min-h-[96px]">

          {/* 1. Logo (80×80) with hover-upload */}
          <div className="relative flex-none group" style={{width:80,height:80}}>
            <div className="w-full h-full rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              {logoUrl
                ? <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
                : <Building2 size={30} className="text-[#204577]" />
              }
            </div>
            {/* Upload overlay — always visible on hover */}
            <label className="absolute inset-0 rounded-lg cursor-pointer flex flex-col items-center justify-center gap-0.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload size={14} className="text-white" />
              <span className="text-white text-[10px] font-medium">{uploadingLogo ? "Uploading…" : "Upload Logo"}</span>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
            {logoUrl && (
              <button
                onClick={handleLogoDelete}
                title="Remove logo"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>

          {/* 2. Company name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#204577] leading-tight truncate max-w-sm">
                {legalName || "New Company"}
              </h1>
              <StateMachineBadge state={currentStatus} />
            </div>
            <div className="mt-1.5 flex items-center gap-0 text-xs text-gray-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span className="font-medium text-gray-400">Company Code</span>
                <span className="mx-1 text-gray-300">:</span>
                <span className="font-semibold text-gray-700">{companyCode || <em className="not-italic text-gray-300">—</em>}</span>
              </span>
              <span className="mx-3 text-gray-300 select-none">|</span>
              <span className="inline-flex items-center gap-1">
                <span className="font-medium text-gray-400">CIN</span>
                <span className="mx-1 text-gray-300">:</span>
                <span className="font-mono text-gray-700">{cinNumber || <em className="not-italic text-gray-300">—</em>}</span>
              </span>
              <span className="mx-3 text-gray-300 select-none">|</span>
              <span className="inline-flex items-center gap-1">
                <span className="font-medium text-gray-400">Financial Year</span>
                <span className="mx-1 text-gray-300">:</span>
                <span className="font-medium text-gray-700">{financialYearStart || "01 Apr – 31 Mar"}</span>
              </span>
            </div>
          </div>

          {/* 3. Certificate upload slots - ALWAYS visible */}
          <div className="flex items-center gap-3 flex-none">
            {['COI', 'NADCAP', 'AS9100', 'ISO'].map(certType => {
              const pending = pendingCerts.find(c => c.type === certType)
              const saved = companyDocs.find(d => 
                d.doc_type?.toLowerCase().includes(certType.toLowerCase()) ||
                (certType === 'AS9100' && d.doc_type?.toLowerCase().includes('as 9100'))
              )
              const hasFile = pending?.preview || saved?.file_path
              const fileName = pending?.file?.name || saved?.file_name || ''
              const isPdf = /\.pdf$/i.test(fileName) || pending?.file?.type === 'application/pdf' || saved?.file_mime_type === 'application/pdf'
              
              return (
                <div key={certType} className="relative group/cert flex-none" title={certType + ' Certificate'}>
                  <div className="h-14 w-[72px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md bg-gray-50 overflow-hidden hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    {hasFile && !isPdf ? (
                      <img 
                        src={pending?.preview || saved?.file_path || ''} 
                        alt={certType} 
                        className="w-full h-full object-contain"
                      />
                    ) : hasFile && isPdf ? (
                      <a
                        href={saved?.file_path || undefined}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => { if (!saved?.file_path) e.preventDefault() }}
                        className="flex flex-col items-center justify-center h-full w-full text-[#005c87]"
                      >
                        <FileText size={16} />
                        <span className="text-[8px] font-semibold mt-0.5">{certType} PDF</span>
                      </a>
                    ) : (
                      <>
                        <Upload size={12} className="text-gray-400 mb-0.5" />
                        <span className="text-[9px] font-semibold text-gray-500">{certType}</span>
                      </>
                    )}
                    <label className="absolute inset-0 cursor-pointer" style={{ pointerEvents: hasFile && isPdf ? 'none' : 'auto' }}>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/svg+xml,application/pdf" 
                        className="hidden" 
                        onChange={(e) => handleCertUpload(certType, e)} 
                      />
                    </label>
                  </div>
                  {(pending || saved) && (
                    <button
                      onClick={() => handleCertDelete(certType, saved)}
                      title={'Remove ' + certType}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/cert:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 size={8} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>


          {/* 4. Action buttons */}
          <div className="flex items-center gap-2 flex-none ml-auto">
            {company && currentStatus !== "Active" && (
              <Button variant="primary" size="sm" onClick={handleActivate} loading={activating}>
                Activate
              </Button>
            )}
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={() => setShowActionsMenu(p => !p)}>
                Actions <ChevronDown size={12} />
              </Button>
              {showActionsMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                  {company && (
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2" onClick={handleSeedHolidays}>
                      <Calendar size={13} />{seedingHolidays ? "Seeding…" : "Seed Holidays"}
                    </button>
                  )}
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700" onClick={() => { setShowActionsMenu(false); navigate("/masters/company/new") }}>
                    Duplicate
                  </button>
                  {company && currentStatus === "Active" && (
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600" onClick={handleDeactivate} disabled={deactivating}>
                      {deactivating ? "Deactivating…" : "Deactivate"}
                    </button>
                  )}
                  {company && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-700 flex items-center gap-2" onClick={handleDeleteCompany}>
                        <Trash2 size={13} /> Delete Company
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {holidaysSeedMsg && (
          <div className="mx-5 mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 flex items-center gap-2">
            <Calendar size={13} />{holidaysSeedMsg}
          </div>
        )}
      </div>
      {/* Tab Bar */}
      <div className="bg-white border-x border-b border-gray-200">
        <div className="flex flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-2.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? 'border-[#005c87] text-[#005c87]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-50 border-x border-b border-gray-200 rounded-b-xl p-4 space-y-4">
        {/* General Tab */}
        {activeTab === 'general' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Info size={14} className="text-[#005c87]" /> GSTIN Verification</h2>
              </div>
              <div className="flex gap-3 items-end mt-3">
                <div className="flex-1 max-w-sm">
                  <GSTINInput label="GSTIN" value={gstinLookupValue} onChange={setGstinLookupValue} />
                </div>
                <Button variant="primary" onClick={handleGstinLookup} loading={gstinLookupLoading} disabled={!gstinLookupValue.trim()}>Verify</Button>
              </div>
              {gstinLookupError && <p className="mt-2 text-xs text-red-600">{gstinLookupError}</p>}
              {gstinLookupResult && (
                <div className={`mt-4 rounded-xl border p-4 ${gstinLookupResult.confidence >= 1.0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {gstinLookupResult.confidence >= 1.0 ? "✓ Verified — Form fields populated from live GST registry" : "⚠ Format valid — State & PAN decoded. Enter remaining fields manually."}
                      </span>
                      <ConfidenceBadge score={gstinLookupResult.confidence} />
                    </div>
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border">{gstinLookupResult.source}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                    {[
                      { label: "Company Name", val: gstinLookupResult.legal_name, bold: true },
                      { label: "PAN (derived)", val: gstinLookupValue.trim().substring(2, 12), mono: true },
                      { label: "State", val: gstinLookupResult.state_name ?? gstinLookupResult.state_code },
                      { label: "GST Status", val: gstinLookupResult.status, color: gstinLookupResult.status === "Active" ? "text-green-700" : "text-red-600" },
                      { label: "Taxpayer Type", val: gstinLookupResult.taxpayer_type },
                      { label: "Reg. Date", val: gstinLookupResult.registration_date },
                      { label: "PIN Code", val: gstinLookupResult.pincode, mono: true },
                      { label: "Constitution", val: gstinLookupResult.business_constitution },
                      { label: "Trade Name", val: gstinLookupResult.trade_name !== gstinLookupResult.legal_name ? gstinLookupResult.trade_name : null },
                    ].filter(f => f.val).map(f => (
                      <div key={f.label} className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="text-gray-400 mb-0.5">{f.label}</div>
                        <div className={`font-medium truncate ${f.mono ? "font-mono" : ""} ${f.color ?? "text-gray-800"} ${f.bold ? "font-semibold" : ""}`} title={f.val ?? ""}>{f.val}</div>
                      </div>
                    ))}
                    {gstinLookupResult.registered_address && (
                      <div className="bg-white rounded-lg p-2 border border-gray-100 col-span-2">
                        <div className="text-gray-400 mb-0.5">Registered Address</div>
                        <div className="font-medium text-gray-800 text-[10px] leading-tight">{gstinLookupResult.registered_address}</div>
                      </div>
                    )}
                  </div>
                  {gstinLookupResult.message && (
                    <p className="mt-2 text-[10px] text-amber-700 bg-amber-100 rounded px-2 py-1">{gstinLookupResult.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <SectionCard icon={<Info size={13} className="text-blue-600" />} title="Basic Information" color="bg-blue-50/60">
                <FieldRow label="Company Code" required><input value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} disabled={!!company} maxLength={6} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-mono disabled:bg-gray-50" /></FieldRow>
                <FieldRow label="Company Name" required><input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Short Name"><input value={shortName} onChange={(e) => setShortName(e.target.value)} maxLength={50} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="CIN">
                  <div className="relative">
                    <input 
                      value={cinNumber} 
                      onChange={(e) => setCinNumber(e.target.value.toUpperCase())} 
                      maxLength={21} 
                      placeholder="L17110MH1973PLC019786"
                      className={`w-full border rounded px-2 py-0.5 text-xs font-mono ${cinNumber && !isValidCIN(cinNumber) ? 'border-red-300 bg-red-50' : cinNumber && isValidCIN(cinNumber) ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                    />
                    {cinNumber && (
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${isValidCIN(cinNumber) ? 'text-green-600' : 'text-red-500'}`}>
                        {isValidCIN(cinNumber) ? '✓ Valid' : '✗ Invalid format'}
                      </span>
                    )}
                  </div>
                </FieldRow>
                <FieldRow label="Company Type" required><select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{COMPANY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
                <FieldRow label="Incorp. Date"><input type="date" value={incorporationDate} onChange={(e) => setIncorporationDate(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Status"><select value={statusField} onChange={(e) => setStatusField(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
              </SectionCard>

              <SectionCard icon={<Shield size={13} className="text-green-600" />} title="Registration" color="bg-green-50/60">
                <FieldRow label="PAN"><input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-mono" /></FieldRow>
                <FieldRow label="GSTIN"><input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={15} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-mono" /></FieldRow>
                <FieldRow label="TAN"><input value={tan} onChange={(e) => setTan(e.target.value.toUpperCase())} maxLength={10} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-mono" /></FieldRow>
                <FieldRow label="IEC"><input value={iecCode} onChange={(e) => setIecCode(e.target.value.toUpperCase())} maxLength={10} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs font-mono" /></FieldRow>
                <FieldRow label="MSME"><input value={msmeRegistration} onChange={(e) => setMsmeRegistration(e.target.value)} maxLength={30} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="PF No."><input value={pfNumber} onChange={(e) => setPfNumber(e.target.value.toUpperCase())} maxLength={30} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="ESI No."><input value={esiNumber} onChange={(e) => setEsiNumber(e.target.value)} maxLength={20} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Prof. Tax No."><input value={professionTaxNo} onChange={(e) => setProfessionTaxNo(e.target.value)} maxLength={30} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
              </SectionCard>

              <SectionCard icon={<IndianRupee size={13} className="text-amber-600" />} title="Financial" color="bg-amber-50/60">
                <FieldRow label="Currency"><select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{CURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
                <FieldRow label="FY Start"><select value={financialYearStart} onChange={(e) => setFinancialYearStart(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{FINANCIAL_YEAR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
                <FieldRow label="TDS"><select value={tdsApplicable} onChange={(e) => setTdsApplicable(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{YES_NO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
                <FieldRow label="TCS"><select value={tcsApplicable} onChange={(e) => setTcsApplicable(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{YES_NO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
                <FieldRow label="Accounting"><select value={accountingStandard} onChange={(e) => setAccountingStandard(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{ACCOUNTING_STANDARD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
                <FieldRow label="Costing"><select value={costMethod} onChange={(e) => setCostMethod(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white">{COSTING_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldRow>
              </SectionCard>

              <SectionCard icon={<Phone size={13} className="text-purple-600" />} title="Contact" color="bg-purple-50/60">
                <FieldRow label="Phone"><input value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Mobile"><input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Alt Email"><input type="email" value={alternateEmail} onChange={(e) => setAlternateEmail(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Fax"><input value={faxNo} onChange={(e) => setFaxNo(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
                <FieldRow label="Website"><input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs" /></FieldRow>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Registered Address</h3>
                <div className="space-y-3.5">
                  <Input label="Address Line 1" value={regAddrLine1} onChange={(e) => setRegAddrLine1(e.target.value)} />
                  <Input label="Address Line 2" value={regAddrLine2} onChange={(e) => setRegAddrLine2(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="City" value={regCity} onChange={(e) => setRegCity(e.target.value)} />
                    <Select label="State" options={INDIAN_STATES} value={regState} onChange={(e) => setRegState(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Country" options={COUNTRY_OPTIONS} value={regCountry} onChange={(e) => setRegCountry(e.target.value)} />
                    <Input label="PIN" value={regPin} onChange={(e) => setRegPin(e.target.value)} maxLength={6} className="font-mono" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Corporate Address</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={corpSameAsReg} onChange={(e) => setCorpSameAsReg(e.target.checked)} className="w-4 h-4 rounded" />
                    Same as Registered
                  </label>
                </div>
                <div className="space-y-3.5">
                  <Input label="Address Line 1" value={corpAddrLine1} onChange={(e) => setCorpAddrLine1(e.target.value)} disabled={corpSameAsReg} />
                  <Input label="Address Line 2" value={corpAddrLine2} onChange={(e) => setCorpAddrLine2(e.target.value)} disabled={corpSameAsReg} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="City" value={corpCity} onChange={(e) => setCorpCity(e.target.value)} disabled={corpSameAsReg} />
                    <Select label="State" options={INDIAN_STATES} value={corpState} onChange={(e) => setCorpState(e.target.value)} disabled={corpSameAsReg} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Country" options={COUNTRY_OPTIONS} value={corpCountry} onChange={(e) => setCorpCountry(e.target.value)} disabled={corpSameAsReg} />
                    <Input label="PIN" value={corpPin} onChange={(e) => setCorpPin(e.target.value)} disabled={corpSameAsReg} maxLength={6} className="font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Banking Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                <Input label="Branch" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
                <Input label="Account No." value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="font-mono" />
                <Select label="Account Type" options={BANK_ACCOUNT_TYPE_OPTIONS} value={bankAccountType} onChange={(e) => setBankAccountType(e.target.value)} />
                <Input label="IFSC" value={bankIfscCode} onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())} className="font-mono" maxLength={11} />
                <Input label="MICR" value={bankMicrCode} onChange={(e) => setBankMicrCode(e.target.value)} className="font-mono" maxLength={9} />
                <Input label="UPI ID" value={bankUpiId} onChange={(e) => setBankUpiId(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Phone No." value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} />
              <Input label="Mobile No." value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Alternate Email" type="email" value={alternateEmail} onChange={(e) => setAlternateEmail(e.target.value)} />
              <Input label="Fax No." value={faxNo} onChange={(e) => setFaxNo(e.target.value)} />
              <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>
        )}

        {/* Address Tab */}
        {activeTab === 'address' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Registered Address</h3>
              <div className="space-y-3.5">
                <Input label="Address Line 1" value={regAddrLine1} onChange={(e) => setRegAddrLine1(e.target.value)} />
                <Input label="Address Line 2" value={regAddrLine2} onChange={(e) => setRegAddrLine2(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" value={regCity} onChange={(e) => setRegCity(e.target.value)} />
                  <Select label="State" options={INDIAN_STATES} value={regState} onChange={(e) => setRegState(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Country" options={COUNTRY_OPTIONS} value={regCountry} onChange={(e) => setRegCountry(e.target.value)} />
                  <Input label="PIN" value={regPin} onChange={(e) => setRegPin(e.target.value)} maxLength={6} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Corporate Address</h3>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={corpSameAsReg} onChange={(e) => setCorpSameAsReg(e.target.checked)} className="w-4 h-4 rounded" />
                  Same as Registered
                </label>
              </div>
              <div className="space-y-3.5">
                <Input label="Address Line 1" value={corpAddrLine1} onChange={(e) => setCorpAddrLine1(e.target.value)} disabled={corpSameAsReg} />
                <Input label="Address Line 2" value={corpAddrLine2} onChange={(e) => setCorpAddrLine2(e.target.value)} disabled={corpSameAsReg} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" value={corpCity} onChange={(e) => setCorpCity(e.target.value)} disabled={corpSameAsReg} />
                  <Select label="State" options={INDIAN_STATES} value={corpState} onChange={(e) => setCorpState(e.target.value)} disabled={corpSameAsReg} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Country" options={COUNTRY_OPTIONS} value={corpCountry} onChange={(e) => setCorpCountry(e.target.value)} disabled={corpSameAsReg} />
                  <Input label="PIN" value={corpPin} onChange={(e) => setCorpPin(e.target.value)} disabled={corpSameAsReg} maxLength={6} className="font-mono" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banking Tab */}
        {activeTab === 'banking' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Banking Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <Input label="Branch" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
              <Input label="Account No." value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="font-mono" />
              <Select label="Account Type" options={BANK_ACCOUNT_TYPE_OPTIONS} value={bankAccountType} onChange={(e) => setBankAccountType(e.target.value)} />
              <Input label="IFSC Code" value={bankIfscCode} onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())} className="font-mono" maxLength={11} />
              <Input label="MICR Code" value={bankMicrCode} onChange={(e) => setBankMicrCode(e.target.value)} className="font-mono" maxLength={9} />
              <Input label="UPI ID" value={bankUpiId} onChange={(e) => setBankUpiId(e.target.value)} />
            </div>
          </div>
        )}

        {/* Factory Tab */}
        {activeTab === 'factory' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Factory Licence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Factory Licence No." value={factoryLicenceNumber} onChange={(e) => setFactoryLicenceNumber(e.target.value.toUpperCase())} />
                <Input label="Date of Issue" type="date" value={factoryLicenceDate} onChange={(e) => setFactoryLicenceDate(e.target.value)} />
                <Input label="Valid Upto" type="date" value={factoryLicenceValidUpto} onChange={(e) => setFactoryLicenceValidUpto(e.target.value)} />
                <Input label="Issuing Authority" value={factoryLicenceIssuingAuthority} onChange={(e) => setFactoryLicenceIssuingAuthority(e.target.value)} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">KSPCB / Environment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="KSPCB Consent No." value={kspcbConsentNumber} onChange={(e) => setKspcbConsentNumber(e.target.value)} />
                <Input label="KSPCB Consent Valid Upto" type="date" value={kspcbConsentValidUpto} onChange={(e) => setKspcbConsentValidUpto(e.target.value)} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Certifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="AS9100 Certificate No." value={as9100CertNumber} onChange={(e) => setAs9100CertNumber(e.target.value)} className="font-mono" />
                <Input label="AS9100 Valid Upto" type="date" value={as9100CertValidUpto} onChange={(e) => setAs9100CertValidUpto(e.target.value)} />
                <Input label="NADCAP Certificate No." value={nadcapCertNumber} onChange={(e) => setNadcapCertNumber(e.target.value)} className="font-mono" />
                <Input label="NADCAP Valid Upto" type="date" value={nadcapCertValidUpto} onChange={(e) => setNadcapCertValidUpto(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Statutory Tab */}
        {activeTab === 'statutory' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Statutory & Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="PAN" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} className="font-mono" />
              <Input label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={15} className="font-mono" />
              <Input label="TAN" value={tan} onChange={(e) => setTan(e.target.value.toUpperCase())} maxLength={10} className="font-mono" />
              <Input label="IEC Code" value={iecCode} onChange={(e) => setIecCode(e.target.value.toUpperCase())} maxLength={10} className="font-mono" />
              <Input label="MSME Registration" value={msmeRegistration} onChange={(e) => setMsmeRegistration(e.target.value)} maxLength={30} />
              <Input label="PF Number" value={pfNumber} onChange={(e) => setPfNumber(e.target.value.toUpperCase())} maxLength={30} />
              <Input label="ESI Number" value={esiNumber} onChange={(e) => setEsiNumber(e.target.value)} maxLength={20} />
              <Input label="Profession Tax No." value={professionTaxNo} onChange={(e) => setProfessionTaxNo(e.target.value)} maxLength={30} />
            </div>
          </div>
        )}

        {/* Business Tab */}
        {activeTab === 'business' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Business Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Industry" options={INDUSTRY_OPTIONS} value={industry} onChange={(e) => setIndustry(e.target.value)} required />
              <Select label="Business Type" options={BUSINESS_TYPE_OPTIONS} value={businessType} onChange={(e) => setBusinessType(e.target.value)} required />
              <Select label="Country" options={COUNTRY_OPTIONS} value={country} onChange={(e) => setCountry(e.target.value)} />
              <Select label="Currency" options={CURRENCY_OPTIONS} value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} />
              <Select label="Financial Year" options={FINANCIAL_YEAR_OPTIONS} value={financialYearStart} onChange={(e) => setFinancialYearStart(e.target.value)} />
              <Select label="Accounting Standard" options={ACCOUNTING_STANDARD_OPTIONS} value={accountingStandard} onChange={(e) => setAccountingStandard(e.target.value)} />
            </div>
          </div>
        )}

        {/* Documents Tab - NOW CONNECTED TO API */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">Documents & Certifications</h2>
              {company && <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAddDocument(true)}>Add Document</Button>}
            </div>
            {companyDocs.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No documents. Click "Add Document" to add one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50 border-b border-gray-200">
                    {['Type', 'Number', 'Rev', 'Issue', 'Expiry', 'Authority', 'Status', 'Action'].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {companyDocs.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{doc.doc_type}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{doc.doc_number || '-'}</td>
                        <td className="py-2.5 px-3 text-gray-500">{doc.revision || '-'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{doc.issue_date ? formatDate(doc.issue_date) : '-'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{doc.expiry_date ? formatDate(doc.expiry_date) : '-'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{doc.issuing_authority || '-'}</td>
                        <td className="py-2.5 px-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${DOC_STATUS_CLASSES[doc.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{doc.status}</span></td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {doc.file_path && (
                              <a href={doc.file_path} target="_blank" rel="noreferrer" title={doc.file_name || 'View file'}>
                                <FileText size={13} className="text-[#005c87] hover:text-blue-600" />
                              </a>
                            )}
                            <label className="cursor-pointer" title={doc.file_path ? 'Replace file' : 'Upload file'}>
                              <Upload size={13} className="text-gray-400 hover:text-blue-500" />
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,application/pdf"
                                className="hidden"
                                onChange={(e) => handleDocFileUpload(doc.id, e)}
                              />
                            </label>
                            <button title="Edit" onClick={() => { setEditingDoc(doc); setShowEditDocument(true) }}><Pencil size={13} className="text-gray-400 hover:text-blue-500" /></button>
                            <button title="Delete" onClick={() => handleDeleteDocument(doc.id)}><Trash2 size={13} className="text-gray-400 hover:text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg py-6 text-sm text-gray-400 hover:border-[#005c87] cursor-pointer" onClick={() => company && setShowAddDocument(true)}>
                <Upload size={20} className="mx-auto mb-1 text-gray-400" />Click to add a document
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Audit Trail & Notes</h2>
            <div className="space-y-4">
              <Textarea label="Notes" rows={4} placeholder="Add internal notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div><p className="text-xs text-gray-500 mb-0.5">Created By</p><p className="text-sm font-medium text-gray-700">{company?.created_by ?? '-'}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Created On</p><p className="text-sm font-medium text-gray-700">{company?.created_at ? formatDate(company.created_at) : '-'}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Modified By</p><p className="text-sm font-medium text-gray-700">{company?.updated_by ?? '-'}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Modified On</p><p className="text-sm font-medium text-gray-700">{company?.updated_at ? formatDate(company.updated_at) : '-'}</p></div>
              </div>
              {company && (
                <div className="pt-4 border-t border-gray-100">
                  <AuditTrailPanel
                    entries={[
                      company.created_at
                        ? { user: String(company.created_by ?? 'System'), action: 'Company created', timestamp: company.created_at }
                        : null,
                      company.updated_at && company.updated_at !== company.created_at
                        ? { user: String(company.updated_by ?? 'System'), action: `Company updated — status: ${company.status}`, timestamp: company.updated_at }
                        : null,
                    ].filter(Boolean) as import('../../components/ui').AuditEntry[]}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configuration Tab - NOW WITH DOCUMENT NUMBERING */}
        {activeTab === 'config' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Plant Master</h2>
                {company && <Button variant="secondary" size="sm" onClick={() => setShowAddPlant(true)} icon={<Plus size={13} />}>Add Plant</Button>}
              </div>
              {plants.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No plants added.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm"><thead><tr className="border-b border-gray-200">
                    {['Code', 'Name', 'GSTIN', 'Cost Centre', 'Created', ''].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {plants.map((plant) => (
                      <tr key={plant.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{plant.plant_code}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800">{plant.plant_name}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{plant.gstin ?? '-'}</td>
                        <td className="py-2.5 px-3 text-gray-500">{plant.cost_centre ?? '-'}</td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs">{plant.created_at ? formatDate(plant.created_at) : '-'}</td>
                        <td className="py-2.5 px-3">
                          <button title="Delete plant" onClick={() => handleDeletePlant(plant.id, plant.plant_code)}>
                            <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Document Numbering</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Auto-numbering for RFQ, PO, SO, NCR, etc.</p>
                </div>
                {company && <Button variant="secondary" size="sm" onClick={() => setShowAddDocNumbering(true)} icon={<Plus size={13} />}>Add Numbering</Button>}
              </div>
              {docNumberingConfigs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No numbering configured.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm"><thead><tr className="border-b border-gray-200">
                    {['Type', 'Prefix', 'Year Format', 'Reset Policy', 'Current', 'Next Number', 'Action'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {docNumberingConfigs.map((config) => (
                      <tr key={config.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{config.doc_type}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{config.prefix}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{config.year_format ?? '-'}</td>
                        
                        <td className="py-2.5 px-3 text-gray-500 capitalize">{config.reset_policy ?? 'annual'}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{config.current_sequence}</td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-indigo-600">{nextDocNumberPreview(config)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <button title="Edit" onClick={() => { setEditingDocNumbering(config); setShowEditDocNumbering(true) }}><Pencil size={13} className="text-gray-400 hover:text-blue-500" /></button>
                            <button title="Delete" onClick={() => handleDeleteDocNumbering(config.id)}><Trash2 size={13} className="text-gray-400 hover:text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Clock size={14} className="text-indigo-500" /> Public Holidays</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{holidays.length} holiday{holidays.length !== 1 ? 's' : ''} configured</p>
                </div>
                {company && (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAddHoliday((v) => !v)}>Add Holiday</Button>
                    <Button variant="secondary" size="sm" icon={<Calendar size={13} />} onClick={handleSeedHolidays} loading={seedingHolidays}>
                      Seed 2025 &amp; 2026
                    </Button>
                  </div>
                )}
              </div>
              {showAddHoliday && company && (
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end bg-indigo-50/40 border border-indigo-100 rounded-lg p-3">
                  <Input label="Date" type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} required />
                  <Input label="Description" value={newHolidayDesc} onChange={(e) => setNewHolidayDesc(e.target.value)} placeholder="Republic Day" maxLength={100} />
                  <Select label="Type" options={[{ value: 'Central', label: 'Central' }, { value: 'State', label: 'State' }]} value={newHolidayType} onChange={(e) => setNewHolidayType(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleAddHoliday} loading={addingHoliday} disabled={!newHolidayDate}>Add</Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowAddHoliday(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              {holidays.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No holidays configured. Use "Seed 2025 &amp; 2026" to add central gazetted holidays.</p>
              ) : (
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-xs"><thead className="sticky top-0 bg-white"><tr className="border-b border-gray-200">
                    {['Date', 'Description', 'Type', 'Action'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {holidays.map((h) => (
                      <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono text-xs text-gray-700">{formatDate(h.holiday_date)}</td>
                        <td className="py-2 px-3 text-gray-700">{h.description ?? '-'}</td>
                        <td className="py-2 px-3"><span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">{h.holiday_type ?? 'Central'}</span></td>
                        <td className="py-2 px-3"><button title="Delete" onClick={() => handleDeleteHoliday(h.id)}><Trash2 size={13} className="text-gray-400 hover:text-red-500" /></button></td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-green-600">Saved successfully.</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleDiscard}>Discard Changes</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{company ? 'Save Changes' : 'Create Company'}</Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {company && (
        <>
          <AddPlantModal open={showAddPlant} onClose={() => setShowAddPlant(false)} onSaved={(plant) => setPlants((prev) => [...prev, plant])} companyId={company.id} />
          <AddDocumentModal open={showAddDocument} onClose={() => setShowAddDocument(false)} onSaved={(doc) => setCompanyDocs((prev) => [...prev, doc])} companyId={company.id} />
          <AddDocNumberingModal open={showAddDocNumbering} onClose={() => setShowAddDocNumbering(false)} onSaved={(config) => setDocNumberingConfigs((prev) => [...prev, config])} companyId={company.id} />
          <EditDocumentModal
            open={showEditDocument}
            onClose={() => { setShowEditDocument(false); setEditingDoc(null) }}
            onSaved={(updated) => { setCompanyDocs((prev) => prev.map((d) => d.id === updated.id ? updated : d)); setShowEditDocument(false); setEditingDoc(null) }}
            companyId={company.id}
            doc={editingDoc}
          />
          <EditDocNumberingModal
            open={showEditDocNumbering}
            onClose={() => { setShowEditDocNumbering(false); setEditingDocNumbering(null) }}
            onSaved={(updated) => { setDocNumberingConfigs((prev) => prev.map((c) => c.id === updated.id ? updated : c)); setShowEditDocNumbering(false); setEditingDocNumbering(null) }}
            companyId={company.id}
            config={editingDocNumbering}
          />
        </>
      )}
      <ActivationErrorModal open={showActivationError} onClose={() => setShowActivationError(false)} missing={activationMissing} />
    </div>
  )
}
