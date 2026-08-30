/**
 * SupplierDetailPage - Module 03: Supplier Master detail view.
 *
 * Layout matches the PRECISION METALS INDIA PVT LTD reference image:
 *   - Header: logo box + company name + status badge + cert badges + meta + action buttons
 *   - 11 tabs: General Information | Address | Contact Details | Business Details |
 *              Banking Information | Products / Services | Quality & Compliance |
 *              Documents | Performance | Notes | History
 *   - General Information tab:
 *     Row 1 (4 cols): Basic Info | Registration | Business Info | Key Contacts
 *     Row 2 (4 cols): Manufacturing & Capability | Quality & Compliance Summary |
 *                     Performance Summary | Approved For
 *     Row 3 (4 cols): Approved Products (col-span-2) | Banking Info | Documents & Certs
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Info,
  Shield,
  BarChart2,
  Users,
  Factory,
  Star,
  Package,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  MoreHorizontal,
  ArrowLeft,
  Trash2,
} from 'lucide-react'

import {
  Button, Input, Select, StateMachineBadge, GSTINInput, ConfidenceBadge,
} from '../../components/ui'
import { formatDate, validateGSTIN } from '../../lib/utils'
import { gstinLookup, GSTINLookupResponse } from '../../api/companyApi'
import type { SupplierScorecard } from '../../api/supplierApi'
import {
  getSupplier,
  createSupplier,
  listSupplierContacts,
  getScorecard,
  listSupplierDocuments,
  addSupplierDocument,
  deleteSupplierDocument,
  listSupplierApprovedProducts,
  addSupplierApprovedProduct,
  deleteSupplierApprovedProduct,
  addSupplierContact,
  deleteSupplierContact,
  updateSupplier,
  approveSupplier,
  suspendSupplier,
  delistSupplier,
  restoreSupplier,
  Supplier,
} from '../../api/supplierApi'

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
type TabId =
  | 'general'
  | 'address'
  | 'contacts'
  | 'business'
  | 'banking'
  | 'products'
  | 'quality'
  | 'documents'
  | 'performance'
  | 'notes'
  | 'history'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General Information' },
  { id: 'address', label: 'Address' },
  { id: 'contacts', label: 'Contact Details' },
  { id: 'business', label: 'Business Details' },
  { id: 'banking', label: 'Banking Information' },
  { id: 'products', label: 'Products / Services' },
  { id: 'quality', label: 'Quality & Compliance' },
  { id: 'documents', label: 'Documents' },
  { id: 'performance', label: 'Performance' },
  { id: 'notes', label: 'Notes' },
  { id: 'history', label: 'History' },
]

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------
const SUPPLIER_TYPE_OPTIONS = [
  { value: '', label: '- Select Type -' },
  { value: 'Manufacturer', label: 'Manufacturer' },
  { value: 'Trader', label: 'Trader' },
  { value: 'Service Provider', label: 'Service Provider' },
  { value: 'Sub-Contractor', label: 'Sub-Contractor' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: '- Select Category -' },
  { value: 'Raw Material', label: 'Raw Material' },
  { value: 'Special Process', label: 'Special Process' },
  { value: 'Sub-contract Machining', label: 'Sub-contract Machining' },
  { value: 'Consumable', label: 'Consumable' },
  { value: 'Tooling', label: 'Tooling' },
]

const STATUS_OPTIONS = [
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Active', label: 'Active' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Delisted', label: 'Delisted' },
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
  { value: 'Raw Material Supplier', label: 'Raw Material Supplier' },
  { value: 'Special Process Provider', label: 'Special Process Provider' },
  { value: 'Sub-Contract Machining', label: 'Sub-Contract Machining' },
  { value: 'Consumables Supplier', label: 'Consumables Supplier' },
  { value: 'Tooling Supplier', label: 'Tooling Supplier' },
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

const CERT_STATUS_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Certified', label: 'Certified' },
  { value: 'Not Certified', label: 'Not Certified' },
  { value: 'Expired', label: 'Expired' },
  { value: 'In Progress', label: 'In Progress' },
]

const NADCAP_STATUS_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Not Approved', label: 'Not Approved' },
  { value: 'Expired', label: 'Expired' },
  { value: 'In Progress', label: 'In Progress' },
]

const BANK_ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Current Account', label: 'Current Account' },
  { value: 'Savings Account', label: 'Savings Account' },
  { value: 'Cash Credit', label: 'Cash Credit' },
  { value: 'Overdraft', label: 'Overdraft' },
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

// ---------------------------------------------------------------------------
// Shared sub-components (same patterns as CustomerDetailPage)
// ---------------------------------------------------------------------------

/** Section card with colored header stripe */
function SectionCard({
  icon,
  title,
  color,
  children,
  headerRight,
}: {
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
  headerRight?: React.ReactNode
}) {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      style={{
        alignSelf: 'start',
        height: 'auto',
      }}
    >
      <div className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 ${color}`}>
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
        </div>
        {headerRight && <div>{headerRight}</div>}
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

/** Star rating display */
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
      <span className="text-xs text-gray-600 ml-1">{value.toFixed(1)}</span>
    </div>
  )
}

/** Document status badge */
function DocStatusBadge({ status }: { status: string }) {
  if (status === 'Valid' || status === 'Certified')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> {status}
      </span>
    )
  if (status === 'Expiring Soon')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle size={9} /> {status}
      </span>
    )
  if (status === 'Permanent')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> {status}
      </span>
    )
  if (status === 'Expired')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {status}
      </span>
    )
  return <span className="text-[10px] text-gray-400">{status}</span>
}

/** Cert status badge (green/red pill) */
function CertBadge({ value }: { value: string }) {
  const isGreen = value === 'Certified' || value === 'Approved'
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        isGreen ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
      }`}
    >
      {value}
    </span>
  )
}

/** Key Contact row type */
interface KeyContact {
  id?: string
  name: string
  designation: string
  email: string
  phone: string
  isPrimary: boolean
}

/** Approved product row type */
interface ApprovedProduct {
  id?: string
  material: string
  specification: string
  form: string
  condition: string
  approvedOn: string
  status: string
}

/** Supplier document row type */
interface SupplierDoc {
  id?: string
  docType: string
  docNumber: string
  revision: string
  issueDate: string
  expiryDate: string
  status: string
}

