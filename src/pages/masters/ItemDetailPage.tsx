/**
 * ItemDetailPage - Module 01: Item Master detail view.
 *
 * Layout matches the BRACKET ASSY "" LH reference image exactly:
 *   - Header: item image + item name + Finished Good badge + meta info + action buttons
 *   - Certification badges (NADCAP, AS9100) in header
 *   - 7 tabs: General Information | Category & Classification | Manufacturing |
 *             Documents | Customer Part Map | BOM | History
 *   - General Information: Basic Information + Product Classification +
 *     Drawing & Revision cards
 *   - Documents, Customer Part Mapping sections
 *   - Footer with audit info
 */

import { Fragment, useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Package, Plus, Shield, BarChart2, Boxes, FileText,
  Info, Settings, Ruler, CreditCard, Truck, Factory,
  Award, Upload, Users, Link, History, ChevronDown,
  Eye, Download, Trash2, ArrowLeft,
} from 'lucide-react'

import { StateMachineBadge } from '../../components/ui'
import { extractDrawing } from '../../api/extractDrawing'
import type { DrawingExtractionResult } from '../../types/item-master'
import AiExtractionModal from './item-master/AiExtractionModal'
import { formatDate } from '../../lib/utils'
import {
  getItem,
  createItem,
  updateItem,
  deleteItem,
  ItemRecord,
  listItemDocuments,
  listItemDocumentHistory,
  uploadItemDocument,
  deleteItemDocument,
  type ItemDocument,
  listItemBom,
  addItemBom,
  deleteItemBom,
  type ItemBomComponent,
  listItemCustomerParts,
  addItemCustomerPart,
  deleteItemCustomerPart,
  type ItemCustomerPart,
} from '../../api/itemApi'
import { listCustomers, type Customer } from '../../api/customerApi'

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
type TabId =
  | 'general'
  | 'category'
  | 'manufacturing'
  | 'documents'
  | 'customerPartMap'
  | 'bom'
  | 'history'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General Information' },
  { id: 'category', label: 'Category & Classification' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'documents', label: 'Documents' },
  { id: 'customerPartMap', label: 'Customer Part Map' },
  { id: 'bom', label: 'BOM' },
  { id: 'history', label: 'History' },
]

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------
const ITEM_TYPE_OPTIONS = [
  { value: '', label: '- Select Type -' },
  { value: 'FG', label: 'FG - Finished Good' },
  { value: 'RM', label: 'RM - Raw Material' },
  { value: 'SFG', label: 'SFG - Semi Finished Good' },
  { value: 'CONS', label: 'CONS - Consumable' },
  { value: 'TOOL', label: 'TOOL - Tool / Fixture' },
  { value: 'PKG', label: 'PKG - Packaging Material' },
  { value: 'SPARE', label: 'SPARE - Spare Part' },
]

const ITEM_CATEGORY_OPTIONS = [
  { value: '', label: '- Select Category -' },
  { value: 'Aerospace Machined Parts', label: 'Aerospace Machined Parts' },
  { value: 'Sheet Metal Components', label: 'Sheet Metal Components' },
  { value: 'Casting Components', label: 'Casting Components' },
  { value: 'Forged Components', label: 'Forged Components' },
  { value: 'Electronic Components', label: 'Electronic Components' },
  { value: 'Fasteners', label: 'Fasteners' },
  { value: 'Bearings', label: 'Bearings' },
  { value: 'Raw Material', label: 'Raw Material' },
]

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Obsolete', label: 'Obsolete' },
]

const UOM_OPTIONS = [
  { value: '', label: '- Select UOM -' },
  { value: 'NOS', label: 'NOS - Numbers' },
  { value: 'KG', label: 'KG - Kilograms' },
  { value: 'MTR', label: 'MTR - Meters' },
  { value: 'LTR', label: 'LTR - Liters' },
  { value: 'SET', label: 'SET - Sets' },
  { value: 'PCS', label: 'PCS - Pieces' },
  { value: 'BOX', label: 'BOX - Boxes' },
  { value: 'ROLL', label: 'ROLL - Rolls' },
]

const MATERIAL_GROUP_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Aluminum Alloy', label: 'Aluminum Alloy' },
  { value: 'Steel Alloy', label: 'Steel Alloy' },
  { value: 'Titanium Alloy', label: 'Titanium Alloy' },
  { value: 'Composite', label: 'Composite' },
  { value: 'Stainless Steel', label: 'Stainless Steel' },
  { value: 'Brass', label: 'Brass' },
  { value: 'Copper', label: 'Copper' },
]

const MATERIAL_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'AL 7075-T6', label: 'AL 7075-T6' },
  { value: 'AL 6061-T6', label: 'AL 6061-T6' },
  { value: 'AL 2024-T3', label: 'AL 2024-T3' },
  { value: 'SS 304', label: 'SS 304' },
  { value: 'SS 316', label: 'SS 316' },
  { value: 'Ti-6Al-4V', label: 'Ti-6Al-4V' },
  { value: 'Inconel 718', label: 'Inconel 718' },
]

const COUNTRY_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'India', label: 'India' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Japan', label: 'Japan' },
  { value: 'China', label: 'China' },
]

const YES_NO_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const VALUATION_METHOD_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Moving Average', label: 'Moving Average' },
  { value: 'FIFO', label: 'FIFO' },
  { value: 'LIFO', label: 'LIFO' },
  { value: 'Standard Cost', label: 'Standard Cost' },
]

const PRICE_CONTROL_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Moving Average', label: 'Moving Average' },
  { value: 'Manual', label: 'Manual' },
]

const COSTING_METHOD_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Actual', label: 'Actual' },
  { value: 'Moving Average', label: 'Moving Average' },
]

const INSPECTION_TYPE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: '100% Inspection', label: '100% Inspection' },
  { value: 'Sampling', label: 'Sampling' },
  { value: 'Skip Lot', label: 'Skip Lot' },
  { value: 'First Article Only', label: 'First Article Only' },
]

const TAX_CODE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: '18% GST', label: '18% GST' },
  { value: '12% GST', label: '12% GST' },
  { value: '5% GST', label: '5% GST' },
  { value: '0% GST', label: '0% GST (Exempt)' },
  { value: '28% GST', label: '28% GST' },
]

const SUPPLY_TYPE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Domestic', label: 'Domestic' },
  { value: 'Import', label: 'Import' },
  { value: 'Both', label: 'Both' },
]

