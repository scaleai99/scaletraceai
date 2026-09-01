/**
 * CustomerDetailPage - Module 02: Customer Master detail view.
 *
 * Layout matches the AIRBUS INDIA PVT LTD reference image exactly:
 *   - Header: logo + company name + Active badge + meta info + action buttons
 *   - 10 tabs: General Information | Address | Contact Details | Business Details |
 *              Commercial | Quality Requirements | Banking Information |
 *              Documents | Notes & Attachments | History
 *   - General Information: Basic Info + Registration only (each detail
 *     area — address, contacts, business, commercial, quality, banking —
 *     lives in its own dedicated tab; no duplicated boxes)
 *   - Linked Information section with 5 sub-tabs
 *   - Footer with audit info
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Building2, Plus, Shield, BarChart2, Link,
  Info, CheckCircle, XCircle, Trash2, ArrowLeft, ChevronDown,
  FileText, Download, X, Pencil, Loader2, Sparkles,
} from 'lucide-react'

import {
  Button, Input, Select, StateMachineBadge, GSTINInput, ConfidenceBadge,
} from '../../components/ui'
import { gstinLookup, GSTINLookupResponse } from '../../api/companyApi'
import { formatDate, validateGSTIN } from '../../lib/utils'
import {
  getCustomer,
  createCustomer,
  listCustomerContacts,
  addCustomerContact,
  deleteCustomerContact,
  updateCustomer,
  listCustomers,
  approveCustomer,
  deactivateCustomer,
  deleteCustomer,
  listCustomerDocuments,
  deleteCustomerDocument,
  createCustomerDocument,
  uploadCustomerDocumentFile,
  updateCustomerDocument,
  Customer,
  CustomerSite,
  CustomerDocument,
  AiExtractedFields,
} from '../../api/customerApi'

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
type TabId =
  | 'general'
  | 'address'
  | 'contacts'
  | 'business'
  | 'commercial'
  | 'quality'
  | 'banking'
  | 'documents'
  | 'notes'
  | 'history'

const CUSTOMER_DOC_TYPES = ['Customer Quality Manual', 'NDA', 'Specification Files', 'Approved Drawing List', 'PO Copy', 'AS9100 Certificate', 'NADCAP Certificate', 'Other']
const CUSTOMER_DOC_CATEGORIES = ['General', 'Certification']
const CUSTOMER_DOC_STATUSES = ['Active', 'Valid', 'Expiring Soon', 'Expired', 'Pending']

type DocFormState = {
  document_type: string; category: string; doc_number: string; revision: string
  issue_date: string; expiry_date: string; issuing_authority: string; status: string
}
const EMPTY_DOC_FORM: DocFormState = {
  document_type: 'Customer Quality Manual', category: 'General', doc_number: '', revision: '',
  issue_date: '', expiry_date: '', issuing_authority: '', status: 'Active',
}
interface PendingDoc { tempId: string; meta: DocFormState; file: File | null }

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General Information' },
  { id: 'address', label: 'Address' },
  { id: 'contacts', label: 'Contact Details' },
  { id: 'business', label: 'Business Details' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'quality', label: 'Quality Requirements' },
  { id: 'banking', label: 'Banking Information' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes & Attachments' },
  { id: 'history', label: 'History' },
]

// ---------------------------------------------------------------------------
// Linked sub-tabs
// ---------------------------------------------------------------------------
type LinkedTab = 'Customer Part Numbers' | 'Approved Part List' | 'Price List' | 'Contracts / Agreements' | 'Purchase Orders'
const LINKED_TABS: LinkedTab[] = [
  'Customer Part Numbers',
  'Approved Part List',
  'Price List',
  'Contracts / Agreements',
  'Purchase Orders',
]

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------
const CUSTOMER_TYPE_OPTIONS = [
  { value: '', label: '- Select Type -' },
  { value: 'OEM', label: 'OEM' },
  { value: 'Tier-1', label: 'Tier-1' },
  { value: 'Tier-2', label: 'Tier-2' },
  { value: 'Direct', label: 'Direct' },
]

const INDUSTRY_OPTIONS = [
  { value: '', label: '- Select Industry -' },
  { value: 'Aerospace', label: 'Aerospace' },
  { value: 'Defence', label: 'Defence' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'General Engineering', label: 'General Engineering' },
  { value: 'Other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

const BUSINESS_NATURE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Manufacturer', label: 'Manufacturer' },
  { value: 'Trader', label: 'Trader' },
  { value: 'Service Provider', label: 'Service Provider' },
  { value: 'OEM', label: 'OEM' },
]

const SUPPLY_TYPE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Parts Manufacturer', label: 'Parts Manufacturer' },
  { value: 'System Integrator', label: 'System Integrator' },
  { value: 'MRO', label: 'MRO' },
  { value: 'Raw Material', label: 'Raw Material' },
]

const PAYMENT_TERMS_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: '30 Days', label: '30 Days' },
  { value: '45 Days', label: '45 Days' },
  { value: '60 Days EOM', label: '60 Days EOM' },
  { value: '90 Days', label: '90 Days' },
  { value: 'Advance', label: 'Advance' },
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
]

const INDIAN_STATES = [
  { value: '', label: '- Select State -' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Delhi', label: 'Delhi' },
]

const COUNTRY_OPTIONS = [
  { value: 'India', label: 'India' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Japan', label: 'Japan' },
]

const BANK_ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Current Account', label: 'Current Account' },
  { value: 'Savings Account', label: 'Savings Account' },
  { value: 'Cash Credit', label: 'Cash Credit' },
  { value: 'Overdraft', label: 'Overdraft' },
]

const QA_APPROVAL_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Conditional', label: 'Conditional' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Rejected', label: 'Rejected' },
]

const YES_NO_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

/** Section card with colored header stripe */
function SectionCard({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200"
      style={{
        alignSelf: 'start',
        height: 'auto',
        maxHeight: 'fit-content',
      }}
    >
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 ${color}`}>
        <span>{icon}</span>
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

/** Compact label + field row */
function FieldRow({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center min-h-[30px] px-3 py-1">
      <span className="text-[11px] text-gray-500 shrink-0 w-[110px] leading-tight">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

/** Compact text input styled for FieldRow */
function FieldInput({
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className="w-full text-xs text-gray-800 bg-transparent border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none py-0.5 px-0 placeholder-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
    />
  )
}

/** Compact select styled for FieldRow */
function FieldSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xs text-gray-800 bg-transparent border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none py-0.5 px-0"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Key Personnel contact row type */
interface KeyContact {
  id?: string
  name: string
  designation: string
  email: string
  phone: string
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  // Data state
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [documents, setDocuments] = useState<CustomerDocument[]>([])
  const [notesText, setNotesText] = useState('')
  const [showDocModal, setShowDocModal] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [docForm, setDocForm] = useState<DocFormState>({ ...EMPTY_DOC_FORM })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([])
  const [notesAttaching, setNotesAttaching] = useState(false)
  const [aiFields, setAiFields] = useState<AiExtractedFields | null>(null)

  const loadDocuments = async () => {
    if (!id || id === 'new') return
    try { setDocuments(await listCustomerDocuments(id)) } catch { /* keep existing */ }
  }

  // Poll while any document's AI read is still running in the background
  // (extraction_status === 'pending'). Self-terminates once nothing is
  // pending or after ~1 minute, so a stuck/slow extraction doesn't poll
  // forever. Uses a ref so the interval doesn't get torn down/recreated on
  // every documents-state update.
  const documentsRef = useRef(documents)
  useEffect(() => { documentsRef.current = documents }, [documents])
  useEffect(() => {
    if (isNew) return
    let ticks = 0
    const iv = setInterval(() => {
      const hasPending = documentsRef.current.some((d) => d.extraction_status === 'pending')
      if (!hasPending) { clearInterval(iv); return }
      ticks += 1
      if (ticks > 15) { clearInterval(iv); return }
      loadDocuments()
    }, 4000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, id])

  const openDocModal = (edit?: CustomerDocument) => {
    setDocError(null); setDocFile(null)
    setAiFields(edit?.extracted_fields ?? null)
    if (edit) {
      setEditingDocId(edit.id)
      setDocForm({
        document_type: edit.document_type ?? 'Customer Quality Manual',
        category: edit.category ?? 'General',
        doc_number: edit.doc_number ?? '',
        revision: edit.revision ?? '',
        issue_date: edit.issue_date ?? '',
        expiry_date: edit.expiry_date ?? '',
        issuing_authority: edit.issuing_authority ?? '',
        status: edit.status ?? 'Active',
      })
    } else {
      setEditingDocId(null); setDocForm({ ...EMPTY_DOC_FORM })
    }
    setShowDocModal(true)
  }
  const applyAiField = (field: keyof DocFormState, value: string | number | null | undefined) => {
    if (value === null || value === undefined) return
    setDocForm((prev) => ({ ...prev, [field]: String(value) }))
  }
  const docMetaPayload = (m: DocFormState) => ({
    document_type: m.document_type,
    category: m.category || undefined,
    doc_number: m.doc_number.trim() || undefined,
    revision: m.revision.trim() || undefined,
    issue_date: m.issue_date || undefined,
    expiry_date: m.expiry_date || undefined,
    issuing_authority: m.issuing_authority.trim() || undefined,
    status: m.status || undefined,
  })
  const handleSaveDoc = async () => {
    if (!docForm.document_type.trim()) { setDocError('Document type is required.'); return }
    setDocUploading(true); setDocError(null)
    try {
      if (editingDocId) {
        await updateCustomerDocument(id!, editingDocId, docMetaPayload(docForm))
        if (docFile) await uploadCustomerDocumentFile(id!, editingDocId, docFile)
        await loadDocuments()
      } else if (isNew) {
        setPendingDocs((prev) => [...prev, { tempId: `tmp-${Date.now()}`, meta: { ...docForm }, file: docFile }])
      } else {
        const doc = await createCustomerDocument(id!, docMetaPayload(docForm))
        if (docFile) await uploadCustomerDocumentFile(id!, doc.id, docFile)
        await loadDocuments()
      }
      setShowDocModal(false); setDocFile(null); setDocForm({ ...EMPTY_DOC_FORM }); setEditingDocId(null); setAiFields(null)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setDocError(ax?.response?.data?.detail ?? 'Save failed.')
    } finally { setDocUploading(false) }
  }
  const handleDeleteDoc = async (docId: string) => {
    if (!id || id === 'new') return
    if (!window.confirm('Delete this document? The file will be removed.')) return
    try { await deleteCustomerDocument(id, docId); await loadDocuments() }
    catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      alert(ax?.response?.data?.detail ?? 'Delete failed.')
    }
  }
  const removePendingDoc = (tempId: string) => setPendingDocs((prev) => prev.filter((d) => d.tempId !== tempId))
  const flushPendingDocs = async (customerId: string) => {
    for (const pd of pendingDocs) {
      try {
        const doc = await createCustomerDocument(customerId, docMetaPayload(pd.meta))
        if (pd.file) await uploadCustomerDocumentFile(customerId, doc.id, pd.file)
      } catch { /* skip a failed pending doc, continue with the rest */ }
    }
    setPendingDocs([])
  }
  // Notes-tab "Add" attaches a REAL file (one click). Type defaults to the file
  // name; on a new/unsaved customer the file is buffered and uploaded on Save.
  const handleAttachFromNotes = async (file: File) => {
    const typeFromName = file.name.replace(/\.[^.]+$/, '') || 'Attachment'
    if (isNew) {
      setPendingDocs((prev) => [...prev, { tempId: `tmp-${Date.now()}`, meta: { ...EMPTY_DOC_FORM, document_type: typeFromName }, file }])
      return
    }
    if (!id) return
    setNotesAttaching(true)
    try {
      const doc = await createCustomerDocument(id, docMetaPayload({ ...EMPTY_DOC_FORM, document_type: typeFromName }))
      await uploadCustomerDocumentFile(id, doc.id, file)
      await loadDocuments()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      alert(ax?.response?.data?.detail ?? 'Attach failed.')
    } finally { setNotesAttaching(false) }
  }
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [linkedTab, setLinkedTab] = useState<LinkedTab>('Customer Part Numbers')

  // ---- Basic Information ----
  const [customerCode, setCustomerCode] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [shortName, setShortName] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [industry, setIndustry] = useState('')
  const [parentCustomer, setParentCustomer] = useState('')
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([])
  const [gstinLookupValue, setGstinLookupValue] = useState('')
  const [gstinLookupResult, setGstinLookupResult] = useState<GSTINLookupResponse | null>(null)
  const [gstinLookupLoading, setGstinLookupLoading] = useState(false)
  const [gstinLookupError, setGstinLookupError] = useState<string | null>(null)
  const [status, setStatus] = useState('Draft')
  const [website, setWebsite] = useState('')

  // ---- Registration Information ----
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')
  const [tan, setTan] = useState('')
  const [cin, setCin] = useState('')
  const [iecCode, setIecCode] = useState('')
  const [dunsNumber, setDunsNumber] = useState('')
  const [customerSince, setCustomerSince] = useState('')

  // ---- Business Information ----
  const [businessNature, setBusinessNature] = useState('')
  const [supplyType, setSupplyType] = useState('')
  const [paymentTermsText, setPaymentTermsText] = useState('')
  const [incoterms, setIncoterms] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [annualTurnover, setAnnualTurnover] = useState('')
  const [preferredCurrency, setPreferredCurrency] = useState('INR')

  // ---- Key Personnel ----
  const [contacts, setContacts] = useState<KeyContact[]>([
    { name: '', designation: '', email: '', phone: '' },
  ])

  // ---- Billing Address ----
  const [billAddr1, setBillAddr1] = useState('')
  const [billAddr2, setBillAddr2] = useState('')
  const [billCity, setBillCity] = useState('')
  const [billState, setBillState] = useState('')
  const [billCountry, setBillCountry] = useState('India')
  const [billPin, setBillPin] = useState('')

  // ---- Shipping Address ----
  const [shipSameAsBill, setShipSameAsBill] = useState(false)
  const [shipAddr1, setShipAddr1] = useState('')
  const [shipAddr2, setShipAddr2] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipState, setShipState] = useState('')
  const [shipCountry, setShipCountry] = useState('India')
  const [shipPin, setShipPin] = useState('')

  // ---- Banking Information ----
  const [bankName, setBankName] = useState('')
  const [bankBranch, setBankBranch] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountType, setBankAccountType] = useState('')
  const [bankIfscCode, setBankIfscCode] = useState('')
  const [bankMicrCode, setBankMicrCode] = useState('')
  const [bankUpiId, setBankUpiId] = useState('')

  // ---- Quality & Compliance ----
  const [qaApprovalStatus, setQaApprovalStatus] = useState('')
  const [as9100Req, setAs9100Req] = useState('')
  const [nadcapReq, setNadcapReq] = useState('')
  const [flowDownReq, setFlowDownReq] = useState('')
  const [approvalNumber, setApprovalNumber] = useState('')
  const [approvalDate, setApprovalDate] = useState('')
  const [approvalValidUpto, setApprovalValidUpto] = useState('')


  // ---- Save state ----
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  // ---------------------------------------------------------------------------
  // Populate form from customer object
  // ---------------------------------------------------------------------------
  const populateForm = useCallback((c: Customer) => {
    setCustomerCode(c.customer_code)
    setCustomerName(c.customer_name)
    setShortName(c.short_name ?? '')
    setCustomerType(c.customer_type ?? '')
    setIndustry(c.industry ?? '')
    setParentCustomer('')
    setStatus(c.status)
    setParentCustomer((c as unknown as { parent_customer_id?: string }).parent_customer_id ?? '')
    setWebsite(c.website ?? '')

    setGstin(c.gstin ?? '')
    setPan(c.pan ?? '')
    setTan(c.tan ?? '')
    setCin(c.cin ?? '')
    setIecCode(c.iec_code ?? '')
    setDunsNumber(c.duns_number ?? '')
    setCustomerSince(c.customer_since ?? '')

    setBusinessNature(c.business_nature ?? '')
    setSupplyType(c.supply_type ?? '')
    setPaymentTermsText(c.payment_terms_text ?? '')
    setIncoterms(c.incoterms ?? '')
    setMinOrderValue(c.min_order_value != null ? String(c.min_order_value) : '')
    setAnnualTurnover(c.annual_turnover != null ? String(c.annual_turnover) : '')
    setPreferredCurrency(c.preferred_currency ?? 'INR')

    setBillAddr1(c.billing_address_line1 ?? '')
    setBillAddr2(c.billing_address_line2 ?? '')
    setBillCity(c.billing_city ?? '')
    setBillState(c.billing_state ?? '')
    setBillCountry(c.billing_country ?? 'India')
    setBillPin(c.billing_pin ?? '')

    setShipSameAsBill(c.shipping_same_as_billing ?? false)
    setShipAddr1(c.shipping_address_line1 ?? '')
    setShipAddr2(c.shipping_address_line2 ?? '')
    setShipCity(c.shipping_city ?? '')
    setShipState(c.shipping_state ?? '')
    setShipCountry(c.shipping_country ?? 'India')
    setShipPin(c.shipping_pin ?? '')

    setBankName(c.bank_name ?? '')
    setBankBranch(c.bank_branch ?? '')
    setBankAccountNumber(c.bank_account_number ?? '')
    setBankAccountType(c.bank_account_type ?? '')
    setBankIfscCode(c.bank_ifsc_code ?? '')
    setBankMicrCode(c.bank_micr_code ?? '')
    setBankUpiId(c.bank_upi_id ?? '')

    setQaApprovalStatus(c.qa_approval_status ?? '')
    setAs9100Req(c.as9100_requirement ? 'Yes' : 'No')
    setNadcapReq(c.nadcap_requirement ? 'Yes' : 'No')
    setFlowDownReq(c.flow_down_required ? 'Yes' : 'No')
    setApprovalNumber(c.customer_approval_number ?? '')
    setApprovalDate(c.approval_date ?? '')
    setApprovalValidUpto(c.approval_valid_upto ?? '')


    setDocuments((c as unknown as { documents?: CustomerDocument[] }).documents ?? [])
    setNotesText(c.notes ?? '')
  }, [])

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------
  const loadContacts = useCallback(async (custId: string, fallback?: Customer) => {
    try {
      const list = await listCustomerContacts(custId)
      if (list.length > 0) {
        setContacts(list.map((c) => ({ id: c.id, name: c.name ?? '', designation: c.designation ?? '', email: c.email ?? '', phone: c.phone ?? '' })))
      } else {
        const f = fallback as unknown as { contact_name?: string; contact_email?: string; contact_mobile?: string } | undefined
        if (f && (f.contact_name || f.contact_email || f.contact_mobile)) {
          setContacts([{ name: f.contact_name ?? '', designation: '', email: f.contact_email ?? '', phone: f.contact_mobile ?? '' }])
        }
      }
    } catch { /* keep existing rows on error */ }
  }, [])

  useEffect(() => {
    if (isNew) return
    let active = true
    setLoading(true)
    setLoadError(null)
    getCustomer(id!)
      .then((data) => {
        if (!active) return
        setCustomer(data)
        populateForm(data)
        loadContacts(id!, data)
      })
      .catch((err) => {
        if (active) setLoadError(err?.response?.data?.detail ?? 'Failed to load customer')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, isNew, populateForm, loadContacts])

  useEffect(() => {
    listCustomers().then(setCustomerOptions).catch(() => {})
  }, [])

  // Sync shipping when "same as billing" toggled on
  useEffect(() => {
    if (shipSameAsBill) {
      setShipAddr1(billAddr1)
      setShipAddr2(billAddr2)
      setShipCity(billCity)
      setShipState(billState)
      setShipCountry(billCountry)
      setShipPin(billPin)
    }
  }, [shipSameAsBill, billAddr1, billAddr2, billCity, billState, billCountry, billPin])

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const buildPayload = () => ({
    contact_name: contacts[0]?.name?.trim() || undefined,
    contact_email: contacts[0]?.email?.trim() || undefined,
    contact_mobile: contacts[0]?.phone?.trim() || undefined,
    customer_name: customerName.trim(),
    short_name: shortName.trim() || undefined,
    customer_type: customerType || undefined,
    industry: industry || undefined,
    parent_customer_id: parentCustomer || undefined,
    website: website.trim() || undefined,
    gstin: gstin.trim() || undefined,
    pan: pan.trim() || undefined,
    tan: tan.trim() || undefined,
    cin: cin.trim() || undefined,
    iec_code: iecCode.trim() || undefined,
    duns_number: dunsNumber.trim() || undefined,
    customer_since: customerSince || undefined,
    business_nature: businessNature || undefined,
    supply_type: supplyType || undefined,
    payment_terms_text: paymentTermsText || undefined,
    incoterms: incoterms.trim() || undefined,
    min_order_value: minOrderValue ? parseFloat(minOrderValue) : undefined,
    annual_turnover: annualTurnover ? parseFloat(annualTurnover) : undefined,
    preferred_currency: preferredCurrency || undefined,
    billing_address_line1: billAddr1.trim() || undefined,
    billing_address_line2: billAddr2.trim() || undefined,
    billing_city: billCity.trim() || undefined,
    billing_state: billState || undefined,
    billing_country: billCountry || undefined,
    billing_pin: billPin.trim() || undefined,
    shipping_same_as_billing: shipSameAsBill,
    shipping_address_line1: shipAddr1.trim() || undefined,
    shipping_address_line2: shipAddr2.trim() || undefined,
    shipping_city: shipCity.trim() || undefined,
    shipping_state: shipState || undefined,
    shipping_country: shipCountry || undefined,
    shipping_pin: shipPin.trim() || undefined,
    bank_name: bankName.trim() || undefined,
    bank_branch: bankBranch.trim() || undefined,
    bank_account_number: bankAccountNumber.trim() || undefined,
    bank_account_type: bankAccountType || undefined,
    bank_ifsc_code: bankIfscCode.trim() || undefined,
    bank_micr_code: bankMicrCode.trim() || undefined,
    bank_upi_id: bankUpiId.trim() || undefined,
    qa_approval_status: qaApprovalStatus || undefined,
    as9100_requirement: as9100Req === 'Yes',
    nadcap_requirement: nadcapReq === 'Yes',
    flow_down_required: flowDownReq === 'Yes',
    customer_approval_number: approvalNumber.trim() || undefined,
    approval_date: approvalDate || undefined,
    approval_valid_upto: approvalValidUpto || undefined,
    notes: notesText.trim() || undefined,
  })


  // ---- Reset form (New Customer) ----
  const resetForm = useCallback(() => {
    setCustomer(null)
    setCustomerCode(''); setCustomerName(''); setShortName(''); setCustomerType('')
    setIndustry(''); setParentCustomer(''); setStatus('Draft'); setWebsite('')
    setGstin(''); setPan(''); setTan(''); setCin(''); setIecCode(''); setDunsNumber(''); setCustomerSince('')
    setBusinessNature(''); setSupplyType(''); setPaymentTermsText(''); setIncoterms('')
    setMinOrderValue(''); setAnnualTurnover(''); setPreferredCurrency('INR')
    setContacts([{ name: '', designation: '', email: '', phone: '' }])
    setBillAddr1(''); setBillAddr2(''); setBillCity(''); setBillState(''); setBillCountry('India'); setBillPin('')
    setShipSameAsBill(false)
    setShipAddr1(''); setShipAddr2(''); setShipCity(''); setShipState(''); setShipCountry('India'); setShipPin('')
    setBankName(''); setBankBranch(''); setBankAccountNumber(''); setBankAccountType('')
    setBankIfscCode(''); setBankMicrCode(''); setBankUpiId('')
    setQaApprovalStatus(''); setAs9100Req('No'); setNadcapReq('No'); setFlowDownReq('No')
    setApprovalNumber(''); setApprovalDate(''); setApprovalValidUpto('')
    setDocuments([])
    setNotesText('')
    setLoading(false); setLoadError(null); setSaveError(null); setSaveSuccess(false); setActiveTab('general')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset when navigating to /new
  useEffect(() => { if (isNew) resetForm() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Delete customer ----
  const handleDeleteCustomer = async () => {
    if (!id || !window.confirm('Delete customer ' + customerName + '?\n\nThis cannot be undone.')) return
    setActionLoading(true)
    try { await deleteCustomer(id); navigate('/masters/customers') }
    catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail ?? 'Delete failed')
    } finally { setActionLoading(false) }
  }

  // ---- Discard changes ----
  const handleDiscard = async () => {
    if (isNew) {
      // For new customer, reset the form back to blank
      resetForm()
      setSaveError(null)
      return
    }
    if (!id) return
    setSaveError(null)
    try {
      const fresh = await getCustomer(id)
      setCustomer(fresh)
      populateForm(fresh)
      await loadContacts(id, fresh)
    } catch {
      if (customer) populateForm(customer)
    }
  }

  const handleSave = async () => {
    const errs: string[] = []
    // Required — enforced on create so the asterisks in the form are honest.
    // (Only on create; editing legacy records is not retro-blocked.)
    if (isNew) {
      if (!customerCode.trim()) errs.push('Customer Code is required')
      else if (customerCode.trim().length < 2) errs.push('Customer Code must be at least 2 characters')
    }
    // Customer Name required on create AND edit (guard against blanking).
    if (!customerName.trim()) errs.push('Customer Name is required')
    // Optional format checks — only when the field is filled (create + edit).
    const _gstin = gstin.trim().toUpperCase()
    if (_gstin && !validateGSTIN(_gstin)) errs.push('GSTIN is invalid (15-char format)')
    const _pan = pan.trim().toUpperCase()
    if (_pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(_pan)) errs.push('PAN is invalid (format AAAAA0000A)')
    const _tan = tan.trim().toUpperCase()
    if (_tan && !/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(_tan)) errs.push('TAN is invalid (format AAAA00000A)')
    const _cin = cin.trim().toUpperCase()
    if (_cin && !/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(_cin)) errs.push('CIN is invalid (21-char format)')
    const _ifsc = bankIfscCode.trim().toUpperCase()
    if (_ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(_ifsc)) errs.push('IFSC is invalid (format AAAA0XXXXXX)')
    if (billPin.trim() && !/^[0-9]{6}$/.test(billPin.trim())) errs.push('Billing PIN must be 6 digits')
    if (shipPin.trim() && !/^[0-9]{6}$/.test(shipPin.trim())) errs.push('Shipping PIN must be 6 digits')
    const _cemail = contacts[0]?.email?.trim()
    if (_cemail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_cemail)) errs.push('Contact email is invalid')
    const _cmob = contacts[0]?.phone?.trim()
    if (_cmob && !/^[6-9][0-9]{9}$/.test(_cmob)) errs.push('Contact mobile must be a 10-digit Indian number')
    if (errs.length > 0) { setSaveError(errs.join('. ')); return }
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      if (isNew) {
        const created = await createCustomer({
          customer_code: customerCode.trim(),
          ...buildPayload(),
        })
        await persistContacts(created.id)
        await flushPendingDocs(created.id)
        navigate(`/masters/customers/${created.id}`, { replace: true })
      } else {
        const updated = await updateCustomer(id!, buildPayload())
        setCustomer(updated)
        await persistContacts(id!)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: unknown } } }
      const detail = axErr?.response?.data?.detail
      setSaveError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Approve / Deactivate
  // ---------------------------------------------------------------------------
  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const updated = await approveCustomer(id)
      setCustomer(updated)
      setStatus(updated.status)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail ?? 'Approve failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!id || !confirm('Deactivate this customer? They will no longer be selectable on new transactions.')) return
    setActionLoading(true)
    try {
      const updated = await deactivateCustomer(id)
      setCustomer(updated)
      setStatus(updated.status)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail ?? 'Deactivate failed')
    } finally {
      setActionLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Add contact row
  // ---------------------------------------------------------------------------
  const addContact = () => {
    setContacts((prev) => [...prev, { name: '', designation: '', email: '', phone: '' }])
  }

  const removeContact = async (idx: number) => {
    const c = contacts[idx]
    if (c?.id && !isNew) {
      try { await deleteCustomerContact(id!, c.id) } catch { /* ignore */ }
    }
    setContacts((prev) => prev.filter((_, i) => i !== idx))
  }

  // Persist any not-yet-saved contact rows to the customer_contacts table.
  const persistContacts = async (custId: string) => {
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i]
      if (!c.id && c.name.trim()) {
        try {
          await addCustomerContact(custId, {
            name: c.name.trim(),
            designation: c.designation.trim() || undefined,
            email: c.email.trim() || undefined,
            phone: c.phone.trim() || undefined,
            is_primary: i === 0,
          })
        } catch { /* continue with the rest */ }
      }
    }
    await loadContacts(custId)
  }

  // GSTIN verify & fetch — reuses the shared server-side lookup, populates customer fields.
  const handleGstinLookup = async () => {
    const cleaned = gstinLookupValue.trim().toUpperCase()
    if (!cleaned) return
    setGstinLookupLoading(true); setGstinLookupError(null); setGstinLookupResult(null)
    try {
      const result = await gstinLookup(cleaned)
      setGstinLookupResult(result)
      setGstin(cleaned)
      const panFromGstin = cleaned.substring(2, 12)
      if (panFromGstin && !pan) setPan(panFromGstin)
      if (result.legal_name) setCustomerName(result.legal_name)
      if (result.trade_name && result.trade_name !== result.legal_name) setShortName(result.trade_name)
      if (result.state_name) { setBillState(result.state_name); setBillCountry('India') }
      if (result.pincode) setBillPin(result.pincode)
      if (result.registered_address) {
        const addr = result.registered_address
        const parts = addr.split(',').map((x) => x.trim()).filter(Boolean)
        if (!result.pincode) { const pm = addr.match(/\b(\d{6})\b/); if (pm) setBillPin(pm[1]) }
        if (parts.length >= 1) setBillAddr1(parts[0].substring(0, 200))
        if (parts.length >= 2) setBillAddr2(parts[1].substring(0, 200))
        if (parts.length >= 3) {
          const city = parts[Math.max(0, parts.length - 2)].replace(/\b\d{6}\b/, '').replace(/-\s*$/, '').trim()
          if (city) setBillCity(city)
        }
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setGstinLookupError(axErr?.response?.data?.detail ?? 'GSTIN lookup failed')
    } finally { setGstinLookupLoading(false) }
  }

  const updateContact = (idx: number, field: keyof KeyContact, value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  }

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          Loading customer...
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
          {loadError}
        </div>
      </div>
    )
  }

  const currentStatus = customer?.status ?? status ?? 'Draft'
  const displayName = isNew ? 'New Customer' : (customer?.customer_name ?? 'Customer Detail')

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col gap-0">

      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-t-xl px-4 py-3">
        <button onClick={() => navigate('/masters/customers')} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#005c87] mb-2">
          <ArrowLeft size={13} /> Back to Customers
        </button>
        <div className="flex items-start gap-4">
          {/* Logo placeholder */}
          <div className="w-16 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-[#204577]" />
          </div>

          {/* Company info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">{displayName}</h1>
              <StateMachineBadge state={currentStatus} />
            </div>
            <div className="flex items-center text-xs text-gray-500 flex-wrap mt-0.5 gap-0">
              {customerCode && <span>Customer Code : {customerCode}</span>}
              {customerType && (
                <>
                  <span className="mx-2 text-gray-300">·</span>
                  <span>Customer Type : {customerType}</span>
                </>
              )}
              {industry && (
                <>
                  <span className="mx-2 text-gray-300">·</span>
                  <span>Industry : {industry}</span>
                </>
              )}
              {preferredCurrency && (
                <>
                  <span className="mx-2 text-gray-300">·</span>
                  <span>Currency : {preferredCurrency}</span>
                </>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-400 flex-wrap mt-0.5 gap-0">
              {gstin && <span>GSTIN : {gstin}</span>}
              {pan && (
                <>
                  <span className="mx-2 text-gray-300">·</span>
                  <span>PAN : {pan}</span>
                </>
              )}
            </div>
          </div>

          {/* Meta info + action buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {currentStatus === 'Draft' && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || isNew}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle size={12} /> Approve
                </button>
              )}
              {currentStatus === 'Active' && (
                <button
                  onClick={handleDeactivate}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={12} /> Deactivate
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Actions <ChevronDown size={12} />
                </button>
                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-20 py-1">
                    <button
                      onClick={() => { handleSave(); setShowActionsMenu(false) }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowActionsMenu(false)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => setShowActionsMenu(false)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Export
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 text-right space-y-0.5">
              {customer?.created_at && (
                <div>Created On: {formatDate(customer.created_at)}</div>
              )}
              {customer?.updated_at && (
                <div>Last Modified On: {formatDate(customer.updated_at)}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          TABS
      ================================================================ */}
      <div className="bg-white border-x border-b border-gray-200 px-2 flex flex-wrap gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#005c87] text-[#005c87]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================
          SAVE FEEDBACK BAR
      ================================================================ */}
      {(saveError || saveSuccess) && (
        <div
          className={`px-4 py-2 text-xs border-x ${
            saveError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {saveError ?? 'Saved successfully.'}
        </div>
      )}

      {/* ================================================================
          TAB CONTENT
      ================================================================ */}
      <div className="bg-gray-50 border-x border-b border-gray-200 rounded-b-xl p-3">

        {/* ---- GENERAL INFORMATION ---------------------------------- */}
        {activeTab === 'general' && (
          <div className="flex flex-col gap-3">
            {/* GSTIN Verify & Fetch */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-[#005c87]" />
                <h3 className="text-xs font-semibold text-gray-700">GSTIN Verification</h3>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1 max-w-sm">
                  <GSTINInput label="GSTIN" value={gstinLookupValue} onChange={setGstinLookupValue} />
                </div>
                <Button variant="primary" onClick={handleGstinLookup} loading={gstinLookupLoading} disabled={!gstinLookupValue.trim()}>Verify &amp; Fetch</Button>
              </div>
              {gstinLookupError && <p className="mt-2 text-xs text-red-600">{gstinLookupError}</p>}
              {gstinLookupResult && (
                <div className={`mt-3 rounded-lg border p-3 ${gstinLookupResult.confidence >= 1.0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700">{gstinLookupResult.confidence >= 1.0 ? '✓ Verified — fields populated from GST registry' : '⚠ Format valid — State & PAN decoded'}</span>
                    <ConfidenceBadge score={gstinLookupResult.confidence} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { label: 'Legal Name', val: gstinLookupResult.legal_name },
                      { label: 'PAN', val: gstinLookupValue.trim().substring(2, 12) },
                      { label: 'State', val: gstinLookupResult.state_name ?? gstinLookupResult.state_code },
                      { label: 'Status', val: gstinLookupResult.status },
                    ].filter((f) => f.val).map((f) => (
                      <div key={f.label} className="bg-white rounded p-2 border border-gray-100">
                        <div className="text-gray-400 mb-0.5">{f.label}</div>
                        <div className="font-medium text-gray-800 truncate" title={f.val ?? ''}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* 4-column grid */}
            <div className="grid grid-cols-2 gap-3 items-start content-start">

              {/* Column 1 "" Basic Information */}
              <SectionCard
                icon={<Info size={12} className="text-blue-500" />}
                title="Basic Information"
                color="bg-blue-50"
              >
                <FieldRow label="Customer Code" required>
                  <FieldInput
                    value={customerCode}
                    onChange={(v) => setCustomerCode(v.toUpperCase())}
                    placeholder="CUS-1001"
                    disabled={!isNew}
                  />
                </FieldRow>
                <FieldRow label="Customer Name" required>
                  <FieldInput value={customerName} onChange={setCustomerName} placeholder="Full legal name" />
                </FieldRow>
                <FieldRow label="Short Name">
                  <FieldInput value={shortName} onChange={setShortName} placeholder="Short name" />
                </FieldRow>
                <FieldRow label="Customer Type" required>
                  <FieldSelect value={customerType} onChange={setCustomerType} options={CUSTOMER_TYPE_OPTIONS} />
                </FieldRow>
                <FieldRow label="Industry" required>
                  <FieldSelect value={industry} onChange={setIndustry} options={INDUSTRY_OPTIONS} />
                </FieldRow>
                <FieldRow label="Parent Customer">
                  <FieldSelect
                    value={parentCustomer}
                    onChange={setParentCustomer}
                    options={[{ value: '', label: '— None —' }, ...customerOptions.filter((co) => co.id !== id).map((co) => ({ value: co.id, label: `${co.customer_code} — ${co.customer_name}` }))]}
                  />
                </FieldRow>
                <FieldRow label="Status">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${status === 'Active' ? 'bg-green-50 text-green-700' : status === 'Inactive' ? 'bg-gray-100 text-gray-600' : status === 'Deleted' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{status}</span>
                </FieldRow>
                <FieldRow label="Website">
                  <FieldInput value={website} onChange={setWebsite} placeholder="www.example.com" />
                </FieldRow>
              </SectionCard>

              {/* Column 2 "" Registration Information */}
              <SectionCard
                icon={<Shield size={12} className="text-purple-500" />}
                title="Registration Information"
                color="bg-purple-50"
              >
                <FieldRow label="GSTIN">
                  <FieldInput
                    value={gstin}
                    onChange={(v) => setGstin(v.toUpperCase())}
                    placeholder="29AAECA9449P1ZB"
                    maxLength={15}
                  />
                </FieldRow>
                <FieldRow label="PAN">
                  <FieldInput
                    value={pan}
                    onChange={(v) => setPan(v.toUpperCase())}
                    placeholder="AAECA9449P"
                    maxLength={10}
                  />
                </FieldRow>
                <FieldRow label="TAN">
                  <FieldInput
                    value={tan}
                    onChange={(v) => setTan(v.toUpperCase())}
                    placeholder="BLRA01234E"
                    maxLength={10}
                  />
                </FieldRow>
                <FieldRow label="CIN">
                  <FieldInput value={cin} onChange={(v) => setCin(v.toUpperCase())} placeholder="U35100KA2011FTC065085" maxLength={21} />
                </FieldRow>
                <FieldRow label="IEC">
                  <FieldInput value={iecCode} onChange={(v) => setIecCode(v.toUpperCase())} placeholder="AAECA9449P" maxLength={10} />
                </FieldRow>
                <FieldRow label="DUNS Number">
                  <FieldInput value={dunsNumber} onChange={setDunsNumber} placeholder="91-447-4715" maxLength={20} />
                </FieldRow>
                <FieldRow label="Customer Since">
                  <FieldInput value={customerSince} onChange={setCustomerSince} type="date" />
                </FieldRow>
              </SectionCard>

            </div>


            {/* ---- Linked Information ---- */}
            <div 
              className="bg-white rounded-lg border border-gray-200"
              style={{
                alignSelf: 'start',
                height: 'auto',
                maxHeight: 'fit-content',
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                <Link size={13} className="text-gray-500" />
                <h3 className="text-xs font-semibold text-gray-700">Linked Information</h3>
              </div>

              {/* Linked sub-tabs */}
              <div className="flex border-b border-gray-100">
                {LINKED_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setLinkedTab(t)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      linkedTab === t
                        ? 'border-[#005c87] text-[#005c87]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Customer Part Numbers table */}
              {linkedTab === 'Customer Part Numbers' && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">S. No.</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Customer Part No.</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Customer Part Description</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Our Part No.</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Part Description</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">UOM</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Approved On</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-gray-400">
                        No part numbers linked
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
              {linkedTab !== 'Customer Part Numbers' && (
                <div className="px-3 py-6 text-center text-gray-400 text-xs">
                  No records found
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={handleDiscard}
                className="px-4 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-xs text-white bg-[#005c87] rounded hover:bg-[#004a6e] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* ---- ADDRESS TAB ------------------------------------------ */}
        {activeTab === 'address' && (
          <div className="grid grid-cols-2 gap-4">
            <SectionCard
              icon={<Building2 size={12} className="text-blue-500" />}
              title="Billing Address"
              color="bg-blue-50"
            >
              <FieldRow label="Address Line 1" required>
                <FieldInput value={billAddr1} onChange={setBillAddr1} />
              </FieldRow>
              <FieldRow label="Address Line 2">
                <FieldInput value={billAddr2} onChange={setBillAddr2} />
              </FieldRow>
              <FieldRow label="City" required>
                <FieldInput value={billCity} onChange={setBillCity} />
              </FieldRow>
              <FieldRow label="State" required>
                <FieldSelect value={billState} onChange={setBillState} options={INDIAN_STATES} />
              </FieldRow>
              <FieldRow label="Country" required>
                <FieldSelect value={billCountry} onChange={setBillCountry} options={COUNTRY_OPTIONS} />
              </FieldRow>
              <FieldRow label="PIN Code" required>
                <FieldInput value={billPin} onChange={setBillPin} maxLength={10} />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Building2 size={12} className="text-teal-500" />}
              title="Shipping Address"
              color="bg-teal-50"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-50">
                <input
                  id="shipSame2"
                  type="checkbox"
                  checked={shipSameAsBill}
                  onChange={(e) => setShipSameAsBill(e.target.checked)}
                  className="rounded accent-[#005c87]"
                />
                <label htmlFor="shipSame2" className="text-[11px] text-gray-500 cursor-pointer">
                  Same as Billing Address
                </label>
              </div>
              <FieldRow label="Address Line 1" required>
                <FieldInput value={shipAddr1} onChange={setShipAddr1} disabled={shipSameAsBill} />
              </FieldRow>
              <FieldRow label="Address Line 2">
                <FieldInput value={shipAddr2} onChange={setShipAddr2} disabled={shipSameAsBill} />
              </FieldRow>
              <FieldRow label="City" required>
                <FieldInput value={shipCity} onChange={setShipCity} disabled={shipSameAsBill} />
              </FieldRow>
              <FieldRow label="State" required>
                <FieldSelect value={shipState} onChange={setShipState} options={INDIAN_STATES} />
              </FieldRow>
              <FieldRow label="Country" required>
                <FieldSelect value={shipCountry} onChange={setShipCountry} options={COUNTRY_OPTIONS} />
              </FieldRow>
              <FieldRow label="PIN Code" required>
                <FieldInput value={shipPin} onChange={setShipPin} maxLength={10} disabled={shipSameAsBill} />
              </FieldRow>
            </SectionCard>
          </div>
        )}

        {/* ---- CONTACT DETAILS TAB ---------------------------------- */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{alignSelf:"start", height:"fit-content"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700">Contact Details</h3>
              <button
                onClick={addContact}
                className="inline-flex items-center gap-1 text-xs text-[#005c87] hover:text-[#004a6e]"
              >
                <Plus size={12} /> Add Contact
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">S. No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Designation</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Email</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Phone</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No contacts yet. Click "Add Contact" to add one.</td></tr>
                  )}
                  {contacts.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-2 py-1"><input value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} placeholder="Name" className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5" /></td>
                      <td className="px-2 py-1"><input value={c.designation} onChange={(e) => updateContact(i, 'designation', e.target.value)} placeholder="Designation" className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5 text-gray-500" /></td>
                      <td className="px-2 py-1"><input value={c.email} onChange={(e) => updateContact(i, 'email', e.target.value)} placeholder="email@co.com" className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5 text-blue-600" /></td>
                      <td className="px-2 py-1"><input value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} placeholder="+91 ..." className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5" /></td>
                      <td className="px-3 py-2 text-right"><button type="button" title="Delete" onClick={() => removeContact(i)}><Trash2 size={12} className="text-gray-300 hover:text-red-500" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- BUSINESS DETAILS TAB --------------------------------- */}
        {activeTab === 'business' && (
          <div className="grid grid-cols-2 gap-4">
            <SectionCard
              icon={<BarChart2 size={12} className="text-green-500" />}
              title="Business Information"
              color="bg-green-50"
            >
              <FieldRow label="Business Nature" required>
                <FieldSelect value={businessNature} onChange={setBusinessNature} options={BUSINESS_NATURE_OPTIONS} />
              </FieldRow>
              <FieldRow label="Service / Supply Type">
                <FieldSelect value={supplyType} onChange={setSupplyType} options={SUPPLY_TYPE_OPTIONS} />
              </FieldRow>
              <FieldRow label="Industry" required>
                <FieldSelect value={industry} onChange={setIndustry} options={INDUSTRY_OPTIONS} />
              </FieldRow>
              <FieldRow label="Website">
                <FieldInput value={website} onChange={setWebsite} placeholder="www.example.com" />
              </FieldRow>
              <FieldRow label="Customer Since">
                <FieldInput value={customerSince} onChange={setCustomerSince} type="date" />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Shield size={12} className="text-purple-500" />}
              title="Registration Details"
              color="bg-purple-50"
            >
              <FieldRow label="GSTIN">
                <FieldInput value={gstin} onChange={(v) => setGstin(v.toUpperCase())} maxLength={15} />
              </FieldRow>
              <FieldRow label="PAN">
                <FieldInput value={pan} onChange={(v) => setPan(v.toUpperCase())} maxLength={10} />
              </FieldRow>
              <FieldRow label="TAN">
                <FieldInput value={tan} onChange={(v) => setTan(v.toUpperCase())} maxLength={10} />
              </FieldRow>
              <FieldRow label="CIN">
                <FieldInput value={cin} onChange={(v) => setCin(v.toUpperCase())} maxLength={21} />
              </FieldRow>
              <FieldRow label="IEC">
                <FieldInput value={iecCode} onChange={(v) => setIecCode(v.toUpperCase())} maxLength={10} />
              </FieldRow>
              <FieldRow label="DUNS Number">
                <FieldInput value={dunsNumber} onChange={setDunsNumber} maxLength={20} />
              </FieldRow>
            </SectionCard>
          </div>
        )}

        {/* ---- COMMERCIAL TAB --------------------------------------- */}
        {activeTab === 'commercial' && (
          <div className="w-full">
            <SectionCard
              icon={<BarChart2 size={12} className="text-blue-500" />}
              title="Commercial Terms"
              color="bg-blue-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <FieldRow label="Payment Terms" required>
                  <FieldSelect value={paymentTermsText} onChange={setPaymentTermsText} options={PAYMENT_TERMS_OPTIONS} />
                </FieldRow>
                <FieldRow label="Incoterms">
                  <FieldInput value={incoterms} onChange={(v) => setIncoterms(v.toUpperCase())} placeholder="DDP" maxLength={10} />
                </FieldRow>
                <FieldRow label="Min. Order Value (₹)">
                  <FieldInput value={minOrderValue} onChange={setMinOrderValue} type="number" placeholder="50000.00" />
                </FieldRow>
                <FieldRow label="Annual Turnover (₹)">
                  <FieldInput value={annualTurnover} onChange={setAnnualTurnover} type="number" placeholder="2500000000.00" />
                </FieldRow>
                <FieldRow label="Preferred Currency">
                  <FieldSelect value={preferredCurrency} onChange={setPreferredCurrency} options={CURRENCY_OPTIONS} />
                </FieldRow>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ---- QUALITY REQUIREMENTS TAB ----------------------------- */}
        {activeTab === 'quality' && (
          <div className="w-full">
            <SectionCard
              icon={<Shield size={12} className="text-amber-500" />}
              title="Quality & Compliance"
              color="bg-amber-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <FieldRow label="QA Approval Status">
                  <FieldSelect value={qaApprovalStatus} onChange={setQaApprovalStatus} options={QA_APPROVAL_OPTIONS} />
                </FieldRow>
                <FieldRow label="AS9100 Requirement">
                  <FieldSelect value={as9100Req} onChange={setAs9100Req} options={YES_NO_OPTIONS} />
                </FieldRow>
                <FieldRow label="NADCAP Requirement">
                  <FieldSelect value={nadcapReq} onChange={setNadcapReq} options={YES_NO_OPTIONS} />
                </FieldRow>
                <FieldRow label="Flow Down Required">
                  <FieldSelect value={flowDownReq} onChange={setFlowDownReq} options={YES_NO_OPTIONS} />
                </FieldRow>
                <FieldRow label="Customer Approval No.">
                  <FieldInput value={approvalNumber} onChange={setApprovalNumber} placeholder="AU/N/APP/2021/458" />
                </FieldRow>
                <FieldRow label="Approval Date">
                  <FieldInput value={approvalDate} onChange={setApprovalDate} type="date" />
                </FieldRow>
                <FieldRow label="Valid Up To">
                  <FieldInput value={approvalValidUpto} onChange={setApprovalValidUpto} type="date" />
                </FieldRow>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ---- BANKING INFORMATION TAB ------------------------------ */}
        {activeTab === 'banking' && (
          <div className="w-full">
            <SectionCard
              icon={<Shield size={12} className="text-indigo-500" />}
              title="Banking Information"
              color="bg-indigo-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <FieldRow label="Bank Name" required>
                  <FieldInput value={bankName} onChange={setBankName} placeholder="HDFC Bank Ltd" />
                </FieldRow>
                <FieldRow label="Branch" required>
                  <FieldInput value={bankBranch} onChange={setBankBranch} placeholder="Devanahalli" />
                </FieldRow>
                <FieldRow label="Account No." required>
                  <FieldInput value={bankAccountNumber} onChange={setBankAccountNumber} placeholder="56200017345678" maxLength={30} />
                </FieldRow>
                <FieldRow label="Account Type" required>
                  <FieldSelect value={bankAccountType} onChange={setBankAccountType} options={BANK_ACCOUNT_TYPE_OPTIONS} />
                </FieldRow>
                <FieldRow label="IFSC Code" required>
                  <FieldInput value={bankIfscCode} onChange={(v) => setBankIfscCode(v.toUpperCase())} placeholder="HDFC0C31324" maxLength={11} />
                </FieldRow>
                <FieldRow label="MICR Code">
                  <FieldInput value={bankMicrCode} onChange={setBankMicrCode} placeholder="560240002" maxLength={9} />
                </FieldRow>
                <FieldRow label="UPI ID">
                  <FieldInput value={bankUpiId} onChange={setBankUpiId} placeholder="customer@bank" maxLength={50} />
                </FieldRow>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ---- DOCUMENTS TAB ---------------------------------------- */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{alignSelf:"start", height:"fit-content"}}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"><FileText size={13} className="text-[#005c87]" /> Documents &amp; Certifications</h3>
              <button onClick={() => openDocModal()} className="inline-flex items-center gap-1 text-xs text-[#005c87] hover:text-[#004a6e]">
                <Plus size={12} /> Upload Document
              </button>
            </div>

            {(documents.length === 0 && pendingDocs.length === 0) ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400">No documents yet. Click &quot;Upload Document&quot; or drag a file below.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Type</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Category</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Doc No.</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Rev.</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Issue</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Expiry</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">File</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">AI Read</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2">{doc.document_type}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.category || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.doc_number || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.revision || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.issue_date || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.expiry_date || '-'}</td>
                        <td className="px-3 py-2">{doc.status || '-'}</td>
                        <td className="px-3 py-2 text-blue-600">{doc.file_name || <span className="text-gray-300">no file</span>}</td>
                        <td className="px-3 py-2">
                          {doc.extraction_status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600"><Loader2 size={11} className="animate-spin" /> Reading…</span>
                          )}
                          {(doc.extraction_status === 'success' || doc.extraction_status === 'partial') && (
                            <button type="button" onClick={() => openDocModal(doc)} className="inline-flex items-center gap-1 text-[10px] text-[#005c87] hover:underline">
                              <Sparkles size={11} /> Review AI fields
                            </button>
                          )}
                          {doc.extraction_status === 'failed' && <span className="text-[10px] text-red-500">AI read failed</span>}
                          {(doc.extraction_status === 'unsupported_file_type' || !doc.extraction_status) && <span className="text-[10px] text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" title="Edit" onClick={() => openDocModal(doc)}><Pencil size={13} className="text-gray-400 hover:text-[#005c87]" /></button>
                            {doc.file_path && <a href={`/${doc.file_path}`} target="_blank" rel="noreferrer" title="Download" className="text-gray-500 hover:text-[#005c87]"><Download size={13} /></a>}
                            <button type="button" title="Delete" onClick={() => handleDeleteDoc(doc.id)}><Trash2 size={13} className="text-gray-300 hover:text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingDocs.map((pd) => (
                      <tr key={pd.tempId} className="border-b border-gray-50 bg-amber-50/40">
                        <td className="px-3 py-2">{pd.meta.document_type}</td>
                        <td className="px-3 py-2 text-gray-500">{pd.meta.category || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{pd.meta.doc_number || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{pd.meta.revision || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{pd.meta.issue_date || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{pd.meta.expiry_date || '-'}</td>
                        <td className="px-3 py-2"><span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Pending save</span></td>
                        <td className="px-3 py-2 text-gray-500">{pd.file ? pd.file.name : <span className="text-gray-300">no file</span>}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-300" title="AI reading starts after the customer is saved">—</td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" title="Remove" onClick={() => removePendingDoc(pd.tempId)}><Trash2 size={13} className="text-gray-300 hover:text-red-500" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { setDocFile(f); openDocModal() } }}
              className="m-4 border-2 border-dashed border-gray-200 rounded-lg px-4 py-6 text-center text-xs text-gray-400 hover:border-[#005c87]/40"
            >
              Drag &amp; drop a file here to attach it (PDF / DOCX / XLSX)
              {isNew && <div className="mt-1 text-[11px] text-amber-600">Documents added now are saved when you save the customer.</div>}
            </div>

            {showDocModal && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setShowDocModal(false); setAiFields(null) }}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">{editingDocId ? 'Edit Document' : 'Add Document'}</h3>
                    <button onClick={() => { setShowDocModal(false); setAiFields(null) }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                  {aiFields && (aiFields.primary || aiFields.secondary_drawing_fields) && (
                    <div className="mx-4 mt-3 rounded-lg border border-[#005c87]/20 bg-[#005c87]/5 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-[#005c87] uppercase">
                        <Sparkles size={12} /> AI suggested fields — review and apply
                      </div>
                      {aiFields.primary && (
                        <div className="space-y-1.5">
                          {([
                            ['document_title', 'Title (info only)', null],
                            ['doc_number', 'Doc Number', 'doc_number'],
                            ['revision', 'Revision', 'revision'],
                            ['issue_date', 'Issue Date', 'issue_date'],
                            ['expiry_date', 'Expiry Date', 'expiry_date'],
                            ['issuing_authority', 'Issuing Authority', 'issuing_authority'],
                          ] as const).map(([aiKey, label, formField]) => {
                            const f = aiFields.primary?.[aiKey]
                            if (!f || f.value === null || f.value === undefined) return null
                            return (
                              <div key={aiKey} className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-gray-500 w-28 shrink-0">{label}</span>
                                <span className="flex-1 flex items-center gap-1.5 min-w-0">
                                  <span className="truncate text-gray-800">{String(f.value)}</span>
                                  <ConfidenceBadge score={f.confidence} />
                                </span>
                                {formField && (
                                  <button
                                    type="button"
                                    onClick={() => applyAiField(formField as keyof DocFormState, f.value)}
                                    className="shrink-0 px-2 py-0.5 text-[10px] font-medium border border-[#005c87]/40 text-[#005c87] rounded hover:bg-[#005c87]/10"
                                  >
                                    Apply
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {aiFields.secondary_drawing_fields && (
                        <details className="mt-2">
                          <summary className="text-[10px] text-gray-500 cursor-pointer select-none">Also detected (informational — engineering/drawing-style fields, not applied to this form)</summary>
                          <div className="mt-1 text-[10px] text-gray-500 space-y-0.5">
                            {Object.entries(aiFields.secondary_drawing_fields).map(([k, v]) => (
                              <div key={k}>{k}: {typeof v.value === 'object' ? JSON.stringify(v.value) : String(v.value)}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                  <div className="px-4 py-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Document Type <span className="text-red-500">*</span></label>
                      <select value={docForm.document_type} onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5">
                        {CUSTOMER_DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Category</label>
                      <select value={docForm.category} onChange={(e) => setDocForm({ ...docForm, category: e.target.value })} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5">
                        {CUSTOMER_DOC_CATEGORIES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Doc Number</label>
                      <input value={docForm.doc_number} onChange={(e) => setDocForm({ ...docForm, doc_number: e.target.value })} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Revision</label>
                      <input value={docForm.revision} onChange={(e) => setDocForm({ ...docForm, revision: e.target.value })} maxLength={20} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Issue Date</label>
                      <input type="date" value={docForm.issue_date} onChange={(e) => setDocForm({ ...docForm, issue_date: e.target.value })} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Expiry Date</label>
                      <input type="date" value={docForm.expiry_date} onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Issuing Authority</label>
                      <input value={docForm.issuing_authority} onChange={(e) => setDocForm({ ...docForm, issuing_authority: e.target.value })} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">Status</label>
                      <select value={docForm.status} onChange={(e) => setDocForm({ ...docForm, status: e.target.value })} className="w-full text-xs border border-gray-300 rounded px-2 py-1.5">
                        {CUSTOMER_DOC_STATUSES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase">File (PDF / DOCX / XLSX){editingDocId ? ' — leave empty to keep current' : ''}</label>
                      <input type="file" accept=".pdf,.docx,.xlsx" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="w-full text-xs" />
                      {docFile && <p className="mt-1 text-[11px] text-gray-500">Selected: {docFile.name}</p>}
                    </div>
                    {docError && <p className="col-span-2 text-xs text-red-600">{docError}</p>}
                  </div>
                  <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100">
                    <button onClick={() => { setShowDocModal(false); setAiFields(null) }} className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSaveDoc} disabled={docUploading} className="px-3 py-1.5 text-xs bg-[#005c87] text-white rounded hover:bg-[#004a6e] disabled:opacity-50">{docUploading ? 'Saving...' : editingDocId ? 'Save' : (isNew ? 'Add' : 'Save')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- NOTES & ATTACHMENTS TAB ------------------------------ */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-1.5 mb-2"><FileText size={13} className="text-[#005c87]" /><h3 className="text-xs font-semibold text-gray-700">Internal Notes</h3></div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={10}
                placeholder="Internal notes about this customer (payment behaviour, key contacts, special instructions)..."
                className="w-full text-xs border border-gray-200 rounded px-3 py-2 resize-y focus:border-[#005c87] focus:outline-none"
              />
              <p className="mt-2 text-[11px] text-gray-400">Notes are saved when you click <span className="font-medium text-gray-600">Save</span> on the General tab.</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5"><Link size={13} className="text-[#005c87]" /><h3 className="text-xs font-semibold text-gray-700">Attachments</h3></div>
                <label className={`inline-flex items-center gap-1 text-xs cursor-pointer ${notesAttaching ? 'text-gray-400' : 'text-[#005c87] hover:text-[#004a6e]'}`} title="Attach a file">
                  {notesAttaching ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} {notesAttaching ? 'Attaching…' : 'Add'}
                  <input type="file" className="hidden" disabled={notesAttaching} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAttachFromNotes(f); e.target.value = '' }} />
                </label>
              </div>
              {documents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No attachments. Uploaded documents appear here and in the Documents tab.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between py-2 text-xs">
                      <div className="min-w-0">
                        <div className="text-gray-700 truncate">{doc.file_name}</div>
                        <div className="text-gray-400">{doc.document_type}{doc.uploaded_at ? ` \u00b7 ${formatDate(doc.uploaded_at)}` : ''}</div>
                      </div>
                      {doc.file_path && <a href={`/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#005c87] shrink-0"><Download size={13} /></a>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ---- HISTORY TAB ------------------------------------------ */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-3">Record Information</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium">{status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Created On</span><span className="font-medium">{customer?.created_at ? formatDate(customer.created_at) : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Last Modified</span><span className="font-medium">{customer?.updated_at ? formatDate(customer.updated_at) : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Contacts</span><span className="font-medium">{contacts.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Documents</span><span className="font-medium">{documents.length}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-3">Recent Activity</h3>
              {(() => {
                const items: { label: string; date: string }[] = []
                if (customer?.created_at) items.push({ label: 'Customer record created', date: formatDate(customer.created_at) })
                if (customer?.updated_at && customer.updated_at !== customer.created_at) items.push({ label: 'Customer record last modified', date: formatDate(customer.updated_at) })
                documents.forEach((d) => items.push({ label: `Document uploaded: ${d.document_type ?? d.file_name}`, date: d.uploaded_at ? formatDate(d.uploaded_at) : '-' }))
                return items.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No recorded activity yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((a, i) => (<li key={i} className="flex items-start gap-2 text-xs"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#005c87] shrink-0" /><div><div className="text-gray-700">{a.label}</div><div className="text-gray-400">{a.date}</div></div></li>))}
                  </ul>
                )
              })()}
              <p className="mt-3 text-[11px] text-gray-400">Full change history is captured in the global Audit Trail (Administrator view).</p>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b px-4 py-2 flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-4">
          {customer?.created_at && (
            <span>Created By: Admin User &nbsp;·&nbsp; Created On: {formatDate(customer.created_at)}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {customer?.updated_at && (
            <span>Modified By: Admin User &nbsp;·&nbsp; Modified On: {formatDate(customer.updated_at)}</span>
          )}
        </div>
      </div>
    </div>
  )
}