function axiosError(err: unknown): string {
  const e = err as { response?: { data?: { detail?: unknown } } }
  const detail = e?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d: { message?: string }) => d.message).join('; ')
  return 'An error occurred'
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  // Data state
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<TabId>('general')

  // ---- Basic Information ----
  const [supplierCode, setSupplierCode] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [shortName, setShortName] = useState('')
  const [supplierType, setSupplierType] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [status, setStatus] = useState('Pending Approval')
  const [website, setWebsite] = useState('')

  // ---- Registration ----
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')
  const [tan, setTan] = useState('')
  const [cin, setCin] = useState('')
  const [iecCode, setIecCode] = useState('')
  const [msmeNo, setMsmeNo] = useState('')
  const [dateOfIncorporation, setDateOfIncorporation] = useState('')

  // ---- Contact ----
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMobile, setContactMobile] = useState('')

  // ---- Business ----
  const [businessNature, setBusinessNature] = useState('')
  const [supplyType, setSupplyType] = useState('')
  const [mainProducts, setMainProducts] = useState('')
  const [paymentTermsText, setPaymentTermsText] = useState('')
  const [incoterms, setIncoterms] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [annualTurnover, setAnnualTurnover] = useState('')
  const [preferredCurrency, setPreferredCurrency] = useState('INR')

  // ---- Address ----
  const [registeredAddress, setRegisteredAddress] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [billAddr1, setBillAddr1] = useState('')
  const [billAddr2, setBillAddr2] = useState('')
  const [billCity, setBillCity] = useState('')
  const [billState, setBillState] = useState('')
  const [billCountry, setBillCountry] = useState('India')
  const [billPin, setBillPin] = useState('')
  const [shipSameAsBill, setShipSameAsBill] = useState(false)
  const [shipAddr1, setShipAddr1] = useState('')
  const [shipAddr2, setShipAddr2] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipState, setShipState] = useState('')
  const [shipCountry, setShipCountry] = useState('India')
  const [shipPin, setShipPin] = useState('')

  // ---- Manufacturing & Capability ----
  const [manufacturingLocation, setManufacturingLocation] = useState('')
  const [plantSize, setPlantSize] = useState('')
  const [numEmployees, setNumEmployees] = useState('')
  const [equipmentFacility, setEquipmentFacility] = useState('')
  const [coreCompetencies, setCoreCompetencies] = useState('')
  const [capacityPerMonth, setCapacityPerMonth] = useState('')

  // ---- Certifications / Quality ----
  const [as9100Status, setAs9100Status] = useState('')
  const [nadcapStatus, setNadcapStatus] = useState('')
  const [iso9001Status, setIso9001Status] = useState('')
  const [iso14001Status, setIso14001Status] = useState('')
  const [iso45001Status, setIso45001Status] = useState('')
  const [otherCerts, setOtherCerts] = useState('')
  const [qaSystem, setQaSystem] = useState('')
  const [faiPpapSupport, setFaiPpapSupport] = useState('')

  // ---- Approved For ----
  const [approvedForRawMaterial, setApprovedForRawMaterial] = useState(false)
  const [approvedForSubContract, setApprovedForSubContract] = useState(false)
  const [approvedForHeatTreatment, setApprovedForHeatTreatment] = useState(false)
  const [approvedForSurface, setApprovedForSurface] = useState(false)
  const [approvedForNdt, setApprovedForNdt] = useState(false)
  const [approvedForOthers, setApprovedForOthers] = useState(false)
  const [approvedForOthersText, setApprovedForOthersText] = useState('')

  // ---- Banking ----
  const [bankName, setBankName] = useState('')
  const [bankBranch, setBankBranch] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountType, setBankAccountType] = useState('')
  const [bankIfscCode, setBankIfscCode] = useState('')
  const [bankMicrCode, setBankMicrCode] = useState('')
  const [bankUpiId, setBankUpiId] = useState('')

  // ---- Key Contacts ----
  const [contacts, setContacts] = useState<KeyContact[]>([
    { name: '', designation: '', email: '', phone: '', isPrimary: false },
  ])

  // ---- Approved Products ----
  const [approvedProducts, setApprovedProducts] = useState<ApprovedProduct[]>([])
  const [newProduct, setNewProduct] = useState({ material: '', specification: '', form: '', condition: '' })

  // ---- Documents ----
  const [supplierDocs, setSupplierDocs] = useState<SupplierDoc[]>([])
  const [newDoc, setNewDoc] = useState({ document_type: '', doc_number: '', expiry_date: '' })
  const [scorecard, setScorecard] = useState<SupplierScorecard | null>(null)

  // ---- Save / Action state ----
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [dgcaReference, setDgcaReference] = useState('')
  const [dgcaApprovalNumber, setDgcaApprovalNumber] = useState('')
  const [dgcaApprovalExpiry, setDgcaApprovalExpiry] = useState('')
  const [halSupplierCode, setHalSupplierCode] = useState('')
  const [halVendorCode, setHalVendorCode] = useState('')
  const [isroRegistrationNumber, setIsroRegistrationNumber] = useState('')
  const [isroVendorCode, setIsroVendorCode] = useState('')
  const [gstinLookupValue, setGstinLookupValue] = useState('')
  const [gstinLookupResult, setGstinLookupResult] = useState<GSTINLookupResponse | null>(null)
  const [gstinLookupLoading, setGstinLookupLoading] = useState(false)
  const [gstinLookupError, setGstinLookupError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Populate form from supplier
  // ---------------------------------------------------------------------------
  const populateForm = useCallback((s: Supplier) => {
    setSupplierCode(s.supplier_code)
    setSupplierName(s.supplier_name)
    setShortName(s.short_name ?? '')
    setSupplierType(s.supplier_type ?? '')
    setCategory(s.category ?? s.supply_category ?? '')
    setSubCategory(s.sub_category ?? '')
    setStatus(s.asl_status)
    setWebsite(s.website ?? '')

    setGstin(s.gstin ?? '')
    setPan(s.pan ?? '')
    setTan(s.tan ?? '')
    setCin(s.cin ?? '')
    setIecCode(s.iec_code ?? '')
    setMsmeNo(s.msme_no ?? '')
    setDateOfIncorporation(s.date_of_incorporation ?? '')

    setContactName(s.contact_name ?? '')
    setContactEmail(s.contact_email ?? '')
    setContactMobile(s.contact_mobile ?? '')

    setBusinessNature(s.business_nature ?? '')
    setSupplyType(s.supply_type ?? '')
    setMainProducts(s.main_products ?? '')
    setPaymentTermsText(s.payment_terms_text ?? '')
    setIncoterms(s.incoterms ?? '')
    setMinOrderValue(s.min_order_value != null ? String(s.min_order_value) : '')
    setAnnualTurnover(s.annual_turnover != null ? String(s.annual_turnover) : '')
    setPreferredCurrency(s.preferred_currency ?? 'INR')

    setRegisteredAddress(s.registered_address ?? '')
    setStateCode(s.state_code ?? '')

    setManufacturingLocation(s.manufacturing_location ?? '')
    setPlantSize(s.plant_size ?? '')
    setNumEmployees(s.num_employees != null ? String(s.num_employees) : '')
    setEquipmentFacility(s.equipment_facility ?? '')
    setCoreCompetencies(s.core_competencies ?? '')
    setCapacityPerMonth(s.capacity_per_month ?? '')

    setAs9100Status(s.as9100_status ?? '')
    setNadcapStatus(s.nadcap_status ?? '')
    setIso9001Status(s.iso9001_status ?? '')
    setIso14001Status(s.iso14001_status ?? '')
    setIso45001Status(s.iso45001_status ?? '')
    setOtherCerts(s.other_certifications ?? '')
    setQaSystem(s.qa_system ?? '')
    setFaiPpapSupport(s.fai_ppap_support ?? '')

    setApprovedForRawMaterial(s.approved_for_raw_material ?? false)
    setApprovedForSubContract(s.approved_for_sub_contract ?? false)
    setApprovedForHeatTreatment(s.approved_for_heat_treatment ?? false)
    setApprovedForSurface(s.approved_for_surface ?? false)
    setApprovedForNdt(s.approved_for_ndt ?? false)
    setApprovedForOthers(s.approved_for_others ?? false)
    setApprovedForOthersText(s.approved_for_others_text ?? '')

    setBankName(s.bank_name ?? '')
    setBankBranch(s.bank_branch ?? '')
    setBankAccountNumber(s.bank_account_number ?? '')
    setBankAccountType(s.bank_account_type ?? '')
    setBankIfscCode(s.bank_ifsc_code ?? '')
    setBankMicrCode(s.bank_micr_code ?? '')
    setBankUpiId(s.bank_upi_id ?? '')
    const sx = s as unknown as Record<string, string | null>
    setDgcaReference(sx.dgca_reference ?? '')
    setDgcaApprovalNumber(sx.dgca_approval_number ?? '')
    setDgcaApprovalExpiry(sx.dgca_approval_expiry ?? '')
    setHalSupplierCode(sx.hal_supplier_code ?? '')
    setHalVendorCode(sx.hal_vendor_code ?? '')
    setIsroRegistrationNumber(sx.isro_registration_number ?? '')
    setIsroVendorCode(sx.isro_vendor_code ?? '')
  }, [])

  const loadContacts = useCallback(async (sid: string, fallback?: Supplier) => {
    try {
      const list = await listSupplierContacts(sid)
      if ((list ?? []).length > 0) {
        setContacts((list ?? []).map((c) => ({ id: c.id, name: c.name ?? '', designation: c.designation ?? '', email: c.email ?? '', phone: c.phone ?? '', isPrimary: !!c.is_primary })))
      } else {
        const f = fallback as unknown as { contact_name?: string; contact_email?: string; contact_mobile?: string } | undefined
        if (f && (f.contact_name || f.contact_email || f.contact_mobile)) {
          setContacts([{ name: f.contact_name ?? '', designation: '', email: f.contact_email ?? '', phone: f.contact_mobile ?? '', isPrimary: true }])
        }
      }
    } catch { /* keep existing rows on error */ }
  }, [])

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isNew) return
    let active = true
    setLoading(true)
    setLoadError(null)
    getSupplier(id!)
      .then((data) => {
        if (!active) return
        setSupplier(data)
        populateForm(data)
        loadContacts(id!, data)
        listSupplierApprovedProducts(id!).then((ps) => setApprovedProducts((ps ?? []).map((x) => ({ id: x.id, material: x.material ?? '', specification: x.specification ?? '', form: x.form ?? '', condition: x.condition ?? '', approvedOn: x.approved_on ?? '', status: x.status ?? 'Approved' })))).catch(() => {})
        listSupplierDocuments(id!).then((ds) => setSupplierDocs((ds ?? []).map((x) => ({ id: x.id, docType: x.document_type ?? '', docNumber: x.doc_number ?? '', revision: x.revision ?? '', issueDate: x.issue_date ?? '', expiryDate: x.expiry_date ?? '', status: x.status ?? 'Valid' })))).catch(() => {})
        getScorecard(id!).then(setScorecard).catch(() => {})
      })
      .catch((err) => {
        if (active) setLoadError(axiosError(err))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isNew, populateForm, loadContacts])

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
  // Build save payload
  // ---------------------------------------------------------------------------
  const buildPayload = () => ({
    supplier_name: supplierName.trim(),
    short_name: shortName.trim() || undefined,
    supplier_type: supplierType || undefined,
    category: category || undefined,
    sub_category: subCategory.trim() || undefined,
    website: website.trim() || undefined,
    gstin: gstin.trim() || undefined,
    registered_address: registeredAddress.trim() || undefined,
    state_code: stateCode.trim() || undefined,
    pan: pan.trim() || undefined,
    tan: tan.trim() || undefined,
    cin: cin.trim() || undefined,
    iec_code: iecCode.trim() || undefined,
    msme_no: msmeNo.trim() || undefined,
    date_of_incorporation: dateOfIncorporation || undefined,
    contact_name: contactName.trim() || undefined,
    contact_email: contactEmail.trim() || undefined,
    contact_mobile: contactMobile.trim() || undefined,
    supply_category: category || undefined,
    business_nature: businessNature || undefined,
    supply_type: supplyType || undefined,
    main_products: mainProducts.trim() || undefined,
    payment_terms_text: paymentTermsText || undefined,
    incoterms: incoterms.trim() || undefined,
    min_order_value: minOrderValue ? parseFloat(minOrderValue) : undefined,
    annual_turnover: annualTurnover ? parseFloat(annualTurnover) : undefined,
    preferred_currency: preferredCurrency || undefined,
    manufacturing_location: manufacturingLocation.trim() || undefined,
    plant_size: plantSize.trim() || undefined,
    num_employees: numEmployees ? parseInt(numEmployees) : undefined,
    equipment_facility: equipmentFacility.trim() || undefined,
    core_competencies: coreCompetencies.trim() || undefined,
    capacity_per_month: capacityPerMonth.trim() || undefined,
    as9100_status: as9100Status || undefined,
    nadcap_status: nadcapStatus || undefined,
    iso9001_status: iso9001Status || undefined,
    iso14001_status: iso14001Status || undefined,
    iso45001_status: iso45001Status || undefined,
    other_certifications: otherCerts.trim() || undefined,
    qa_system: qaSystem.trim() || undefined,
    fai_ppap_support: faiPpapSupport || undefined,
    approved_for_raw_material: approvedForRawMaterial,
    approved_for_sub_contract: approvedForSubContract,
    approved_for_heat_treatment: approvedForHeatTreatment,
    approved_for_surface: approvedForSurface,
    approved_for_ndt: approvedForNdt,
    approved_for_others: approvedForOthers,
    approved_for_others_text: approvedForOthersText.trim() || undefined,
    bank_name: bankName.trim() || undefined,
    bank_branch: bankBranch.trim() || undefined,
    bank_account_number: bankAccountNumber.trim() || undefined,
    bank_account_type: bankAccountType || undefined,
    bank_ifsc_code: bankIfscCode.trim() || undefined,
    bank_micr_code: bankMicrCode.trim() || undefined,
    bank_upi_id: bankUpiId.trim() || undefined,
    dgca_reference: dgcaReference.trim() || undefined,
    dgca_approval_number: dgcaApprovalNumber.trim() || undefined,
    dgca_approval_expiry: dgcaApprovalExpiry || undefined,
    hal_supplier_code: halSupplierCode.trim() || undefined,
    hal_vendor_code: halVendorCode.trim() || undefined,
    isro_registration_number: isroRegistrationNumber.trim() || undefined,
    isro_vendor_code: isroVendorCode.trim() || undefined,
  })

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const resetForm = () => {
    setSupplierCode(''); setSupplierName(''); setShortName(''); setSupplierType(''); setCategory(''); setSubCategory(''); setStatus('Pending Approval'); setWebsite('')
    setGstin(''); setPan(''); setTan(''); setCin(''); setIecCode(''); setMsmeNo(''); setDateOfIncorporation('')
    setContactName(''); setContactEmail(''); setContactMobile('')
    setBusinessNature(''); setSupplyType(''); setMainProducts(''); setPaymentTermsText(''); setIncoterms(''); setMinOrderValue(''); setAnnualTurnover(''); setPreferredCurrency('INR')
    setRegisteredAddress(''); setStateCode(''); setBillAddr1(''); setBillAddr2(''); setBillCity(''); setBillState(''); setBillCountry('India'); setBillPin(''); setShipSameAsBill(false); setShipAddr1(''); setShipAddr2(''); setShipCity(''); setShipState(''); setShipCountry('India'); setShipPin('')
    setManufacturingLocation(''); setPlantSize(''); setNumEmployees(''); setEquipmentFacility(''); setCoreCompetencies(''); setCapacityPerMonth('')
    setAs9100Status(''); setNadcapStatus(''); setIso9001Status(''); setIso14001Status(''); setIso45001Status(''); setOtherCerts(''); setQaSystem(''); setFaiPpapSupport('')
    setApprovedForRawMaterial(false); setApprovedForSubContract(false); setApprovedForHeatTreatment(false); setApprovedForSurface(false); setApprovedForNdt(false); setApprovedForOthers(false); setApprovedForOthersText('')
    setBankName(''); setBankBranch(''); setBankAccountNumber(''); setBankAccountType(''); setBankIfscCode(''); setBankMicrCode(''); setBankUpiId('')
    setContacts([{ name: '', designation: '', email: '', phone: '', isPrimary: false }])
    setApprovedProducts([]); setNewProduct({ material: '', specification: '', form: '', condition: '' }); setSupplierDocs([]); setNewDoc({ document_type: '', doc_number: '', expiry_date: '' })
    setDgcaReference(''); setDgcaApprovalNumber(''); setDgcaApprovalExpiry(''); setHalSupplierCode(''); setHalVendorCode(''); setIsroRegistrationNumber(''); setIsroVendorCode('')
    setGstinLookupValue(''); setGstinLookupResult(null); setGstinLookupError(null)
  }

  const handleDiscard = () => {
    setSaveError(null); setSaveSuccess(false)
    if (isNew) { resetForm() }
    else if (supplier) { populateForm(supplier); loadContacts(id!, supplier) }
  }

  const handleSave = async () => {
    const errs: string[] = []
    if (isNew) {
      if (!supplierCode.trim()) errs.push('Supplier Code is required')
      else if (supplierCode.trim().length < 2) errs.push('Supplier Code must be at least 2 characters')
      if (!supplierType) errs.push('Supplier Type is required')
      if (!category) errs.push('Supply Category is required')
      if (!businessNature) errs.push('Business Nature is required')
    }
    if (!supplierName.trim()) errs.push('Supplier Name is required')
    const _g = gstin.trim().toUpperCase(); if (_g && !validateGSTIN(_g)) errs.push('GSTIN is invalid (15-char format)')
    const _p = pan.trim().toUpperCase(); if (_p && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(_p)) errs.push('PAN is invalid (format AAAAA0000A)')
    const _t = tan.trim().toUpperCase(); if (_t && !/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(_t)) errs.push('TAN is invalid (format AAAA00000A)')
    const _c = cin.trim().toUpperCase(); if (_c && !/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(_c)) errs.push('CIN is invalid (21-char format)')
    const _if = bankIfscCode.trim().toUpperCase(); if (_if && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(_if)) errs.push('IFSC is invalid (format AAAA0XXXXXX)')
    const _em = contactEmail.trim(); if (_em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_em)) errs.push('Contact email is invalid')
    const _mo = contactMobile.trim(); if (_mo && !/^[6-9][0-9]{9}$/.test(_mo)) errs.push('Contact mobile must be a 10-digit Indian number')
    if (errs.length) { setSaveError(errs.join('. ')); return }
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      if (isNew) {
        const created = await createSupplier({
          supplier_code: supplierCode.trim(),
          ...buildPayload(),
        })
        await persistContacts(created.id)
        navigate(`/masters/suppliers/${created.id}`, { replace: true })
      } else {
        const updated = await updateSupplier(id!, buildPayload())
        setSupplier(updated)
        await persistContacts(id!)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err: unknown) {
      setSaveError(axiosError(err))
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // ASL Actions
  // ---------------------------------------------------------------------------
  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const updated = await approveSupplier(id)
      setSupplier(updated)
      setStatus(updated.asl_status)
    } catch (err) { alert(axiosError(err)) }
    finally { setActionLoading(false) }
  }

  const handleSuspend = async () => {
    if (!id || !confirm('Suspend this supplier? They will be removed from the AVL.')) return
    setActionLoading(true)
    try {
      const updated = await suspendSupplier(id)
      setSupplier(updated)
      setStatus(updated.asl_status)
    } catch (err) { alert(axiosError(err)) }
    finally { setActionLoading(false) }
  }

  const handleDelist = async () => {
    const reason = window.prompt('Enter reason for delisting (required):')
    if (!reason?.trim()) return
    if (!id) return
    setActionLoading(true)
    try {
      const updated = await delistSupplier(id, reason.trim())
      setSupplier(updated)
      setStatus(updated.asl_status)
    } catch (err) { alert(axiosError(err)) }
    finally { setActionLoading(false) }
  }

  const handleRestore = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const updated = await restoreSupplier(id)
      setSupplier(updated)
      setStatus(updated.asl_status)
    } catch (err) { alert(axiosError(err)) }
    finally { setActionLoading(false) }
  }

  // ---------------------------------------------------------------------------
  // Contact helpers
  // ---------------------------------------------------------------------------
  const addContact = () =>
    setContacts((prev) => [...prev, { name: '', designation: '', email: '', phone: '', isPrimary: false }])
  const updateContact = (idx: number, field: keyof KeyContact, value: string | boolean) =>
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))

  const removeContact = async (idx: number) => {
    const c = contacts[idx]
    if (c?.id && !isNew) { try { await deleteSupplierContact(id!, c.id) } catch { /* ignore */ } }
    setContacts((prev) => prev.filter((_, i) => i !== idx))
  }

  const persistContacts = async (sid: string) => {
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i]
      if (!c.id && c.name.trim()) {
        try {
          await addSupplierContact(sid, { name: c.name.trim(), designation: c.designation.trim() || undefined, email: c.email.trim() || undefined, phone: c.phone.trim() || undefined, is_primary: c.isPrimary || (i === 0 && !contacts.some((x) => x.isPrimary)) })
        } catch { /* continue with the rest */ }
      }
    }
    await loadContacts(sid)
  }

  const handleDeleteProduct = async (idx: number) => {
    const p = approvedProducts[idx]
    if (p.id && !isNew) { try { await deleteSupplierApprovedProduct(id!, p.id) } catch { /* ignore */ } }
    setApprovedProducts((prev) => prev.filter((_, i) => i !== idx))
  }
  const handleAddProduct = async () => {
    if (!newProduct.material.trim()) return
    if (isNew) { setSaveError('Save the supplier before adding approved products.'); return }
    try {
      const c = await addSupplierApprovedProduct(id!, { material: newProduct.material.trim(), specification: newProduct.specification.trim() || undefined, form: newProduct.form.trim() || undefined, condition: newProduct.condition.trim() || undefined })
      setApprovedProducts((prev) => [...prev, { id: c.id, material: c.material ?? '', specification: c.specification ?? '', form: c.form ?? '', condition: c.condition ?? '', approvedOn: c.approved_on ?? '', status: c.status ?? 'Approved' }])
      setNewProduct({ material: '', specification: '', form: '', condition: '' })
    } catch (err) { setSaveError(axiosError(err)) }
  }
  const handleDeleteDoc = async (idx: number) => {
    const d = supplierDocs[idx]
    if (d.id && !isNew) { try { await deleteSupplierDocument(id!, d.id) } catch { /* ignore */ } }
    setSupplierDocs((prev) => prev.filter((_, i) => i !== idx))
  }
  const handleAddDoc = async () => {
    if (!newDoc.document_type.trim()) return
    if (isNew) { setSaveError('Save the supplier before adding documents.'); return }
    try {
      const c = await addSupplierDocument(id!, { document_type: newDoc.document_type.trim(), doc_number: newDoc.doc_number.trim() || undefined, expiry_date: newDoc.expiry_date || undefined })
      setSupplierDocs((prev) => [...prev, { id: c.id, docType: c.document_type ?? '', docNumber: c.doc_number ?? '', revision: c.revision ?? '', issueDate: c.issue_date ?? '', expiryDate: c.expiry_date ?? '', status: c.status ?? 'Valid' }])
      setNewDoc({ document_type: '', doc_number: '', expiry_date: '' })
    } catch (err) { setSaveError(axiosError(err)) }
  }

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
      if (result.legal_name) setSupplierName(result.legal_name)
      if (result.state_code) setStateCode(result.state_code)
      if (result.registered_address) setRegisteredAddress(result.registered_address)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } }
      setGstinLookupError(ax?.response?.data?.detail ?? 'GSTIN lookup failed')
    } finally { setGstinLookupLoading(false) }
  }

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          Loading supplier...
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

  const currentStatus = supplier?.asl_status ?? status ?? 'Pending Approval'
  const displayName = isNew ? 'New Supplier' : (supplier?.supplier_name ?? supplierName ?? 'Supplier Detail')

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="w-full flex flex-col gap-0">

      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-t-xl px-4 py-3">
        <button onClick={() => navigate('/masters/suppliers')} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#005c87] mb-2">
          <ArrowLeft size={13} /> Back to Suppliers
        </button>
        <div className="flex items-start gap-4">

          {/* Logo box */}
          <div className="w-16 h-16 rounded border-2 border-gray-300 bg-[#1a3a6b] flex flex-col items-center justify-center shrink-0 p-1">
            <span className="text-[7px] font-bold text-white text-center leading-tight tracking-wide">
              {shortName ? shortName.split(' ').slice(0, 2).join('\n') : (supplierName ? supplierName.split(' ').slice(0, 2).join('\n') : 'SUPPLIER')}
            </span>
            <span className="text-[5px] text-blue-200 text-center leading-tight mt-0.5">PVT LTD</span>
          </div>

          {/* Supplier info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">{displayName}</h1>
              <StateMachineBadge state={currentStatus} />
              {currentStatus === 'Active' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  APPROVED
                </span>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-500 flex-wrap mt-0.5 gap-0">
              {supplierCode && <span>Supplier Code : {supplierCode}</span>}
              {supplierType && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Supplier Type : {supplierType}</span>
                </>
              )}
              {category && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Category : {category}</span>
                </>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-400 flex-wrap mt-0.5 gap-0">
              {gstin && <span>GSTIN : {gstin}</span>}
              {pan && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>PAN : {pan}</span>
                </>
              )}
              {preferredCurrency && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Currency : {preferredCurrency}</span>
                </>
              )}
            </div>
          </div>

          {/* Cert badges */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {nadcapStatus === 'Approved' && (
              <div className="flex flex-col items-center border border-gray-200 rounded px-3 py-1.5 bg-white">
                <span className="text-xs font-black text-[#1a3a6b] tracking-wide">NADCAP</span>
                <span className="text-[9px] text-gray-400">Administered by PRI</span>
              </div>
            )}
            {as9100Status === 'Certified' && (
              <div className="flex items-center gap-1 border border-gray-200 rounded px-3 py-1.5 bg-white">
                <Shield size={13} className="text-green-700" />
                <div>
                  <div className="text-[10px] font-bold text-gray-800">AS 9100</div>
                  <div className="text-[9px] text-gray-500">REV D CERTIFIED</div>
                </div>
              </div>
            )}
          </div>

          {/* Dates + Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {currentStatus === 'Pending Approval' && (
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
                  onClick={handleSuspend}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  Suspend
                </button>
              )}
              {currentStatus === 'Suspended' && (
                <button
                  onClick={handleRestore}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Restore
                </button>
              )}
              {currentStatus !== 'Delisted' && !isNew && (
                <button
                  onClick={handleDelist}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={12} /> Delist
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Actions ▼
                </button>
                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-20 py-1">
                    <button
                      onClick={() => { handleSave(); setShowActionsMenu(false) }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowActionsMenu(false)} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                      Print
                    </button>
                    <button onClick={() => setShowActionsMenu(false)} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                      Export
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 text-right space-y-0.5">
              {supplier?.created_at && <div>Created On : {formatDate(supplier.created_at)}</div>}
              <div>Created By : Admin User</div>
              {supplier?.updated_at && <div>Last Modified On : {formatDate(supplier.updated_at)}</div>}
              <div>Last Modified By : Admin User</div>
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

      {/* Save feedback bar */}
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

        {/* ---- GENERAL INFORMATION ---------------------------------------- */}
        {activeTab === 'general' && (
          <div className="flex flex-col gap-3">

            {/* GSTIN Verify & Fetch */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2"><Shield size={14} className="text-[#005c87]" /><h3 className="text-xs font-semibold text-gray-700">GSTIN Verification</h3></div>
              <div className="flex gap-3 items-end">
                <div className="flex-1 max-w-sm"><GSTINInput label="GSTIN" value={gstinLookupValue} onChange={setGstinLookupValue} /></div>
                <Button variant="primary" onClick={handleGstinLookup} loading={gstinLookupLoading} disabled={!gstinLookupValue.trim()}>Verify &amp; Fetch</Button>
              </div>
              {gstinLookupError && <p className="mt-2 text-xs text-red-600">{gstinLookupError}</p>}
              {gstinLookupResult && (
                <div className={`mt-3 rounded-lg border p-3 ${gstinLookupResult.confidence >= 1.0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2"><span className="text-xs font-semibold text-gray-700">{gstinLookupResult.confidence >= 1.0 ? '✓ Verified — fields populated from GST registry' : '⚠ Format valid — State & PAN decoded'}</span><ConfidenceBadge score={gstinLookupResult.confidence} /></div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[{ label: 'Legal Name', val: gstinLookupResult.legal_name }, { label: 'PAN', val: gstinLookupValue.trim().substring(2, 12) }, { label: 'State', val: gstinLookupResult.state_name ?? gstinLookupResult.state_code }, { label: 'Status', val: gstinLookupResult.status }].filter((f) => f.val).map((f) => (
                      <div key={f.label} className="bg-white rounded p-2 border border-gray-100"><div className="text-gray-400 mb-0.5">{f.label}</div><div className="font-medium text-gray-800 truncate" title={f.val ?? ''}>{f.val}</div></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Row 1: 4 columns */}
            <div className="grid grid-cols-4 gap-3 items-start content-start">

              {/* Column 1 - Basic Information */}
              <SectionCard
                icon={<Info size={12} className="text-blue-500" />}
                title="Basic Information"
                color="bg-blue-50"
              >
                <FieldRow label="Supplier Code" required>
                  <FieldInput
                    value={supplierCode}
                    onChange={(v) => setSupplierCode(v.toUpperCase())}
                    placeholder="SUP-1001"
                    disabled={!isNew}
                  />
                </FieldRow>
                <FieldRow label="Supplier Name" required>
                  <FieldInput value={supplierName} onChange={setSupplierName} placeholder="Full legal name" />
                </FieldRow>
                <FieldRow label="Short Name">
                  <FieldInput value={shortName} onChange={setShortName} placeholder="Short name" />
                </FieldRow>
                <FieldRow label="Supplier Type" required>
                  <FieldSelect value={supplierType} onChange={setSupplierType} options={SUPPLIER_TYPE_OPTIONS} />
                </FieldRow>
                <FieldRow label="Category" required>
                  <FieldSelect value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
                </FieldRow>
                <FieldRow label="Sub Category">
                  <FieldInput value={subCategory} onChange={setSubCategory} placeholder="Metal / Alloy" />
                </FieldRow>
                <FieldRow label="Status" required>
                  <FieldSelect value={currentStatus} onChange={setStatus} options={STATUS_OPTIONS} />
                </FieldRow>
                <FieldRow label="Website">
                  <FieldInput value={website} onChange={setWebsite} placeholder="www.example.in" />
                </FieldRow>
              </SectionCard>

              {/* Column 2 - Registration Details */}
              <SectionCard
                icon={<Shield size={12} className="text-purple-500" />}
                title="Registration Details"
                color="bg-purple-50"
              >
                <FieldRow label="GSTIN" required>
                  <FieldInput
                    value={gstin}
                    onChange={(v) => setGstin(v.toUpperCase())}
                    placeholder="29AAABCP1234Q1Z5"
                    maxLength={15}
                  />
                </FieldRow>
                <FieldRow label="PAN" required>
                  <FieldInput value={pan} onChange={(v) => setPan(v.toUpperCase())} placeholder="AABCP1234Q" maxLength={10} />
                </FieldRow>
                <FieldRow label="TAN">
                  <FieldInput value={tan} onChange={(v) => setTan(v.toUpperCase())} placeholder="BLRP01234F" maxLength={10} />
                </FieldRow>
                <FieldRow label="CIN">
                  <FieldInput value={cin} onChange={(v) => setCin(v.toUpperCase())} placeholder="U27109KA2010PTC053789" maxLength={21} />
                </FieldRow>
                <FieldRow label="IEC">
                  <FieldInput value={iecCode} onChange={(v) => setIecCode(v.toUpperCase())} placeholder="AABCP1234Q" maxLength={10} />
                </FieldRow>
                <FieldRow label="MSME No.">
                  <FieldInput value={msmeNo} onChange={setMsmeNo} placeholder="UDYAM-KR-03-0012345" maxLength={30} />
                </FieldRow>
                <FieldRow label="Date of Incorp.">
                  <FieldInput value={dateOfIncorporation} onChange={setDateOfIncorporation} type="date" />
                </FieldRow>
              </SectionCard>

              {/* Column 3 - Business Information */}
              <SectionCard
                icon={<BarChart2 size={12} className="text-green-500" />}
                title="Business Information"
                color="bg-green-50"
              >
                <FieldRow label="Business Nature" required>
                  <FieldSelect value={businessNature} onChange={setBusinessNature} options={BUSINESS_NATURE_OPTIONS} />
                </FieldRow>
                <FieldRow label="Service / Supply">
                  <FieldSelect value={supplyType} onChange={setSupplyType} options={SUPPLY_TYPE_OPTIONS} />
                </FieldRow>
                <FieldRow label="Main Products">
                  <FieldInput value={mainProducts} onChange={setMainProducts} placeholder="Aluminium, Titanium, SS Alloys" />
                </FieldRow>
                <FieldRow label="Payment Terms" required>
                  <FieldSelect value={paymentTermsText} onChange={setPaymentTermsText} options={PAYMENT_TERMS_OPTIONS} />
                </FieldRow>
                <FieldRow label="Incoterms">
                  <FieldInput value={incoterms} onChange={(v) => setIncoterms(v.toUpperCase())} placeholder="DDP" maxLength={10} />
                </FieldRow>
                <FieldRow label="Min. Order (₹)">
                  <FieldInput value={minOrderValue} onChange={setMinOrderValue} type="number" placeholder="25000.00" />
                </FieldRow>
                <FieldRow label="Annual Turnover">
                  <FieldInput value={annualTurnover} onChange={setAnnualTurnover} type="number" placeholder="500000000.00" />
                </FieldRow>
                <FieldRow label="Currency">
                  <FieldSelect value={preferredCurrency} onChange={setPreferredCurrency} options={CURRENCY_OPTIONS} />
                </FieldRow>
              </SectionCard>

              {/* Column 4 - Key Contacts */}
              <SectionCard
                icon={<Users size={12} className="text-orange-500" />}
                title="Key Contacts"
                color="bg-orange-50"
                headerRight={
                  <button className="text-[10px] text-[#005c87] hover:underline">
                    Manage Contacts
                  </button>
                }
              >
                <div className="px-3 py-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1 text-gray-500 font-medium pr-1">Name</th>
                        <th className="text-left py-1 text-gray-500 font-medium pr-1">Designation</th>
                        <th className="text-left py-1 text-gray-500 font-medium pr-1">Email</th>
                        <th className="text-left py-1 text-gray-500 font-medium pr-1">Phone</th>
                        <th className="text-left py-1 text-gray-500 font-medium">Primary</th>
                        <th className="text-left py-1 text-gray-500 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1 pr-1">
                            <input
                              value={c.name}
                              onChange={(e) => updateContact(i, 'name', e.target.value)}
                              className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5"
                              placeholder="Name"
                            />
                          </td>
                          <td className="py-1 pr-1">
                            <input
                              value={c.designation}
                              onChange={(e) => updateContact(i, 'designation', e.target.value)}
                              className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5 text-gray-500"
                              placeholder="Designation"
                            />
                          </td>
                          <td className="py-1 pr-1">
                            <input
                              value={c.email}
                              onChange={(e) => updateContact(i, 'email', e.target.value)}
                              className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5 text-blue-600"
                              placeholder="email@co.in"
                            />
                          </td>
                          <td className="py-1 pr-1">
                            <input
                              value={c.phone}
                              onChange={(e) => updateContact(i, 'phone', e.target.value)}
                              className="w-full text-xs border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5"
                              placeholder="+91 ..."
                            />
                          </td>
                          <td className="py-1 text-center">
                            <input
                              type="checkbox"
                              checked={c.isPrimary}
                              onChange={(e) => updateContact(i, 'isPrimary', e.target.checked)}
                              className="rounded accent-[#005c87]"
                            />
                          </td>
                          <td className="py-1 text-right">
                            <button type="button" title="Delete" onClick={() => removeContact(i)}><Trash2 size={12} className="text-gray-300 hover:text-red-500" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addContact}
                    className="mt-2 text-xs text-[#005c87] flex items-center gap-1 hover:text-[#004a6e]"
                  >
                    <Plus size={11} /> Add Contact
                  </button>
                </div>
              </SectionCard>
            </div>

            {/* Row 2: 4 sections */}
            <div className="grid grid-cols-4 gap-3 items-start content-start">

              {/* Manufacturing & Capability */}
              <SectionCard
                icon={<Factory size={12} className="text-teal-600" />}
                title="Manufacturing & Capability"
                color="bg-teal-50"
              >
                <FieldRow label="Location">
                  <FieldInput value={manufacturingLocation} onChange={setManufacturingLocation} placeholder="Bengaluru, Karnataka" />
                </FieldRow>
                <FieldRow label="Plant Size">
                  <FieldInput value={plantSize} onChange={setPlantSize} placeholder="45,000 Sq.Ft" />
                </FieldRow>
                <FieldRow label="No. of Employees">
                  <FieldInput value={numEmployees} onChange={setNumEmployees} type="number" placeholder="120" />
                </FieldRow>
                <FieldRow label="Equipment">
                  <FieldInput value={equipmentFacility} onChange={setEquipmentFacility} placeholder="CNC, Forging, Heat Treatment" />
                </FieldRow>
                <FieldRow label="Core Competencies">
                  <FieldInput value={coreCompetencies} onChange={setCoreCompetencies} placeholder="High Precision Machining" />
                </FieldRow>
                <FieldRow label="Capacity / Month">
                  <FieldInput value={capacityPerMonth} onChange={setCapacityPerMonth} placeholder="150 Tons" />
                </FieldRow>
              </SectionCard>

              {/* Quality & Compliance Summary */}
              <SectionCard
                icon={<Shield size={12} className="text-blue-500" />}
                title="Quality & Compliance Summary"
                color="bg-blue-50"
              >
                <FieldRow label="AS 9100 Rev D">
                  <div className="flex items-center gap-2">
                    <FieldSelect value={as9100Status} onChange={setAs9100Status} options={CERT_STATUS_OPTIONS} />
                    {as9100Status && <CertBadge value={as9100Status} />}
                  </div>
                </FieldRow>
                <FieldRow label="NADCAP">
                  <div className="flex items-center gap-2">
                    <FieldSelect value={nadcapStatus} onChange={setNadcapStatus} options={NADCAP_STATUS_OPTIONS} />
                    {nadcapStatus && <CertBadge value={nadcapStatus} />}
                  </div>
                </FieldRow>
                <FieldRow label="ISO 9001:2015">
                  <div className="flex items-center gap-2">
                    <FieldSelect value={iso9001Status} onChange={setIso9001Status} options={CERT_STATUS_OPTIONS} />
                    {iso9001Status && <CertBadge value={iso9001Status} />}
                  </div>
                </FieldRow>
                <FieldRow label="ISO 14001:2015">
                  <div className="flex items-center gap-2">
                    <FieldSelect value={iso14001Status} onChange={setIso14001Status} options={CERT_STATUS_OPTIONS} />
                    {iso14001Status && <CertBadge value={iso14001Status} />}
                  </div>
                </FieldRow>
                <FieldRow label="ISO 45001:2018">
                  <div className="flex items-center gap-2">
                    <FieldSelect value={iso45001Status} onChange={setIso45001Status} options={CERT_STATUS_OPTIONS} />
                    {iso45001Status && <CertBadge value={iso45001Status} />}
                  </div>
                </FieldRow>
                <FieldRow label="Other Certs">
                  <FieldInput value={otherCerts} onChange={setOtherCerts} placeholder="IATF 16949, ISO 27001" />
                </FieldRow>
                <FieldRow label="QA System">
                  <FieldInput value={qaSystem} onChange={setQaSystem} placeholder="Online Quality Portal" />
                </FieldRow>
                <FieldRow label="FAI / PPAP">
                  <FieldInput value={faiPpapSupport} onChange={setFaiPpapSupport} placeholder="Yes / No" />
                </FieldRow>

              </SectionCard>

              {/* Performance Summary */}
              <SectionCard
                icon={<BarChart2 size={12} className="text-green-500" />}
                title="Performance Summary (Last 12 Months)"
                color="bg-green-50"
              >
                <div className="px-3 py-2 space-y-2">
                  {([
                    ['On-Time Delivery', 4.6],
                    ['Quality Rating (PPM)', 4.7],
                    ['Response & Support', 4.3],
                    ['Price Competitiveness', 4.2],
                    ['Overall Rating', 4.5],
                  ] as [string, number][]).map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 w-36 shrink-0">{label}</span>
                      <StarRating value={val} />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">Overall Status</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Approved Supplier
                    </span>
                  </div>
                </div>
              </SectionCard>

              {/* Approved For */}
              <SectionCard
                icon={<Star size={12} className="text-yellow-500" />}
                title="Approved For"
                color="bg-yellow-50"
              >
                <div className="px-3 py-2 space-y-1.5">
                  {([
                    ['Raw Material Supply', approvedForRawMaterial, setApprovedForRawMaterial],
                    ['Sub-Contract Machining', approvedForSubContract, setApprovedForSubContract],
                    ['Heat Treatment', approvedForHeatTreatment, setApprovedForHeatTreatment],
                    ['Surface Treatment', approvedForSurface, setApprovedForSurface],
                    ['NDT Services', approvedForNdt, setApprovedForNdt],
                  ] as [string, boolean, (v: boolean) => void][]).map(([label, checked, setter]) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setter(e.target.checked)}
                        className="rounded accent-[#005c87] w-3.5 h-3.5"
                      />
                      <span className="text-[11px] text-gray-700">{label}</span>
                    </label>
                  ))}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvedForOthers}
                      onChange={(e) => setApprovedForOthers(e.target.checked)}
                      className="rounded accent-[#005c87] w-3.5 h-3.5 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-[11px] text-gray-700">Others:</span>
                      {approvedForOthers && (
                        <input
                          value={approvedForOthersText}
                          onChange={(e) => setApprovedForOthersText(e.target.value)}
                          placeholder="Specify..."
                          className="w-full text-[11px] border-0 border-b border-gray-200 focus:border-[#005c87] focus:outline-none bg-transparent py-0.5 mt-0.5"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </SectionCard>
            </div>

            {/* Row 3: Approved Products (2 cols) + Banking (1) + Documents (1) */}
            <div className="grid grid-cols-4 gap-3 items-start content-start">

              {/* Approved Products / Materials - col-span-2 */}
              <div className="col-span-2 self-start">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden self-start">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-teal-50">
                    <Package size={12} className="text-teal-600" />
                    <h3 className="text-xs font-semibold text-gray-700">Approved Products / Materials</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-2 py-1.5 text-left text-gray-500 font-medium">S.No.</th>
                          <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Material / Product</th>
                          <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Specification</th>
                          <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Form</th>
                          <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Condition</th>
                          <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Approved On</th>
                          <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedProducts.map((p, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                            <td className="px-2 py-1.5 text-gray-700 font-medium">{p.material}</td>
                            <td className="px-2 py-1.5 text-gray-500">{p.specification}</td>
                            <td className="px-2 py-1.5 text-gray-500">{p.form}</td>
                            <td className="px-2 py-1.5 text-gray-500">{p.condition}</td>
                            <td className="px-2 py-1.5 text-gray-500">{p.approvedOn}</td>
                            <td className="px-2 py-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {approvedProducts.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                              No approved products / materials yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <SectionCard
                icon={<Shield size={12} className="text-indigo-500" />}
                title="Banking Information"
                color="bg-indigo-50"
              >
                <FieldRow label="Bank Name" required>
                  <FieldInput value={bankName} onChange={setBankName} placeholder="HDFC Bank Ltd" />
                </FieldRow>
                <FieldRow label="Branch" required>
                  <FieldInput value={bankBranch} onChange={setBankBranch} placeholder="Whitefield, Bengaluru" />
                </FieldRow>
                <FieldRow label="Account No." required>
                  <FieldInput value={bankAccountNumber} onChange={setBankAccountNumber} placeholder="S0200012345678" maxLength={30} />
                </FieldRow>
                <FieldRow label="Account Type" required>
                  <FieldSelect value={bankAccountType} onChange={setBankAccountType} options={BANK_ACCOUNT_TYPE_OPTIONS} />
                </FieldRow>
                <FieldRow label="IFSC Code" required>
                  <FieldInput value={bankIfscCode} onChange={(v) => setBankIfscCode(v.toUpperCase())} placeholder="HDFC0001234" maxLength={11} />
                </FieldRow>
                <FieldRow label="MICR Code">
                  <FieldInput value={bankMicrCode} onChange={setBankMicrCode} placeholder="560240002" maxLength={9} />
                </FieldRow>
                <FieldRow label="UPI ID">
                  <FieldInput value={bankUpiId} onChange={setBankUpiId} placeholder="pmi.hdfc@hdfcbank" maxLength={50} />
                </FieldRow>
              </SectionCard>

              {/* Documents & Certificates */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden self-start">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 bg-amber-50">
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-amber-600" />
                    <h3 className="text-xs font-semibold text-gray-700">Documents &amp; Certificates</h3>
                  </div>
                  <button className="inline-flex items-center gap-1 text-[10px] text-[#005c87] hover:text-[#004a6e] font-medium">
                    <Plus size={10} /> Upload
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Type</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Doc No.</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Expiry</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Status</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierDocs.map((d, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-700 max-w-[100px]">
                            <div className="truncate" title={d.docType}>{d.docType}</div>
                            <div className="text-[10px] text-gray-400">{d.revision !== '\u2014' ? d.revision : ''}</div>
                          </td>
                          <td className="px-2 py-1.5 text-gray-500 text-[10px]">{d.docNumber}</td>
                          <td className="px-2 py-1.5 text-gray-500 text-[10px] whitespace-nowrap">{d.expiryDate}</td>
                          <td className="px-2 py-1.5">
                            <DocStatusBadge status={d.status} />
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              <button className="text-gray-400 hover:text-gray-600"><Download size={11} /></button>
                              <button className="text-gray-400 hover:text-gray-600"><Eye size={11} /></button>
                              <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={11} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center gap-3 text-[9px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Valid
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={8} className="text-amber-500" /> Expiring Soon (&le;30 Days)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Expired
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ---- ADDRESS TAB ------------------------------------------------ */}
        {activeTab === 'address' && (
          <div className="grid grid-cols-2 gap-4 items-start">
            <SectionCard
              icon={<Info size={12} className="text-blue-500" />}
              title="Registered / Billing Address"
              color="bg-blue-50"
            >
              <FieldRow label="Full Address">
                <textarea
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  rows={3}
                  placeholder="Street, Area, Locality"
                  className="w-full text-xs text-gray-800 bg-transparent border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none py-0.5 px-0 resize-none"
                />
              </FieldRow>
              <FieldRow label="Address Line 1">
                <FieldInput value={billAddr1} onChange={setBillAddr1} placeholder="Street / Building" />
              </FieldRow>
              <FieldRow label="Address Line 2">
                <FieldInput value={billAddr2} onChange={setBillAddr2} placeholder="Area / Locality" />
              </FieldRow>
              <FieldRow label="City" required>
                <FieldInput value={billCity} onChange={setBillCity} placeholder="City" />
              </FieldRow>
              <FieldRow label="State" required>
                <FieldSelect value={billState} onChange={setBillState} options={INDIAN_STATES} />
              </FieldRow>
              <FieldRow label="Country" required>
                <FieldSelect value={billCountry} onChange={setBillCountry} options={COUNTRY_OPTIONS} />
              </FieldRow>
              <FieldRow label="PIN Code" required>
                <FieldInput value={billPin} onChange={setBillPin} placeholder="560001" maxLength={10} />
              </FieldRow>
              <FieldRow label="State Code">
                <FieldInput value={stateCode} onChange={setStateCode} placeholder="29" maxLength={5} />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Info size={12} className="text-teal-500" />}
              title="Shipping Address"
              color="bg-teal-50"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-50">
                <input
                  id="shipSame"
                  type="checkbox"
                  checked={shipSameAsBill}
                  onChange={(e) => setShipSameAsBill(e.target.checked)}
                  className="rounded accent-[#005c87]"
                />
                <label htmlFor="shipSame" className="text-[11px] text-gray-500 cursor-pointer">
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

        {/* ---- CONTACT DETAILS TAB --------------------------------------- */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden self-start">
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
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">S.No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Designation</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Email</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Phone</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Primary</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2">{c.name || <span className="text-gray-300">&mdash;</span>}</td>
                      <td className="px-3 py-2 text-gray-500">{c.designation || <span className="text-gray-300">&mdash;</span>}</td>
                      <td className="px-3 py-2 text-blue-600">{c.email || <span className="text-gray-300">&mdash;</span>}</td>
                      <td className="px-3 py-2">{c.phone || <span className="text-gray-300">&mdash;</span>}</td>
                      <td className="px-3 py-2 text-center">{c.isPrimary ? '\u2713' : ''}</td>
                      <td className="px-3 py-2 text-right"><button type="button" title="Delete" onClick={() => removeContact(i)}><Trash2 size={12} className="text-gray-300 hover:text-red-500" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- BUSINESS DETAILS TAB ------------------------------------- */}
        {activeTab === 'business' && (
          <div className="grid grid-cols-2 gap-4 items-start">
            <SectionCard
              icon={<BarChart2 size={12} className="text-green-500" />}
              title="Business Information"
              color="bg-green-50"
            >
              <FieldRow label="Business Nature" required>
                <FieldSelect value={businessNature} onChange={setBusinessNature} options={BUSINESS_NATURE_OPTIONS} />
              </FieldRow>
              <FieldRow label="Service / Supply">
                <FieldSelect value={supplyType} onChange={setSupplyType} options={SUPPLY_TYPE_OPTIONS} />
              </FieldRow>
              <FieldRow label="Main Products">
                <FieldInput value={mainProducts} onChange={setMainProducts} />
              </FieldRow>
              <FieldRow label="Payment Terms" required>
                <FieldSelect value={paymentTermsText} onChange={setPaymentTermsText} options={PAYMENT_TERMS_OPTIONS} />
              </FieldRow>
              <FieldRow label="Incoterms">
                <FieldInput value={incoterms} onChange={(v) => setIncoterms(v.toUpperCase())} placeholder="DDP" />
              </FieldRow>
              <FieldRow label="Min. Order (&#8377;)">
                <FieldInput value={minOrderValue} onChange={setMinOrderValue} type="number" />
              </FieldRow>
              <FieldRow label="Annual Turnover">
                <FieldInput value={annualTurnover} onChange={setAnnualTurnover} type="number" />
              </FieldRow>
              <FieldRow label="Currency">
                <FieldSelect value={preferredCurrency} onChange={setPreferredCurrency} options={CURRENCY_OPTIONS} />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Factory size={12} className="text-teal-600" />}
              title="Manufacturing &amp; Capability"
              color="bg-teal-50"
            >
              <FieldRow label="Location">
                <FieldInput value={manufacturingLocation} onChange={setManufacturingLocation} />
              </FieldRow>
              <FieldRow label="Plant Size">
                <FieldInput value={plantSize} onChange={setPlantSize} />
              </FieldRow>
              <FieldRow label="Employees">
                <FieldInput value={numEmployees} onChange={setNumEmployees} type="number" />
              </FieldRow>
              <FieldRow label="Equipment">
                <FieldInput value={equipmentFacility} onChange={setEquipmentFacility} />
              </FieldRow>
              <FieldRow label="Core Competencies">
                <FieldInput value={coreCompetencies} onChange={setCoreCompetencies} />
              </FieldRow>
              <FieldRow label="Capacity / Month">
                <FieldInput value={capacityPerMonth} onChange={setCapacityPerMonth} />
              </FieldRow>
            </SectionCard>
          </div>
        )}

        {/* ---- BANKING INFORMATION TAB ---------------------------------- */}
        {activeTab === 'banking' && (
          <div className="max-w-lg">
            <SectionCard
              icon={<Shield size={12} className="text-indigo-500" />}
              title="Banking Information"
              color="bg-indigo-50"
            >
              <FieldRow label="Bank Name" required>
                <FieldInput value={bankName} onChange={setBankName} placeholder="HDFC Bank Ltd" />
              </FieldRow>
              <FieldRow label="Branch" required>
                <FieldInput value={bankBranch} onChange={setBankBranch} placeholder="Whitefield, Bengaluru" />
              </FieldRow>
              <FieldRow label="Account No." required>
                <FieldInput value={bankAccountNumber} onChange={setBankAccountNumber} placeholder="S0200012345678" maxLength={30} />
              </FieldRow>
              <FieldRow label="Account Type" required>
                <FieldSelect value={bankAccountType} onChange={setBankAccountType} options={BANK_ACCOUNT_TYPE_OPTIONS} />
              </FieldRow>
              <FieldRow label="IFSC Code" required>
                <FieldInput value={bankIfscCode} onChange={(v) => setBankIfscCode(v.toUpperCase())} placeholder="HDFC0001234" maxLength={11} />
              </FieldRow>
              <FieldRow label="MICR Code">
                <FieldInput value={bankMicrCode} onChange={setBankMicrCode} placeholder="560240002" maxLength={9} />
              </FieldRow>
              <FieldRow label="UPI ID">
                <FieldInput value={bankUpiId} onChange={setBankUpiId} placeholder="pmi.hdfc@hdfcbank" maxLength={50} />
              </FieldRow>
            </SectionCard>
          </div>
        )}

        {/* ---- PRODUCTS / SERVICES TAB ---------------------------------- */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden self-start">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-teal-50">
              <div className="flex items-center gap-2">
                <Package size={12} className="text-teal-600" />
                <h3 className="text-xs font-semibold text-gray-700">Approved Products / Materials</h3>
              </div>
              <button className="inline-flex items-center gap-1 text-[10px] text-[#005c87] hover:text-[#004a6e]">
                <Plus size={10} /> Add Product
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">S.No.</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Material / Product</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Specification</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Form</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Condition</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Approved On</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {approvedProducts.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-4 text-center text-gray-400">No approved products yet. Add one below.</td></tr>
                )}
                {approvedProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-700 font-medium">{p.material}</td>
                    <td className="px-3 py-2 text-gray-500">{p.specification}</td>
                    <td className="px-3 py-2 text-gray-500">{p.form}</td>
                    <td className="px-3 py-2 text-gray-500">{p.condition}</td>
                    <td className="px-3 py-2 text-gray-500">{p.approvedOn}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" title="Delete" onClick={() => handleDeleteProduct(i)}><Trash2 size={12} className="text-gray-300 hover:text-red-500" /></button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50/60">
                  <td className="px-3 py-1.5 text-gray-300">+</td>
                  <td className="px-2 py-1.5"><input value={newProduct.material} onChange={(e) => setNewProduct({ ...newProduct, material: e.target.value })} placeholder="Material *" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                  <td className="px-2 py-1.5"><input value={newProduct.specification} onChange={(e) => setNewProduct({ ...newProduct, specification: e.target.value })} placeholder="AMS 4928" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                  <td className="px-2 py-1.5"><input value={newProduct.form} onChange={(e) => setNewProduct({ ...newProduct, form: e.target.value })} placeholder="Bar / Plate" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                  <td className="px-2 py-1.5"><input value={newProduct.condition} onChange={(e) => setNewProduct({ ...newProduct, condition: e.target.value })} placeholder="T651" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                  <td></td><td></td>
                  <td className="px-3 py-1.5 text-right"><button type="button" onClick={handleAddProduct} disabled={!newProduct.material.trim()} className="text-[#005c87] disabled:text-gray-300"><Plus size={14} /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ---- QUALITY & COMPLIANCE TAB --------------------------------- */}
        {activeTab === 'quality' && (
          <div className="grid grid-cols-2 gap-4 items-start">
            <SectionCard
              icon={<Shield size={12} className="text-blue-500" />}
              title="Quality &amp; Compliance"
              color="bg-blue-50"
            >
              <FieldRow label="AS 9100 Rev D">
                <FieldSelect value={as9100Status} onChange={setAs9100Status} options={CERT_STATUS_OPTIONS} />
              </FieldRow>
              <FieldRow label="NADCAP">
                <FieldSelect value={nadcapStatus} onChange={setNadcapStatus} options={NADCAP_STATUS_OPTIONS} />
              </FieldRow>
              <FieldRow label="ISO 9001:2015">
                <FieldSelect value={iso9001Status} onChange={setIso9001Status} options={CERT_STATUS_OPTIONS} />
              </FieldRow>
              <FieldRow label="ISO 14001:2015">
                <FieldSelect value={iso14001Status} onChange={setIso14001Status} options={CERT_STATUS_OPTIONS} />
              </FieldRow>
              <FieldRow label="ISO 45001:2018">
                <FieldSelect value={iso45001Status} onChange={setIso45001Status} options={CERT_STATUS_OPTIONS} />
              </FieldRow>
              <FieldRow label="Other Certs">
                <FieldInput value={otherCerts} onChange={setOtherCerts} placeholder="IATF 16949, ISO 27001" />
              </FieldRow>
              <FieldRow label="QA System">
                <FieldInput value={qaSystem} onChange={setQaSystem} placeholder="Online Quality Portal" />
              </FieldRow>
              <FieldRow label="FAI / PPAP">
                <FieldInput value={faiPpapSupport} onChange={setFaiPpapSupport} placeholder="Yes / No" />
              </FieldRow>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-t border-gray-100 mt-2">Aerospace / Defence Registrations</div>
              <FieldRow label="DGCA Reference">
                <FieldInput value={dgcaReference} onChange={setDgcaReference} placeholder="DGCA/AW/…" />
              </FieldRow>
              <FieldRow label="DGCA Approval No.">
                <FieldInput value={dgcaApprovalNumber} onChange={setDgcaApprovalNumber} placeholder="Approval number" />
              </FieldRow>
              <FieldRow label="DGCA Expiry">
                <FieldInput value={dgcaApprovalExpiry} onChange={setDgcaApprovalExpiry} type="date" />
              </FieldRow>
              <FieldRow label="HAL Supplier Code">
                <FieldInput value={halSupplierCode} onChange={setHalSupplierCode} placeholder="HAL code" />
              </FieldRow>
              <FieldRow label="HAL Vendor Code">
                <FieldInput value={halVendorCode} onChange={setHalVendorCode} placeholder="HAL vendor code" />
              </FieldRow>
              <FieldRow label="ISRO Registration">
                <FieldInput value={isroRegistrationNumber} onChange={setIsroRegistrationNumber} placeholder="ISRO reg. no." />
              </FieldRow>
              <FieldRow label="ISRO Vendor Code">
                <FieldInput value={isroVendorCode} onChange={setIsroVendorCode} placeholder="ISRO vendor code" />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Star size={12} className="text-yellow-500" />}
              title="Approved For"
              color="bg-yellow-50"
            >
              <div className="px-3 py-3 space-y-2">
                {([
                  ['Raw Material Supply', approvedForRawMaterial, setApprovedForRawMaterial],
                  ['Sub-Contract Machining', approvedForSubContract, setApprovedForSubContract],
                  ['Heat Treatment', approvedForHeatTreatment, setApprovedForHeatTreatment],
                  ['Surface Treatment', approvedForSurface, setApprovedForSurface],
                  ['NDT Services', approvedForNdt, setApprovedForNdt],
                ] as [string, boolean, (v: boolean) => void][]).map(([label, checked, setter]) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setter(e.target.checked)}
                      className="rounded accent-[#005c87] w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-700">{label}</span>
                  </label>
                ))}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvedForOthers}
                    onChange={(e) => setApprovedForOthers(e.target.checked)}
                    className="rounded accent-[#005c87] w-3.5 h-3.5 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-xs text-gray-700">Others</span>
                    {approvedForOthers && (
                      <input
                        value={approvedForOthersText}
                        onChange={(e) => setApprovedForOthersText(e.target.value)}
                        placeholder="Specify..."
                        className="w-full text-xs border border-gray-200 rounded px-2 py-0.5 mt-1 focus:border-[#005c87] focus:outline-none"
                      />
                    )}
                  </div>
                </label>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ---- DOCUMENTS TAB -------------------------------------------- */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden self-start">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-amber-50">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-amber-600" />
                <h3 className="text-xs font-semibold text-gray-700">Documents &amp; Certificates</h3>
              </div>
              <button className="inline-flex items-center gap-1 text-xs text-[#005c87] hover:text-[#004a6e]">
                <Plus size={12} /> Upload Document
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Document Type</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Document No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Rev.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Issue Date</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Expiry Date</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierDocs.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-400">No documents yet. Add a certificate below.</td></tr>
                  )}
                  {supplierDocs.map((d, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700">{d.docType}</td>
                      <td className="px-3 py-2 text-gray-500">{d.docNumber}</td>
                      <td className="px-3 py-2 text-gray-500">{d.revision}</td>
                      <td className="px-3 py-2 text-gray-500">{d.issueDate}</td>
                      <td className="px-3 py-2 text-gray-500">{d.expiryDate}</td>
                      <td className="px-3 py-2">
                        <DocStatusBadge status={d.status} />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" title="Delete" onClick={() => handleDeleteDoc(i)}><Trash2 size={13} className="text-gray-300 hover:text-red-500" /></button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50/60">
                    <td className="px-2 py-1.5"><input value={newDoc.document_type} onChange={(e) => setNewDoc({ ...newDoc, document_type: e.target.value })} placeholder="Certificate / Doc type *" className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                    <td className="px-2 py-1.5"><input value={newDoc.doc_number} onChange={(e) => setNewDoc({ ...newDoc, doc_number: e.target.value })} placeholder="Doc No." className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                    <td></td><td></td>
                    <td className="px-2 py-1.5"><input type="date" value={newDoc.expiry_date} onChange={(e) => setNewDoc({ ...newDoc, expiry_date: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                    <td></td>
                    <td className="px-3 py-1.5"><button type="button" onClick={handleAddDoc} disabled={!newDoc.document_type.trim()} className="text-[#005c87] disabled:text-gray-300"><Plus size={14} /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Valid
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle size={10} className="text-amber-500" /> Expiring Soon (&le;30 Days)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Expired
              </span>
            </div>
          </div>
        )}

        {/* ---- PERFORMANCE TAB ------------------------------------------ */}
        {activeTab === 'performance' && (
          <div className="max-w-lg">
            <SectionCard
              icon={<BarChart2 size={12} className="text-green-500" />}
              title="Performance Summary (Last 12 Months)"
              color="bg-green-50"
            >
              <div className="px-4 py-3 space-y-3">
                {isNew ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Save the supplier to see live performance metrics.</p>
                ) : !scorecard ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Loading scorecard…</p>
                ) : (
                  <>
                    {([
                      ['On-Time Delivery', `${scorecard.on_time_delivery_rate_pct.toFixed(1)}%`],
                      ['Quality Rejection Rate', `${scorecard.quality_rejection_rate_pct.toFixed(2)}%`],
                      ['NCRs (last 12 months)', String(scorecard.ncr_count_12m)],
                      ['Open PO Value', `₹${scorecard.open_po_value_inr.toLocaleString('en-IN')}`],
                      ['Last Audit Score', scorecard.last_audit_score != null ? `${scorecard.last_audit_score}/100` : '—'],
                      ['Last Audit Date', scorecard.last_audit_date ? formatDate(scorecard.last_audit_date) : '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 w-48">{label}</span>
                        <span className="text-sm font-semibold text-gray-800 font-mono">{val}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                      <span className="text-sm text-gray-500">Audit Status</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${scorecard.audit_overdue ? 'text-red-700 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
                        {scorecard.audit_overdue ? 'Audit Overdue' : 'Audit Current'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 pt-1">Live from the supplier scorecard (Purchase / QMS data).</p>
                  </>
                )}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ---- NOTES TAB ------------------------------------------------ */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-xs text-gray-400">
            No notes or attachments.
          </div>
        )}

        {/* ---- HISTORY TAB ---------------------------------------------- */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-xs text-gray-400">
            No history records.
          </div>
        )}
      </div>

      {/* ================================================================
          SAVE / DISCARD BAR (inline, end of content — matches Customer master)
      ================================================================ */}
      <div className="flex items-center justify-end gap-2 mt-3 mb-2">
        {saveError && <span className="text-xs text-red-600 mr-auto">{saveError}</span>}
        {saveSuccess && <span className="text-xs text-green-600 mr-auto">Saved successfully.</span>}
        <button
          type="button"
          onClick={handleDiscard}
          disabled={saving}
          className="px-4 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs text-white bg-[#005c87] rounded hover:bg-[#004a6e] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b px-4 py-2 flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-4">
          {supplier?.created_at && (
            <span>Created By: Admin User &nbsp;&middot;&nbsp; Created On: {formatDate(supplier.created_at)}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {supplier?.updated_at && (
            <span>Modified By: Admin User &nbsp;&middot;&nbsp; Modified On: {formatDate(supplier.updated_at)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