const DOCUMENT_TYPE_OPTIONS = [
  { value: '', label: '- Select -' },
  { value: 'Drawing', label: 'Drawing' },
  { value: '3D Model', label: '3D Model' },
  { value: 'Process Sheet', label: 'Process Sheet' },
  { value: 'Control Plan', label: 'Control Plan' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'Test Report', label: 'Test Report' },
  { value: 'Specification', label: 'Specification' },
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
      <span className="text-[11px] text-gray-500 shrink-0 w-[120px] leading-tight">
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
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full text-xs text-gray-800 bg-transparent border-0 border-b border-gray-100 focus:border-[#005c87] focus:outline-none py-0.5 px-0 disabled:text-gray-400 disabled:cursor-not-allowed"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Compact textarea for FieldRow */
function FieldTextarea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-xs text-gray-800 bg-transparent border border-gray-100 rounded focus:border-[#005c87] focus:outline-none py-1 px-2 placeholder-gray-300 resize-none"
    />
  )
}

/** Document row interface */
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
// Normalise any API error (incl. FastAPI validation detail arrays / {field,message,type}) into a string.
function errMsg(e: unknown, fallback: string): string {
  const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
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
  return fallback
}

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  // Data state
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<TabId>('general')

  // ---- Basic Information ----
  const [itemCode, setItemCode] = useState('')
  const [itemName, setItemName] = useState('')
  const [shortName, setShortName] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [revision, setRevision] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [status, setStatus] = useState(isNew ? 'Draft' : 'Active')

  // ---- Product Classification ----
  const [materialGroup, setMaterialGroup] = useState('')
  const [material, setMaterial] = useState('')
  const [hsnCode, setHsnCode] = useState('')
  const [eccn, setEccn] = useState('')
  const [itarControlled, setItarControlled] = useState('')
  const [countryOfOrigin, setCountryOfOrigin] = useState('')

  // ---- Unit & Pricing ----
  const [baseUom, setBaseUom] = useState('')
  const [salesUom, setSalesUom] = useState('')
  const [purchaseUom, setPurchaseUom] = useState('')
  const [conversionFactor, setConversionFactor] = useState('')
  const [standardCost, setStandardCost] = useState('')
  const [lastPurchasePrice, setLastPurchasePrice] = useState('')
  const [standardSellingPrice, setStandardSellingPrice] = useState('')
  const [priceControl, setPriceControl] = useState('')
  const [costingMethod, setCostingMethod] = useState('')

  // ---- Inventory Information ----
  const [valuationMethod, setValuationMethod] = useState('')
  const [movingAverage, setMovingAverage] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [maxStockLevel, setMaxStockLevel] = useState('')
  const [minStockLevel, setMinStockLevel] = useState('')
  const [leadTime, setLeadTime] = useState('')
  const [safetyStock, setSafetyStock] = useState('')
  const [stockInHand, setStockInHand] = useState('')
  const [stockInTransit, setStockInTransit] = useState('')
  const [reservedStock, setReservedStock] = useState('')

  // ---- Drawing & Revision ----
  const [drawingNumber, setDrawingNumber] = useState('')
  const [drawingRevision, setDrawingRevision] = useState('')
  const [drawingDate, setDrawingDate] = useState('')
  const [issuedBy, setIssuedBy] = useState('')
  const [approvedBy, setApprovedBy] = useState('')

  // ---- Dimensional & Weight ----
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [netWeight, setNetWeight] = useState('')
  const [grossWeight, setGrossWeight] = useState('')
  const [tolerance, setTolerance] = useState('')

  // ---- Quality & Certifications ----
  const [as9100Applicable, setAs9100Applicable] = useState('')
  const [nadcapApplicable, setNadcapApplicable] = useState('')
  const [specialProcessReq, setSpecialProcessReq] = useState('')
  const [anodizing, setAnodizing] = useState('')
  const [inspectionType, setInspectionType] = useState('')
  const [keyCharacteristics, setKeyCharacteristics] = useState('')
  const [firstArticleInspReq, setFirstArticleInspReq] = useState('')

  // ---- Default Accounts ----
  const [inventoryAccount, setInventoryAccount] = useState('')
  const [cogsAccount, setCogsAccount] = useState('')
  const [salesAccount, setSalesAccount] = useState('')
  const [purchaseAccount, setPurchaseAccount] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [expenseAccount, setExpenseAccount] = useState('')

  // ---- Make/Brand ----
  const [makeBrand, setMakeBrand] = useState('')

  // ---- Documents ----
  const [documents, setDocuments] = useState<ItemDocument[]>([])
  const [docHistory, setDocHistory] = useState<ItemDocument[]>([])
  const [showUploadDoc, setShowUploadDoc] = useState(false)
  const [uploadDocType, setUploadDocType] = useState('Drawing')
  const [uploadDocRevision, setUploadDocRevision] = useState('')
  const [uploadDocNumber, setUploadDocNumber] = useState('')
  const [docBusy, setDocBusy] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const docFileRef = useRef<HTMLInputElement>(null)


  // ---- Customer Part Mapping ----
  const [customerParts, setCustomerParts] = useState<ItemCustomerPart[]>([])
  const [bomComponents, setBomComponents] = useState<ItemBomComponent[]>([])
  const [customersList, setCustomersList] = useState<Customer[]>([])
  // Customer Part Map add-form
  const [showAddCpm, setShowAddCpm] = useState(false)
  const [cpmCustomerId, setCpmCustomerId] = useState('')
  const [cpmPartNo, setCpmPartNo] = useState('')
  const [cpmBusy, setCpmBusy] = useState(false)
  const [cpmError, setCpmError] = useState<string | null>(null)
  // BOM add-form
  const [showAddBom, setShowAddBom] = useState(false)
  const [bomCode, setBomCode] = useState('')
  const [bomName, setBomName] = useState('')
  const [bomQty, setBomQty] = useState('')
  const [bomUom, setBomUom] = useState('')
  const [bomLevel, setBomLevel] = useState('1')
  const [bomBusy, setBomBusy] = useState(false)
  const [bomError, setBomError] = useState<string | null>(null)

  // ---- Audit fields ----
  const [createdAt, setCreatedAt] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')

  // ---- Save state ----
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  // ---- PDF Upload & AI Extraction ----
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Load (simulated)
  // ---------------------------------------------------------------------------
  // Clear every field to defaults. Called when the page switches to "new" so a
  // previously-opened record's values never "stick" in the create form (this
  // component is reused by the router for both /items/:id and /items/new).
  const resetForm = useCallback(() => {
    setItemCode(''); setItemName(''); setShortName(''); setPartNumber(''); setRevision('')
    setDescription(''); setItemType(''); setItemCategory(''); setStatus('Draft')
    setMaterialGroup(''); setMaterial(''); setHsnCode(''); setEccn(''); setItarControlled(''); setCountryOfOrigin('')
    setBaseUom(''); setSalesUom(''); setPurchaseUom(''); setConversionFactor(''); setStandardCost('')
    setLastPurchasePrice(''); setStandardSellingPrice(''); setPriceControl(''); setCostingMethod('')
    setValuationMethod(''); setMovingAverage(''); setReorderLevel(''); setMaxStockLevel(''); setMinStockLevel('')
    setLeadTime(''); setSafetyStock(''); setStockInHand(''); setStockInTransit(''); setReservedStock('')
    setDrawingNumber(''); setDrawingRevision(''); setDrawingDate(''); setIssuedBy(''); setApprovedBy('')
    setLength(''); setWidth(''); setHeight(''); setNetWeight(''); setGrossWeight(''); setTolerance('')
    setAs9100Applicable(''); setNadcapApplicable(''); setSpecialProcessReq(''); setAnodizing(''); setInspectionType(''); setKeyCharacteristics(''); setFirstArticleInspReq('')
    setInventoryAccount(''); setCogsAccount(''); setSalesAccount(''); setPurchaseAccount(''); setTaxCode(''); setExpenseAccount('')
    setMakeBrand('')
    setCreatedAt(''); setUpdatedAt('')
    setLoadError(null); setSaveError(null); setSaveSuccess(false)
  }, [])

  useEffect(() => {
    if (isNew) { resetForm(); return }
    
    const loadItem = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const data = await getItem(id!)
        
        // Basic Information
        setItemCode(data.item_code || '')
        setItemName(data.item_name || data.part_name || '')
        setShortName(data.short_name || '')
        setPartNumber(data.part_number || data.part_no || '')
        setRevision(data.revision || '')
        setDescription(data.description || data.item_long_desc || '')
        setItemType(data.item_type || '')
        setItemCategory(data.item_category || '')
        setStatus(data.status || 'Draft')
        
        // Product Classification
        setMaterialGroup(data.material_group || '')
        setMaterial(data.material || data.material_spec || '')
        setHsnCode(data.hsn_code || '')
        setEccn(data.eccn || '')
        setItarControlled(data.itar_controlled || '')
        setCountryOfOrigin(data.country_of_origin || '')
        
        // Unit & Pricing
        setBaseUom(data.base_uom || data.unit_of_measure || '')
        setSalesUom(data.sales_uom || '')
        setPurchaseUom(data.purchase_uom || '')
        setConversionFactor(data.conversion_factor?.toString() || '')
        setStandardCost(data.standard_cost?.toString() || '')
        setLastPurchasePrice(data.last_purchase_price?.toString() || '')
        setStandardSellingPrice(data.standard_selling_price?.toString() || '')
        setPriceControl(data.price_control || '')
        setCostingMethod(data.costing_method || '')
        
        // Inventory
        setValuationMethod(data.valuation_method || '')
        setMovingAverage(data.moving_average?.toString() || '')
        setReorderLevel(data.reorder_level?.toString() || '')
        setMaxStockLevel(data.max_stock_level?.toString() || '')
        setMinStockLevel(data.min_stock_level?.toString() || '')
        setLeadTime(data.lead_time_days?.toString() || '')
        setSafetyStock(data.safety_stock?.toString() || '')
        setStockInHand(data.stock_in_hand?.toString() || '')
        setStockInTransit(data.stock_in_transit?.toString() || '')
        setReservedStock(data.reserved_stock?.toString() || '')
        
        // Drawing
        setDrawingNumber(data.drawing_number || data.drawing_no || '')
        setDrawingRevision(data.drawing_revision || '')
        setDrawingDate(data.drawing_date || '')
        setIssuedBy(data.issued_by || '')
        setApprovedBy(data.approved_by || '')
        
        // Dimensional
        setLength(data.length_mm?.toString() || '')
        setWidth(data.width_mm?.toString() || '')
        setHeight(data.height_mm?.toString() || '')
        setNetWeight(data.net_weight_kg?.toString() || '')
        setGrossWeight(data.gross_weight_kg?.toString() || '')
        setTolerance(data.tolerance || '')
        
        // Quality
        setAs9100Applicable(data.as9100_applicable || '')
        setNadcapApplicable(data.nadcap_applicable || '')
        setSpecialProcessReq(data.special_process_req || '')
        setAnodizing(data.anodizing || '')
        setInspectionType(data.inspection_type || '')
        setKeyCharacteristics(data.key_characteristics || '')
        setFirstArticleInspReq(data.first_article_insp_req || '')
        
        // Accounts
        setInventoryAccount(data.inventory_account || '')
        setCogsAccount(data.cogs_account || '')
        setSalesAccount(data.sales_account || '')
        setPurchaseAccount(data.purchase_account || '')
        setTaxCode(data.tax_code || '')
        setExpenseAccount(data.expense_account || '')
        
        // Make/Brand
        setMakeBrand(data.make_brand || '')
        
        // Audit
        setCreatedAt(data.created_at || '')
        setUpdatedAt(data.updated_at || '')
        
        setLoading(false)
      } catch (err: any) {
        console.error('Failed to load item:', err)
        setLoadError(errMsg(err, 'Failed to load item'))
        setLoading(false)
      }
    }
    
    loadItem()
    if (!isNew && id) {
      listItemDocuments(id).then(setDocuments).catch(() => setDocuments([]))
      listItemDocumentHistory(id).then(setDocHistory).catch(() => setDocHistory([]))
      listItemBom(id).then(setBomComponents).catch(() => setBomComponents([]))
      listItemCustomerParts(id).then(setCustomerParts).catch(() => setCustomerParts([]))
    }
    listCustomers({}).then(setCustomersList).catch(() => setCustomersList([]))
  }, [id, isNew, resetForm])

  // ---------------------------------------------------------------------------
  // PDF Upload & AI Extraction handlers
  // ---------------------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setPendingFile(f)
      setShowAiModal(true)
    }
    e.target.value = ''
  }

  const handleExtractionComplete = (result: DrawingExtractionResult) => {
    console.log('[ItemDetailPage] AI Extraction complete:', result.model_used)
    if (pendingFile) setUploadedFileName(pendingFile.name)
    
    // Populate fields from extraction result (review the values before Save).
    if (result.drawing_number?.value) setDrawingNumber(String(result.drawing_number.value))
    if (result.part_number?.value) setPartNumber(String(result.part_number.value))
    if (result.part_name?.value) setItemName(String(result.part_name.value))
    if (result.revision?.value) setRevision(String(result.revision.value))
    // material name preferred; fall back to material spec if the model only found the spec
    if (result.material?.value) setMaterial(String(result.material.value))
    else if (result.material_spec?.value) setMaterial(String(result.material_spec.value))
    if (result.length_mm?.value) setLength(String(result.length_mm.value))
    if (result.width_mm?.value) setWidth(String(result.width_mm.value))
    if (result.diameter_mm?.value) setWidth(String(result.diameter_mm.value))
    if (result.surface_treatment?.value) setAnodizing(String(result.surface_treatment.value))
    if (result.tolerance?.value) setTolerance(String(result.tolerance.value))
    if (result.key_characteristics?.value) setKeyCharacteristics(String(result.key_characteristics.value))
    if (result.drawing_date?.value) setDrawingDate(String(result.drawing_date.value))
    if (result.issued_by?.value) setIssuedBy(String(result.issued_by.value))
    if (result.approved_by?.value) setApprovedBy(String(result.approved_by.value))
    if (result.special_process?.value) setSpecialProcessReq('Yes')
    
    setShowAiModal(false)
    setPendingFile(null)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleExtractionError = (msg: string) => {
    console.error('[ItemDetailPage] Extraction error:', msg)
    setShowAiModal(false)
    setPendingFile(null)
    setSaveError(msg)
  }

  // ---------------------------------------------------------------------------
  // Item document handlers (versioned upload + revision history)
  // ---------------------------------------------------------------------------
  const reloadDocuments = useCallback(() => {
    if (!id || id === 'new') return
    listItemDocuments(id).then(setDocuments).catch(() => setDocuments([]))
    listItemDocumentHistory(id).then(setDocHistory).catch(() => setDocHistory([]))
  }, [id])

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (isNew || !id) { setDocError('Save the item before uploading documents.'); return }
    setDocBusy(true); setDocError(null)
    try {
      await uploadItemDocument(id, f, {
        document_type: uploadDocType || 'Drawing',
        revision: uploadDocRevision.trim() || undefined,
        doc_number: uploadDocNumber.trim() || undefined,
      })
      setUploadDocRevision(''); setUploadDocNumber(''); setShowUploadDoc(false)
      reloadDocuments()
    } catch (err: any) {
      setDocError(err?.response?.data?.detail ?? 'Upload failed')
    } finally {
      setDocBusy(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!id) return
    try {
      await deleteItemDocument(id, docId)
      reloadDocuments()
    } catch { /* ignore */ }
  }

  // Apply AI-extracted fields (raw extractor schema) into the form — the user
  // clicks to apply after reviewing; nothing is written to the saved record
  // automatically. Values land in the form and are persisted on Save.
  const applyExtractedToForm = (fields: any) => {
    if (!fields) return
    const v = (k: string) => fields?.[k]?.value
    if (v('drawing_number')) setDrawingNumber(String(v('drawing_number')))
    if (v('part_number')) setPartNumber(String(v('part_number')))
    if (v('part_name')) setItemName(String(v('part_name')))
    if (v('revision')) setRevision(String(v('revision')))
    if (v('material')) setMaterial(String(v('material')))
    else if (v('material_spec')) setMaterial(String(v('material_spec')))
    if (v('surface_treatment')) setAnodizing(String(v('surface_treatment')))
    if (v('tolerance')) setTolerance(String(v('tolerance')))
    if (v('key_characteristics')) setKeyCharacteristics(String(v('key_characteristics')))
    if (v('drawing_date')) setDrawingDate(String(v('drawing_date')))
    if (v('issued_by')) setIssuedBy(String(v('issued_by')))
    if (v('approved_by')) setApprovedBy(String(v('approved_by')))
    const dims = fields?.dimensions?.value
    if (dims && typeof dims === 'object') {
      if (dims.length_mm != null) setLength(String(dims.length_mm))
      if (dims.width_mm != null) setWidth(String(dims.width_mm))
      if (dims.height_mm != null) setHeight(String(dims.height_mm))
      if (dims.weight_g != null) setNetWeight(String(Number(dims.weight_g) / 1000))
    }
    const sp = fields?.special_processes?.value
    if ((Array.isArray(sp) && sp.length > 0) || (typeof sp === 'string' && sp.trim())) setSpecialProcessReq('Yes')
    setActiveTab('general')
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  // Poll while any document is still being read by the AI (background task).
  useEffect(() => {
    if (isNew || !id) return
    const anyPending =
      documents.some((d) => d.extraction_status === 'pending') ||
      docHistory.some((d) => d.extraction_status === 'pending')
    if (!anyPending) return
    let ticks = 0
    const iv = setInterval(() => {
      ticks += 1
      reloadDocuments()
      if (ticks >= 15) clearInterval(iv)
    }, 4000)
    return () => clearInterval(iv)
  }, [documents, docHistory, id, isNew, reloadDocuments])

  // ---- BOM component handlers ----
  const reloadBom = () => { if (id && id !== 'new') listItemBom(id).then(setBomComponents).catch(() => setBomComponents([])) }
  const handleAddBom = async () => {
    if (isNew || !id) { setBomError('Save the item before adding components.'); return }
    if (!bomCode.trim() && !bomName.trim()) { setBomError('Enter a component code or name.'); return }
    setBomBusy(true); setBomError(null)
    try {
      await addItemBom(id, {
        component_code: bomCode.trim() || undefined,
        component_name: bomName.trim() || undefined,
        quantity: bomQty.trim() ? parseFloat(bomQty) : undefined,
        uom: bomUom.trim() || undefined,
        level: bomLevel.trim() ? parseInt(bomLevel, 10) : undefined,
      })
      setBomCode(''); setBomName(''); setBomQty(''); setBomUom(''); setBomLevel('1'); setShowAddBom(false)
      reloadBom()
    } catch (err: any) { setBomError(err?.response?.data?.detail ?? 'Could not add component') }
    finally { setBomBusy(false) }
  }
  const handleDeleteBom = async (linkId: string) => {
    if (!id) return
    try { await deleteItemBom(id, linkId); reloadBom() } catch { /* ignore */ }
  }

  // ---- Customer Part Map handlers ----
  const reloadCpm = () => { if (id && id !== 'new') listItemCustomerParts(id).then(setCustomerParts).catch(() => setCustomerParts([])) }
  const handleAddCpm = async () => {
    if (isNew || !id) { setCpmError('Save the item before adding mappings.'); return }
    if (!cpmPartNo.trim()) { setCpmError('Enter the customer part number.'); return }
    if (!cpmCustomerId) { setCpmError('Select a customer.'); return }
    setCpmBusy(true); setCpmError(null)
    try {
      await addItemCustomerPart(id, { customer_id: cpmCustomerId, customer_part_no: cpmPartNo.trim() })
      setCpmCustomerId(''); setCpmPartNo(''); setShowAddCpm(false)
      reloadCpm()
    } catch (err: any) { setCpmError(err?.response?.data?.detail ?? 'Could not add mapping') }
    finally { setCpmBusy(false) }
  }
  const handleDeleteCpm = async (linkId: string) => {
    if (!id) return
    try { await deleteItemCustomerPart(id, linkId); reloadCpm() } catch { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    // Mandatory-field guard: block the save and name exactly what's missing,
    // so a record can never be persisted without its key identifiers.
    const missing: string[] = []
    if (!itemCode.trim()) missing.push('Item Code')
    if (!itemName.trim()) missing.push('Item Name')
    if (!partNumber.trim()) missing.push('Part Number')
    if (!revision.trim()) missing.push('Revision')
    if (!itemType.trim()) missing.push('Item Type')
    if (!itemCategory.trim()) missing.push('Item Category')
    if (missing.length) {
      setSaveSuccess(false)
      setSaveError('Please fill the required field(s): ' + missing.join(', '))
      return
    }
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      // Build payload
      const payload: Partial<ItemRecord> = {
        item_code: itemCode || undefined,
        item_name: itemName || undefined,
        short_name: shortName || undefined,
        part_number: partNumber || undefined,
        revision: revision || undefined,
        description: description || undefined,
        item_type: itemType || undefined,
        item_category: itemCategory || undefined,
        status: status || 'Draft',
        // Product Classification
        material_group: materialGroup || undefined,
        material: material || undefined,
        hsn_code: hsnCode || undefined,
        eccn: eccn || undefined,
        itar_controlled: itarControlled || undefined,
        country_of_origin: countryOfOrigin || undefined,
        // Unit & Pricing
        base_uom: baseUom || undefined,
        sales_uom: salesUom || undefined,
        purchase_uom: purchaseUom || undefined,
        conversion_factor: conversionFactor ? parseFloat(conversionFactor) : undefined,
        standard_cost: standardCost ? parseFloat(standardCost) : undefined,
        last_purchase_price: lastPurchasePrice ? parseFloat(lastPurchasePrice) : undefined,
        standard_selling_price: standardSellingPrice ? parseFloat(standardSellingPrice) : undefined,
        price_control: priceControl || undefined,
        costing_method: costingMethod || undefined,
        // Inventory
        valuation_method: valuationMethod || undefined,
        moving_average: movingAverage ? parseFloat(movingAverage) : undefined,
        reorder_level: reorderLevel ? parseFloat(reorderLevel) : undefined,
        max_stock_level: maxStockLevel ? parseFloat(maxStockLevel) : undefined,
        min_stock_level: minStockLevel ? parseFloat(minStockLevel) : undefined,
        lead_time_days: leadTime ? parseInt(leadTime, 10) : undefined,
        safety_stock: safetyStock ? parseFloat(safetyStock) : undefined,
        // Drawing
        drawing_number: drawingNumber || undefined,
        drawing_revision: drawingRevision || undefined,
        drawing_date: drawingDate || undefined,
        issued_by: issuedBy || undefined,
        approved_by: approvedBy || undefined,
        // Dimensional
        length_mm: length ? parseFloat(length) : undefined,
        width_mm: width ? parseFloat(width) : undefined,
        height_mm: height ? parseFloat(height) : undefined,
        net_weight_kg: netWeight ? parseFloat(netWeight) : undefined,
        gross_weight_kg: grossWeight ? parseFloat(grossWeight) : undefined,
        tolerance: tolerance || undefined,
        // Quality
        as9100_applicable: as9100Applicable || undefined,
        nadcap_applicable: nadcapApplicable || undefined,
        special_process_req: specialProcessReq || undefined,
        anodizing: anodizing || undefined,
        inspection_type: inspectionType || undefined,
        key_characteristics: keyCharacteristics || undefined,
        first_article_insp_req: firstArticleInspReq || undefined,
        // Accounts
        inventory_account: inventoryAccount || undefined,
        cogs_account: cogsAccount || undefined,
        sales_account: salesAccount || undefined,
        purchase_account: purchaseAccount || undefined,
        tax_code: taxCode || undefined,
        expense_account: expenseAccount || undefined,
        // Make/Brand
        make_brand: makeBrand || undefined,
      }
      
      if (isNew) {
        const created = await createItem(payload)
        navigate(`/masters/items/${created.id}`)
      } else {
        await updateItem(id!, payload)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      setSaveError(errMsg(err, 'Failed to save item'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setShowActionsMenu(false)
    if (isNew || !id) return
    if (!window.confirm(`Delete item "${itemName || itemCode}" (${itemCode})?\n\nThis removes it from the list.`)) return
    try {
      await deleteItem(id)
      navigate('/masters/items')
    } catch (err) {
      setSaveError(errMsg(err, 'Failed to delete item'))
    }
  }

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          Loading item...
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

  const displayName = isNew ? 'New Item' : itemName
  const itemTypeBadge = itemType === 'FG' ? 'Finished Good' : 
                        itemType === 'RM' ? 'Raw Material' : 
                        itemType === 'SFG' ? 'Semi Finished Good' : 
                        itemType === 'CONS' ? 'Consumable' :
                        itemType === 'TOOL' ? 'Tool / Fixture' :
                        itemType === 'PKG' ? 'Packaging Material' :
                        itemType === 'SPARE' ? 'Spare Part' : ''

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col gap-0">

      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="bg-white border border-gray-200 rounded-t-xl px-4 py-3">
        <button onClick={() => navigate('/masters/items')} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#005c87] mb-2">
          <ArrowLeft size={13} /> Back to Items
        </button>
        <div className="flex items-start gap-4">
          {/* Item image placeholder */}
          <div className="w-16 h-14 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
            <Settings size={24} className="text-[#204577]" />
          </div>

          {/* Item info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">{displayName}</h1>
              {itemTypeBadge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                  {itemTypeBadge}
                </span>
              )}
              <StateMachineBadge state={status} />
            </div>
            <div className="flex items-center text-xs text-gray-500 flex-wrap mt-0.5 gap-0">
              {itemCode && <span>Item Code: {itemCode}</span>}
              {partNumber && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Part Number: {partNumber}</span>
                </>
              )}
              {revision && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Revision: {revision}</span>
                </>
              )}
              {itemType && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Item Type: {itemType} - {itemTypeBadge}</span>
                </>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-400 flex-wrap mt-0.5 gap-0">
              {itemCategory && <span>Item Category: {itemCategory}</span>}
              {baseUom && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>UOM: {baseUom}</span>
                </>
              )}
              {makeBrand && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Make/Brand: {makeBrand}</span>
                </>
              )}
              {taxCode && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Tax Code: {taxCode}</span>
                </>
              )}
            </div>
          </div>

          {/* Certification badges */}
          <div className="flex items-center gap-2 shrink-0">
            {nadcapApplicable === 'Yes' && (
              <div className="px-2 py-1 rounded bg-blue-900 text-white text-[9px] font-bold tracking-wide">
                NADCAP
              </div>
            )}
            {as9100Applicable === 'Yes' && (
              <div className="px-2 py-1 rounded bg-[#204577] text-white text-[9px] font-bold tracking-wide">
                AS 9100 REV D CERTIFIED
              </div>
            )}
          </div>

          {/* Meta info + action buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {/* PDF Upload for AI extraction */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-[#E8A838] text-[#E8A838] hover:bg-[#E8A838]/10 transition-colors"
              >
                <Upload size={12} /> Upload PDF
              </button>
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
                      Duplicate
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
                    {!isNew && (
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 text-right space-y-0.5">
              {createdAt && (
                <div>Created On: {formatDate(createdAt)}</div>
              )}
              {updatedAt && (
                <div>Last Modified: {formatDate(updatedAt)}</div>
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
            {/* General tab: Basic Information, Product Classification and
                Drawing & Revision. Costing (specifications, unit & pricing),
                Stores (inventory), Quality and Suppliers each live in their own
                module, so they are not shown here. */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start content-start">

              <SectionCard
                icon={<Info size={12} className="text-blue-500" />}
                title="Basic Information"
                color="bg-blue-50"
              >
                <FieldRow label="Item Code" required>
                  <FieldInput
                    value={itemCode}
                    onChange={(v) => setItemCode(v.toUpperCase())}
                    placeholder="ITM-0001"
                    disabled={!isNew}
                  />
                </FieldRow>
                <FieldRow label="Item Name" required>
                  <FieldInput value={itemName} onChange={setItemName} placeholder="Full item name" />
                </FieldRow>
                <FieldRow label="Short Name">
                  <FieldInput value={shortName} onChange={setShortName} placeholder="Short name" />
                </FieldRow>
                <FieldRow label="Part Number" required>
                  <FieldInput value={partNumber} onChange={setPartNumber} placeholder="KSX-350-1001" />
                </FieldRow>
                <FieldRow label="Revision" required>
                  <FieldInput value={revision} onChange={setRevision} placeholder="Rev A" />
                </FieldRow>
                <FieldRow label="Description">
                  <FieldTextarea value={description} onChange={setDescription} placeholder="Item description..." rows={2} />
                </FieldRow>
                <FieldRow label="Item Type" required>
                  <FieldSelect value={itemType} onChange={setItemType} options={ITEM_TYPE_OPTIONS} />
                </FieldRow>
                <FieldRow label="Item Category" required>
                  <FieldSelect value={itemCategory} onChange={setItemCategory} options={ITEM_CATEGORY_OPTIONS} />
                </FieldRow>
                <FieldRow label="Status" required>
                  <FieldSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                </FieldRow>
              </SectionCard>

              <SectionCard
                icon={<Shield size={12} className="text-purple-500" />}
                title="Product Classification"
                color="bg-purple-50"
              >
                <FieldRow label="Material Group">
                  <FieldSelect value={materialGroup} onChange={setMaterialGroup} options={MATERIAL_GROUP_OPTIONS} />
                </FieldRow>
                <FieldRow label="Material">
                  <FieldSelect value={material} onChange={setMaterial} options={MATERIAL_OPTIONS} />
                </FieldRow>
                <FieldRow label="HSN Code">
                  <FieldInput value={hsnCode} onChange={setHsnCode} placeholder="84839000" maxLength={10} />
                </FieldRow>
                <FieldRow label="ECCN">
                  <FieldInput value={eccn} onChange={setEccn} placeholder="EAR99" />
                </FieldRow>
                <FieldRow label="ITAR Controlled">
                  <FieldSelect value={itarControlled} onChange={setItarControlled} options={YES_NO_OPTIONS} />
                </FieldRow>
                <FieldRow label="Country of Origin">
                  <FieldSelect value={countryOfOrigin} onChange={setCountryOfOrigin} options={COUNTRY_OPTIONS} />
                </FieldRow>
              </SectionCard>

              <SectionCard
                icon={<FileText size={12} className="text-teal-500" />}
                title="Drawing & Revision"
                color="bg-teal-50"
              >
                <FieldRow label="Drawing Number">
                  <FieldInput value={drawingNumber} onChange={setDrawingNumber} placeholder="DRG-XXX-0001" />
                </FieldRow>
                <FieldRow label="Drawing Revision">
                  <FieldInput value={drawingRevision} onChange={setDrawingRevision} placeholder="Rev A" />
                </FieldRow>
                <FieldRow label="Drawing Date">
                  <FieldInput value={drawingDate} onChange={setDrawingDate} type="date" />
                </FieldRow>
                <FieldRow label="Issued By">
                  <FieldInput value={issuedBy} onChange={setIssuedBy} placeholder="Design Team" />
                </FieldRow>
                <FieldRow label="Approved By">
                  <FieldInput value={approvedBy} onChange={setApprovedBy} placeholder="QA Manager" />
                </FieldRow>
              </SectionCard>
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => navigate('/masters/items')}
                className="px-4 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
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

        {/* ---- CATEGORY & CLASSIFICATION TAB ---------------------------------- */}
        {activeTab === 'category' && (
          <div className="grid grid-cols-2 gap-3 items-start content-start">
            <SectionCard
              icon={<Settings size={12} className="text-blue-500" />}
              title="Item Classification"
              color="bg-blue-50"
            >
              <FieldRow label="Item Type" required>
                <FieldSelect value={itemType} onChange={setItemType} options={ITEM_TYPE_OPTIONS} />
              </FieldRow>
              <FieldRow label="Item Category" required>
                <FieldSelect value={itemCategory} onChange={setItemCategory} options={ITEM_CATEGORY_OPTIONS} />
              </FieldRow>
              <FieldRow label="Material Group">
                <FieldSelect value={materialGroup} onChange={setMaterialGroup} options={MATERIAL_GROUP_OPTIONS} />
              </FieldRow>
              <FieldRow label="Material">
                <FieldSelect value={material} onChange={setMaterial} options={MATERIAL_OPTIONS} />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Shield size={12} className="text-purple-500" />}
              title="Trade Compliance"
              color="bg-purple-50"
            >
              <FieldRow label="HSN Code">
                <FieldInput value={hsnCode} onChange={setHsnCode} placeholder="84839000" maxLength={10} />
              </FieldRow>
              <FieldRow label="ECCN">
                <FieldInput value={eccn} onChange={setEccn} placeholder="EAR99" />
              </FieldRow>
              <FieldRow label="ITAR Controlled">
                <FieldSelect value={itarControlled} onChange={setItarControlled} options={YES_NO_OPTIONS} />
              </FieldRow>
              <FieldRow label="Country of Origin">
                <FieldSelect value={countryOfOrigin} onChange={setCountryOfOrigin} options={COUNTRY_OPTIONS} />
              </FieldRow>
            </SectionCard>
          </div>
        )}

        {/* ---- MANUFACTURING TAB ---------------------------------- */}
        {activeTab === 'manufacturing' && (
          <div className="grid grid-cols-2 gap-3 items-start content-start">
            <SectionCard
              icon={<Factory size={12} className="text-indigo-500" />}
              title="Manufacturing Details"
              color="bg-indigo-50"
            >
              <FieldRow label="Make/Brand">
                <FieldInput value={makeBrand} onChange={setMakeBrand} placeholder="Manufacturer name" />
              </FieldRow>
              <FieldRow label="Lead Time (Days)">
                <FieldInput value={leadTime} onChange={setLeadTime} placeholder="0" type="number" />
              </FieldRow>
              <FieldRow label="Material">
                <FieldSelect value={material} onChange={setMaterial} options={MATERIAL_OPTIONS} />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<FileText size={12} className="text-teal-500" />}
              title="Drawing Information"
              color="bg-teal-50"
            >
              <FieldRow label="Drawing Number">
                <FieldInput value={drawingNumber} onChange={setDrawingNumber} placeholder="DRG-XXX-0001" />
              </FieldRow>
              <FieldRow label="Drawing Revision">
                <FieldInput value={drawingRevision} onChange={setDrawingRevision} placeholder="Rev A" />
              </FieldRow>
              <FieldRow label="Drawing Date">
                <FieldInput value={drawingDate} onChange={setDrawingDate} type="date" />
              </FieldRow>
              <FieldRow label="Issued By">
                <FieldInput value={issuedBy} onChange={setIssuedBy} placeholder="Design Team" />
              </FieldRow>
              <FieldRow label="Approved By">
                <FieldInput value={approvedBy} onChange={setApprovedBy} placeholder="QA Manager" />
              </FieldRow>
            </SectionCard>
          </div>
        )}

        {/* ---- DOCUMENTS TAB ---------------------------------- */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{ alignSelf: 'start' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-amber-50">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-amber-500" />
                <h3 className="text-xs font-semibold text-gray-700">Documents</h3>
                <span className="text-[10px] text-gray-400">(current versions)</span>
              </div>
              <button
                onClick={() => { setShowUploadDoc((v) => !v); setDocError(null) }}
                disabled={isNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#005c87] rounded hover:bg-[#004a6e] transition-colors disabled:opacity-50"
                title={isNew ? 'Save the item before uploading documents' : 'Upload a document'}
              >
                <Upload size={12} /> Upload Document
              </button>
            </div>

            {showUploadDoc && !isNew && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Document Type</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white min-w-[150px]"
                  >
                    <option>Drawing</option>
                    <option>STEP / 3D Model</option>
                    <option>Certificate</option>
                    <option>Specification</option>
                    <option>Inspection</option>
                    <option>PO</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Revision</label>
                  <input
                    value={uploadDocRevision}
                    onChange={(e) => setUploadDocRevision(e.target.value)}
                    placeholder="Rev A"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-24"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Document No.</label>
                  <input
                    value={uploadDocNumber}
                    onChange={(e) => setUploadDocNumber(e.target.value)}
                    placeholder="Optional"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-32"
                  />
                </div>
                <input ref={docFileRef} type="file" className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.dwg,.step,.stp"
                  onChange={handleDocFileChange} />
                <button
                  onClick={() => docFileRef.current?.click()}
                  disabled={docBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Upload size={12} /> {docBusy ? 'Uploading…' : 'Choose File & Upload'}
                </button>
                <span className="text-[10px] text-gray-400 max-w-[280px]">
                  A new file for an existing type supersedes the prior revision (kept in History).
                </span>
              </div>
            )}
            {docError && (
              <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">{docError}</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">S. No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Document Type</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">File Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Revision</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Version</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded On</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded By</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">AI Read</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-gray-400">
                        No documents uploaded
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc, idx) => (
                      <Fragment key={doc.id}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-700">{doc.document_type}</td>
                        <td className="px-3 py-2">
                          {doc.file_path ? (
                            <a href={doc.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              {doc.file_name || 'file'}
                            </a>
                          ) : (
                            <span className="text-gray-500">{doc.file_name}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{doc.revision || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">v{doc.version_no}</td>
                        <td className="px-3 py-2 text-gray-500">{formatDate(doc.uploaded_at || '')}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.uploaded_by || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          {doc.extraction_status === 'pending' ? (
                            <span className="text-amber-600 text-[11px]">Reading…</span>
                          ) : doc.extraction_status === 'unsupported_file_type' ? (
                            <span className="text-gray-400 text-[11px]" title="AI reading supports PDF only">—</span>
                          ) : doc.extraction_status === 'failed' ? (
                            <span className="text-red-500 text-[11px]" title="AI reading failed">Failed</span>
                          ) : doc.extracted_fields ? (
                            <button
                              onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                              className="text-blue-600 text-[11px] font-medium hover:underline"
                            >
                              {expandedDocId === doc.id ? 'Hide' : 'Review AI'}
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            {doc.file_path && (
                              <a href={doc.file_path} target="_blank" rel="noreferrer" className="p-1 text-gray-400 hover:text-[#005c87]" title="Download">
                                <Download size={14} />
                              </a>
                            )}
                            <button onClick={() => handleDeleteDoc(doc.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedDocId === doc.id && doc.extracted_fields && (
                        <tr className="bg-blue-50/40 border-b border-gray-100">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-semibold text-gray-600">AI-extracted fields — review, then apply</span>
                              <button
                                onClick={() => applyExtractedToForm(doc.extracted_fields)}
                                className="px-2.5 py-1 text-[11px] font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                              >
                                Apply all to form
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-[11px]">
                              {Object.entries(doc.extracted_fields)
                                .filter(([k, val]: any) => k !== '_meta' && val && typeof val === 'object' && 'value' in val && val.value != null && typeof val.value !== 'object')
                                .map(([k, val]: any) => (
                                  <div key={k} className="flex justify-between gap-2">
                                    <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                    <span className="text-gray-800 font-medium truncate" title={String(val.value)}>
                                      {String(val.value)}{typeof val.confidence === 'number' ? ` (${Math.round(val.confidence * 100)}%)` : ''}
                                    </span>
                                  </div>
                                ))}
                            </div>
                            {doc.extracted_fields?._meta?.model_used && (
                              <div className="mt-2 text-[10px] text-gray-400">Model: {String(doc.extracted_fields._meta.model_used)}</div>
                            )}
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- CUSTOMER PART MAP TAB ---------------------------------- */}
        {activeTab === 'customerPartMap' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{ alignSelf: 'start' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-purple-50">
              <div className="flex items-center gap-2">
                <Users size={12} className="text-purple-500" />
                <h3 className="text-xs font-semibold text-gray-700">Customer Part Mapping</h3>
              </div>
              <button
                onClick={() => { setShowAddCpm((v) => !v); setCpmError(null) }}
                disabled={isNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#005c87] rounded hover:bg-[#004a6e] transition-colors disabled:opacity-50"
                title={isNew ? 'Save the item first' : 'Add a customer part mapping'}
              >
                <Plus size={12} /> Add Mapping
              </button>
            </div>

            {showAddCpm && !isNew && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Customer</label>
                  <select
                    value={cpmCustomerId}
                    onChange={(e) => setCpmCustomerId(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white min-w-[220px]"
                  >
                    <option value="">- Select customer -</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>{c.customer_code} — {c.customer_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Customer Part No.</label>
                  <input
                    value={cpmPartNo}
                    onChange={(e) => setCpmPartNo(e.target.value)}
                    placeholder="e.g. 23-70-00006-00"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-48"
                  />
                </div>
                <button
                  onClick={handleAddCpm}
                  disabled={cpmBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Plus size={12} /> {cpmBusy ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}
            {cpmError && (
              <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">{cpmError}</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">S. No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Customer Code</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Customer Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Customer Part No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customerParts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                        No customer mappings found
                      </td>
                    </tr>
                  ) : (
                    customerParts.map((m, idx) => (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 text-blue-600">{m.customer_code || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{m.customer_name || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{m.customer_part_no || '—'}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">Active</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleDeleteCpm(m.id)} className="p-1 text-gray-400 hover:text-red-500" title="Remove">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- BOM TAB ---------------------------------- */}
        {activeTab === 'bom' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{ alignSelf: 'start' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-blue-50">
              <div className="flex items-center gap-2">
                <Link size={12} className="text-blue-500" />
                <h3 className="text-xs font-semibold text-gray-700">Bill of Materials (BOM)</h3>
              </div>
              <button
                onClick={() => { setShowAddBom((v) => !v); setBomError(null) }}
                disabled={isNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#005c87] rounded hover:bg-[#004a6e] transition-colors disabled:opacity-50"
                title={isNew ? 'Save the item first' : 'Add a BOM component'}
              >
                <Plus size={12} /> Add Component
              </button>
            </div>

            {showAddBom && !isNew && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Component Code</label>
                  <input value={bomCode} onChange={(e) => setBomCode(e.target.value)} placeholder="ITM-0002"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-32" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Component Name</label>
                  <input value={bomName} onChange={(e) => setBomName(e.target.value)} placeholder="Component name"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-44" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Quantity</label>
                  <input value={bomQty} onChange={(e) => setBomQty(e.target.value)} placeholder="1" type="number"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">UOM</label>
                  <input value={bomUom} onChange={(e) => setBomUom(e.target.value)} placeholder="Nos"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Level</label>
                  <input value={bomLevel} onChange={(e) => setBomLevel(e.target.value)} placeholder="1" type="number"
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white w-16" />
                </div>
                <button
                  onClick={handleAddBom}
                  disabled={bomBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Plus size={12} /> {bomBusy ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}
            {bomError && (
              <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">{bomError}</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">S. No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Component Code</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Component Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Quantity</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">UOM</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Level</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bomComponents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                        No BOM components defined
                      </td>
                    </tr>
                  ) : (
                    bomComponents.map((c, idx) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 text-blue-600">{c.component_code || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{c.component_name || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{c.quantity ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{c.uom || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{c.level ?? '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleDeleteBom(c.id)} className="p-1 text-gray-400 hover:text-red-500" title="Remove">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- HISTORY TAB ---------------------------------- */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-3">
            {/* Document Revision History (all versions, superseded retained) */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <History size={12} className="text-gray-500" />
                <h3 className="text-xs font-semibold text-gray-700">Document Revision History</h3>
                <span className="text-[10px] text-gray-400">(all versions — superseded revisions retained)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Document Type</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">File Name</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Revision</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Version</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded On</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                          No document revisions yet
                        </td>
                      </tr>
                    ) : (
                      docHistory.map((doc) => (
                        <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">{doc.document_type}</td>
                          <td className="px-3 py-2">
                            {doc.file_path ? (
                              <a href={doc.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                {doc.file_name || 'file'}
                              </a>
                            ) : (<span className="text-gray-500">{doc.file_name}</span>)}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{doc.revision || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">v{doc.version_no}</td>
                          <td className="px-3 py-2">
                            {doc.is_current ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">Current</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">Superseded</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{formatDate(doc.uploaded_at || '')}</td>
                          <td className="px-3 py-2 text-gray-500">{doc.uploaded_by || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Record Information + Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-blue-50">
                  <Info size={12} className="text-blue-500" />
                  <h3 className="text-xs font-semibold text-gray-700">Record Information</h3>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-gray-700">{status || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Documents (current)</span><span className="text-gray-700">{documents.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total revisions</span><span className="text-gray-700">{docHistory.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-700">{createdAt ? formatDate(createdAt) : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Last Modified</span><span className="text-gray-700">{updatedAt ? formatDate(updatedAt) : '—'}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <History size={12} className="text-gray-500" />
                  <h3 className="text-xs font-semibold text-gray-700">Recent Activity</h3>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  {isNew ? (
                    <p className="text-gray-400">No activity for new items</p>
                  ) : (
                    <>
                      {docHistory.slice(0, 6).map((doc) => (
                        <div key={doc.id} className="flex justify-between gap-3">
                          <span className="text-gray-700">
                            {doc.is_current ? 'Uploaded' : 'Superseded'} {doc.document_type} rev {doc.revision || '—'} (v{doc.version_no})
                          </span>
                          <span className="text-gray-400 whitespace-nowrap">{formatDate(doc.uploaded_at || '')}</span>
                        </div>
                      ))}
                      {updatedAt && (
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-700">Record last modified</span>
                          <span className="text-gray-400 whitespace-nowrap">{formatDate(updatedAt)}</span>
                        </div>
                      )}
                      {createdAt && (
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-700">Record created</span>
                          <span className="text-gray-400 whitespace-nowrap">{formatDate(createdAt)}</span>
                        </div>
                      )}
                      {docHistory.length === 0 && !updatedAt && !createdAt && (
                        <p className="text-gray-400">No activity recorded</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* AI Extraction Modal */}
      {showAiModal && pendingFile && (
        <AiExtractionModal
          file={pendingFile}
          apiPermissionGranted={true}
          onComplete={handleExtractionComplete}
          onError={handleExtractionError}
          onClose={() => { setShowAiModal(false); setPendingFile(null) }}
        />
      )}
    </div>
  )
}













