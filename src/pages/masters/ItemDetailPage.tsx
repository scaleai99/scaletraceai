/**
 * ItemDetailPage - Module 01: Item Master detail view.
 *
 * Layout matches the BRACKET ASSY "" LH reference image exactly:
 *   - Header: item image + item name + Finished Good badge + meta info + action buttons
 *   - Certification badges (NADCAP, AS9100) in header
 *   - 12 tabs: General Information | Specifications | Category & Classification |
 *              Unit & Pricing | Inventory | Manufacturing | Quality |
 *              Documents | Suppliers | Customer Part Map | BOM | History
 *   - General Information: 4-column SectionCard layout
 *   - Documents, Supplier Info, Customer Part Mapping sections
 *   - Footer with audit info
 */

import { useCallback, useEffect, useState, useRef } from 'react'
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
} from '../../api/itemApi'

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
type TabId =
  | 'general'
  | 'specifications'
  | 'category'
  | 'unitPricing'
  | 'inventory'
  | 'manufacturing'
  | 'quality'
  | 'documents'
  | 'suppliers'
  | 'customerPartMap'
  | 'bom'
  | 'history'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General Information' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'category', label: 'Category & Classification' },
  { id: 'unitPricing', label: 'Unit & Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'quality', label: 'Quality' },
  { id: 'documents', label: 'Documents' },
  { id: 'suppliers', label: 'Suppliers' },
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
interface ItemDocument {
  id: string
  documentType: string
  fileName: string
  revision: string
  uploadedOn: string
  uploadedBy: string
}

/** Supplier row interface */
interface ItemSupplier {
  supplierCode: string
  supplierName: string
  supplyType: string
  leadTime: string
}

/** Customer Part Mapping interface */
interface CustomerPartMap {
  customerCode: string
  customerName: string
  customerPartNo: string
}

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

  // ---- Suppliers ----
  const [suppliers, setSuppliers] = useState<ItemSupplier[]>([])

  // ---- Customer Part Mapping ----
  const [customerPartMaps, setCustomerPartMaps] = useState<CustomerPartMap[]>([])

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
    
    // Populate fields from extraction result
    if (result.drawing_number?.value) setDrawingNumber(String(result.drawing_number.value))
    if (result.part_name?.value) setItemName(String(result.part_name.value))
    if (result.revision?.value) setRevision(String(result.revision.value))
    if (result.material_spec?.value) setMaterial(String(result.material_spec.value))
    if (result.length_mm?.value) setLength(String(result.length_mm.value))
    if (result.width_mm?.value) setWidth(String(result.width_mm.value))
    if (result.diameter_mm?.value) setWidth(String(result.diameter_mm.value))
    if (result.surface_treatment?.value) setAnodizing(String(result.surface_treatment.value))
    if (result.drawing_date?.value) setDrawingDate(String(result.drawing_date.value))
    
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
            {/* Row 1: 4-column grid */}
            <div className="grid grid-cols-4 gap-3 items-start content-start">

              {/* Column 1 "" Basic Information */}
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

              {/* Column 2 "" Product Classification */}
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

              {/* Column 3 "" Unit & Pricing */}
              <SectionCard
                icon={<CreditCard size={12} className="text-green-500" />}
                title="Unit & Pricing"
                color="bg-green-50"
              >
                <FieldRow label="Base UOM" required>
                  <FieldSelect value={baseUom} onChange={setBaseUom} options={UOM_OPTIONS} />
                </FieldRow>
                <FieldRow label="Sales UOM" required>
                  <FieldSelect value={salesUom} onChange={setSalesUom} options={UOM_OPTIONS} />
                </FieldRow>
                <FieldRow label="Purchase UOM" required>
                  <FieldSelect value={purchaseUom} onChange={setPurchaseUom} options={UOM_OPTIONS} />
                </FieldRow>
                <FieldRow label="Conversion Factor">
                  <FieldInput value={conversionFactor} onChange={setConversionFactor} placeholder="1.00" type="number" />
                </FieldRow>
                <FieldRow label="Standard Cost (‚¹)">
                  <FieldInput value={standardCost} onChange={setStandardCost} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Last Purch. Price (‚¹)">
                  <FieldInput value={lastPurchasePrice} onChange={setLastPurchasePrice} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Std Selling Price (‚¹)">
                  <FieldInput value={standardSellingPrice} onChange={setStandardSellingPrice} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Price Control">
                  <FieldSelect value={priceControl} onChange={setPriceControl} options={PRICE_CONTROL_OPTIONS} />
                </FieldRow>
                <FieldRow label="Costing Method">
                  <FieldSelect value={costingMethod} onChange={setCostingMethod} options={COSTING_METHOD_OPTIONS} />
                </FieldRow>
              </SectionCard>

              {/* Column 4 "" Inventory Information */}
              <SectionCard
                icon={<Boxes size={12} className="text-orange-500" />}
                title="Inventory Information"
                color="bg-orange-50"
              >
                <FieldRow label="Valuation Method">
                  <FieldSelect value={valuationMethod} onChange={setValuationMethod} options={VALUATION_METHOD_OPTIONS} />
                </FieldRow>
                <FieldRow label="Moving Average">
                  <FieldInput value={movingAverage} onChange={setMovingAverage} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Reorder Level">
                  <FieldInput value={reorderLevel} onChange={setReorderLevel} placeholder="0" type="number" />
                </FieldRow>
                <FieldRow label="Max Stock Level">
                  <FieldInput value={maxStockLevel} onChange={setMaxStockLevel} placeholder="0" type="number" />
                </FieldRow>
                <FieldRow label="Min Stock Level">
                  <FieldInput value={minStockLevel} onChange={setMinStockLevel} placeholder="0" type="number" />
                </FieldRow>
                <FieldRow label="Lead Time (Days)">
                  <FieldInput value={leadTime} onChange={setLeadTime} placeholder="0" type="number" />
                </FieldRow>
                <FieldRow label="Safety Stock">
                  <FieldInput value={safetyStock} onChange={setSafetyStock} placeholder="0" type="number" />
                </FieldRow>
                <FieldRow label="Stock in Hand">
                  <FieldInput value={stockInHand} onChange={setStockInHand} placeholder="0" type="number" disabled />
                </FieldRow>
                <FieldRow label="Stock in Transit">
                  <FieldInput value={stockInTransit} onChange={setStockInTransit} placeholder="0" type="number" disabled />
                </FieldRow>
                <FieldRow label="Reserved Stock">
                  <FieldInput value={reservedStock} onChange={setReservedStock} placeholder="0" type="number" disabled />
                </FieldRow>
              </SectionCard>
            </div>

            {/* Row 2: 4-column grid */}
            <div className="grid grid-cols-4 gap-3 items-start content-start">

              {/* Column 1 "" Drawing & Revision */}
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
                <div className="px-3 py-2">
                  <button className="w-full px-3 py-1.5 text-xs font-medium text-[#005c87] border border-[#005c87] rounded hover:bg-[#005c87]/5 transition-colors flex items-center justify-center gap-1">
                    <Eye size={12} /> View Drawing
                  </button>
                </div>
              </SectionCard>

              {/* Column 2 "" Dimensional & Weight */}
              <SectionCard
                icon={<Ruler size={12} className="text-blue-500" />}
                title="Dimensional & Weight"
                color="bg-blue-50"
              >
                <FieldRow label="Length (mm)">
                  <FieldInput value={length} onChange={setLength} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Width (mm)">
                  <FieldInput value={width} onChange={setWidth} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Height (mm)">
                  <FieldInput value={height} onChange={setHeight} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Net Weight (Kg)">
                  <FieldInput value={netWeight} onChange={setNetWeight} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Gross Weight (Kg)">
                  <FieldInput value={grossWeight} onChange={setGrossWeight} placeholder="0.00" type="number" />
                </FieldRow>
                <FieldRow label="Tolerance">
                  <FieldInput value={tolerance} onChange={setTolerance} placeholder="±0.05mm" />
                </FieldRow>
              </SectionCard>

              {/* Column 3 "" Quality & Certifications */}
              <SectionCard
                icon={<Award size={12} className="text-amber-500" />}
                title="Quality & Certifications"
                color="bg-amber-50"
              >
                <FieldRow label="AS9100 Applicable">
                  <FieldSelect value={as9100Applicable} onChange={setAs9100Applicable} options={YES_NO_OPTIONS} />
                </FieldRow>
                <FieldRow label="NADCAP Applicable">
                  <FieldSelect value={nadcapApplicable} onChange={setNadcapApplicable} options={YES_NO_OPTIONS} />
                </FieldRow>
                <FieldRow label="Special Process Req.">
                  <FieldSelect value={specialProcessReq} onChange={setSpecialProcessReq} options={YES_NO_OPTIONS} />
                </FieldRow>
                <FieldRow label="Anodizing (NADCAP)">
                  <FieldInput value={anodizing} onChange={setAnodizing} placeholder="Type II, Class 1" />
                </FieldRow>
                <FieldRow label="Inspection Type">
                  <FieldSelect value={inspectionType} onChange={setInspectionType} options={INSPECTION_TYPE_OPTIONS} />
                </FieldRow>
                <FieldRow label="Key Characteristics">
                  <FieldInput value={keyCharacteristics} onChange={setKeyCharacteristics} placeholder="Critical dimensions..." />
                </FieldRow>
                <FieldRow label="First Article Insp. Req.">
                  <FieldSelect value={firstArticleInspReq} onChange={setFirstArticleInspReq} options={YES_NO_OPTIONS} />
                </FieldRow>
              </SectionCard>

              {/* Column 4 "" Default Accounts */}
              <SectionCard
                icon={<BarChart2 size={12} className="text-indigo-500" />}
                title="Default Accounts"
                color="bg-indigo-50"
              >
                <FieldRow label="Inventory Account">
                  <FieldInput value={inventoryAccount} onChange={setInventoryAccount} placeholder="1310 - Inventory" />
                </FieldRow>
                <FieldRow label="COGS Account">
                  <FieldInput value={cogsAccount} onChange={setCogsAccount} placeholder="5110 - COGS" />
                </FieldRow>
                <FieldRow label="Sales Account">
                  <FieldInput value={salesAccount} onChange={setSalesAccount} placeholder="4110 - Sales" />
                </FieldRow>
                <FieldRow label="Purchase Account">
                  <FieldInput value={purchaseAccount} onChange={setPurchaseAccount} placeholder="5210 - Purchase" />
                </FieldRow>
                <FieldRow label="Tax Code">
                  <FieldSelect value={taxCode} onChange={setTaxCode} options={TAX_CODE_OPTIONS} />
                </FieldRow>
                <FieldRow label="Expense Account">
                  <FieldInput value={expenseAccount} onChange={setExpenseAccount} placeholder="6110 - Expense" />
                </FieldRow>
              </SectionCard>
            </div>

            {/* Row 3: 3-column grid with varying widths */}
            <div className="grid grid-cols-12 gap-3 items-start content-start">

              {/* Documents - wider (6 cols) */}
              <div className="col-span-6">
                <SectionCard
                  icon={<FileText size={12} className="text-amber-500" />}
                  title="Documents"
                  color="bg-amber-50"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Document Type</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">File Name</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Revision</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded On</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded By</th>
                          <th className="px-3 py-2 text-center text-gray-500 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-gray-400">
                              No documents uploaded
                            </td>
                          </tr>
                        ) : (
                          documents.map((doc) => (
                            <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-700">{doc.documentType}</td>
                              <td className="px-3 py-2 text-blue-600">{doc.fileName}</td>
                              <td className="px-3 py-2 text-gray-500">{doc.revision}</td>
                              <td className="px-3 py-2 text-gray-500">{formatDate(doc.uploadedOn)}</td>
                              <td className="px-3 py-2 text-gray-500">{doc.uploadedBy}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button className="p-1 text-gray-400 hover:text-[#005c87]" title="View">
                                    <Eye size={12} />
                                  </button>
                                  <button className="p-1 text-gray-400 hover:text-[#005c87]" title="Download">
                                    <Download size={12} />
                                  </button>
                                  <button className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 py-2 border-t border-gray-100">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#005c87] border border-[#005c87] rounded hover:bg-[#005c87]/5 transition-colors">
                      <Upload size={12} /> Upload Document
                    </button>
                  </div>
                </SectionCard>
              </div>

              {/* Supplier Information (Primary) - 3 cols */}
              <div className="col-span-3">
                <SectionCard
                  icon={<Truck size={12} className="text-teal-500" />}
                  title="Supplier Information (Primary)"
                  color="bg-teal-50"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">Supplier Code</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">Supplier Name</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">Supply Type</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">Lead Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                              No suppliers linked
                            </td>
                          </tr>
                        ) : (
                          suppliers.slice(0, 3).map((sup, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-2 py-2 text-blue-600">{sup.supplierCode}</td>
                              <td className="px-2 py-2 text-gray-700">{sup.supplierName}</td>
                              <td className="px-2 py-2 text-gray-500">{sup.supplyType}</td>
                              <td className="px-2 py-2 text-gray-500">{sup.leadTime} days</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 py-2 border-t border-gray-100">
                    <button 
                      onClick={() => setActiveTab('suppliers')}
                      className="text-xs text-[#005c87] hover:underline flex items-center gap-1"
                    >
                      View All Suppliers <span>†'</span>
                    </button>
                  </div>
                </SectionCard>
              </div>

              {/* Customer Part Mapping - 3 cols */}
              <div className="col-span-3">
                <SectionCard
                  icon={<Users size={12} className="text-purple-500" />}
                  title="Customer Part Mapping"
                  color="bg-purple-50"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">Customer Code</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">Customer Name</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">Customer Part No.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerPartMaps.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-2 py-4 text-center text-gray-400">
                              No mappings found
                            </td>
                          </tr>
                        ) : (
                          customerPartMaps.slice(0, 3).map((map, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-2 py-2 text-blue-600">{map.customerCode}</td>
                              <td className="px-2 py-2 text-gray-700">{map.customerName}</td>
                              <td className="px-2 py-2 text-gray-500">{map.customerPartNo}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 py-2 border-t border-gray-100">
                    <button 
                      onClick={() => setActiveTab('customerPartMap')}
                      className="text-xs text-[#005c87] hover:underline flex items-center gap-1"
                    >
                      View All Customer Mappings <span>†'</span>
                    </button>
                  </div>
                </SectionCard>
              </div>
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

        {/* ---- SPECIFICATIONS TAB ---------------------------------- */}
        {activeTab === 'specifications' && (
          <div className="grid grid-cols-3 gap-3 items-start content-start">
            <SectionCard
              icon={<Ruler size={12} className="text-blue-500" />}
              title="Dimensional Specifications"
              color="bg-blue-50"
            >
              <FieldRow label="Length (mm)">
                <FieldInput value={length} onChange={setLength} placeholder="0.00" type="number" />
              </FieldRow>
              <FieldRow label="Width (mm)">
                <FieldInput value={width} onChange={setWidth} placeholder="0.00" type="number" />
              </FieldRow>
              <FieldRow label="Height (mm)">
                <FieldInput value={height} onChange={setHeight} placeholder="0.00" type="number" />
              </FieldRow>
              <FieldRow label="Tolerance">
                <FieldInput value={tolerance} onChange={setTolerance} placeholder="±0.05mm" />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Package size={12} className="text-green-500" />}
              title="Weight Specifications"
              color="bg-green-50"
            >
              <FieldRow label="Net Weight (Kg)">
                <FieldInput value={netWeight} onChange={setNetWeight} placeholder="0.00" type="number" />
              </FieldRow>
              <FieldRow label="Gross Weight (Kg)">
                <FieldInput value={grossWeight} onChange={setGrossWeight} placeholder="0.00" type="number" />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Shield size={12} className="text-purple-500" />}
              title="Material Specifications"
              color="bg-purple-50"
            >
              <FieldRow label="Material Group">
                <FieldSelect value={materialGroup} onChange={setMaterialGroup} options={MATERIAL_GROUP_OPTIONS} />
              </FieldRow>
              <FieldRow label="Material">
                <FieldSelect value={material} onChange={setMaterial} options={MATERIAL_OPTIONS} />
              </FieldRow>
            </SectionCard>
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

        {/* ---- UNIT & PRICING TAB ---------------------------------- */}
        {activeTab === 'unitPricing' && (
          <div className="grid grid-cols-2 gap-3 items-start content-start">
            <SectionCard
              icon={<Package size={12} className="text-green-500" />}
              title="Unit of Measure"
              color="bg-green-50"
            >
              <FieldRow label="Base UOM" required>
                <FieldSelect value={baseUom} onChange={setBaseUom} options={UOM_OPTIONS} />
              </FieldRow>
              <FieldRow label="Sales UOM" required>
                <FieldSelect value={salesUom} onChange={setSalesUom} options={UOM_OPTIONS} />
              </FieldRow>
              <FieldRow label="Purchase UOM" required>
                <FieldSelect value={purchaseUom} onChange={setPurchaseUom} options={UOM_OPTIONS} />
              </FieldRow>
              <FieldRow label="Conversion Factor">
                <FieldInput value={conversionFactor} onChange={setConversionFactor} placeholder="1.00" type="number" />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<CreditCard size={12} className="text-blue-500" />}
              title="Pricing Information"
              color="bg-blue-50"
            >
              <FieldRow label="Standard Cost (‚¹)">
                <FieldInput value={standardCost} onChange={setStandardCost} placeholder="0.00" type="number" />
              </FieldRow>
              <FieldRow label="Last Purch. Price (‚¹)">
                <FieldInput value={lastPurchasePrice} onChange={setLastPurchasePrice} placeholder="0.00" type="number" />
              </FieldRow>
              <FieldRow label="Std Selling Price (‚¹)">
                <FieldInput value={standardSellingPrice} onChange={setStandardSellingPrice} placeholder="0.00" type="number" />
              </FieldRow>
              <FieldRow label="Price Control">
                <FieldSelect value={priceControl} onChange={setPriceControl} options={PRICE_CONTROL_OPTIONS} />
              </FieldRow>
              <FieldRow label="Costing Method">
                <FieldSelect value={costingMethod} onChange={setCostingMethod} options={COSTING_METHOD_OPTIONS} />
              </FieldRow>
            </SectionCard>
          </div>
        )}

        {/* ---- INVENTORY TAB ---------------------------------- */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-2 gap-3 items-start content-start">
            <SectionCard
              icon={<Boxes size={12} className="text-orange-500" />}
              title="Stock Levels"
              color="bg-orange-50"
            >
              <FieldRow label="Reorder Level">
                <FieldInput value={reorderLevel} onChange={setReorderLevel} placeholder="0" type="number" />
              </FieldRow>
              <FieldRow label="Max Stock Level">
                <FieldInput value={maxStockLevel} onChange={setMaxStockLevel} placeholder="0" type="number" />
              </FieldRow>
              <FieldRow label="Min Stock Level">
                <FieldInput value={minStockLevel} onChange={setMinStockLevel} placeholder="0" type="number" />
              </FieldRow>
              <FieldRow label="Safety Stock">
                <FieldInput value={safetyStock} onChange={setSafetyStock} placeholder="0" type="number" />
              </FieldRow>
              <FieldRow label="Lead Time (Days)">
                <FieldInput value={leadTime} onChange={setLeadTime} placeholder="0" type="number" />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<BarChart2 size={12} className="text-blue-500" />}
              title="Current Stock"
              color="bg-blue-50"
            >
              <FieldRow label="Stock in Hand">
                <FieldInput value={stockInHand} onChange={setStockInHand} placeholder="0" type="number" disabled />
              </FieldRow>
              <FieldRow label="Stock in Transit">
                <FieldInput value={stockInTransit} onChange={setStockInTransit} placeholder="0" type="number" disabled />
              </FieldRow>
              <FieldRow label="Reserved Stock">
                <FieldInput value={reservedStock} onChange={setReservedStock} placeholder="0" type="number" disabled />
              </FieldRow>
              <FieldRow label="Valuation Method">
                <FieldSelect value={valuationMethod} onChange={setValuationMethod} options={VALUATION_METHOD_OPTIONS} />
              </FieldRow>
              <FieldRow label="Moving Average">
                <FieldInput value={movingAverage} onChange={setMovingAverage} placeholder="0.00" type="number" disabled />
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

        {/* ---- QUALITY TAB ---------------------------------- */}
        {activeTab === 'quality' && (
          <div className="grid grid-cols-2 gap-3 items-start content-start">
            <SectionCard
              icon={<Award size={12} className="text-amber-500" />}
              title="Quality Requirements"
              color="bg-amber-50"
            >
              <FieldRow label="AS9100 Applicable">
                <FieldSelect value={as9100Applicable} onChange={setAs9100Applicable} options={YES_NO_OPTIONS} />
              </FieldRow>
              <FieldRow label="NADCAP Applicable">
                <FieldSelect value={nadcapApplicable} onChange={setNadcapApplicable} options={YES_NO_OPTIONS} />
              </FieldRow>
              <FieldRow label="Special Process Req.">
                <FieldSelect value={specialProcessReq} onChange={setSpecialProcessReq} options={YES_NO_OPTIONS} />
              </FieldRow>
              <FieldRow label="Anodizing (NADCAP)">
                <FieldInput value={anodizing} onChange={setAnodizing} placeholder="Type II, Class 1" />
              </FieldRow>
            </SectionCard>

            <SectionCard
              icon={<Shield size={12} className="text-purple-500" />}
              title="Inspection Requirements"
              color="bg-purple-50"
            >
              <FieldRow label="Inspection Type">
                <FieldSelect value={inspectionType} onChange={setInspectionType} options={INSPECTION_TYPE_OPTIONS} />
              </FieldRow>
              <FieldRow label="Key Characteristics">
                <FieldInput value={keyCharacteristics} onChange={setKeyCharacteristics} placeholder="Critical dimensions..." />
              </FieldRow>
              <FieldRow label="First Article Insp. Req.">
                <FieldSelect value={firstArticleInspReq} onChange={setFirstArticleInspReq} options={YES_NO_OPTIONS} />
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
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#005c87] rounded hover:bg-[#004a6e] transition-colors">
                <Upload size={12} /> Upload Document
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">S. No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Document Type</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">File Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Revision</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded On</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Uploaded By</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                        No documents uploaded
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc, idx) => (
                      <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-700">{doc.documentType}</td>
                        <td className="px-3 py-2 text-blue-600">{doc.fileName}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.revision}</td>
                        <td className="px-3 py-2 text-gray-500">{formatDate(doc.uploadedOn)}</td>
                        <td className="px-3 py-2 text-gray-500">{doc.uploadedBy}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-[#005c87]" title="View">
                              <Eye size={14} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-[#005c87]" title="Download">
                              <Download size={14} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-500" title="Delete">
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

        {/* ---- SUPPLIERS TAB ---------------------------------- */}
        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{ alignSelf: 'start' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-teal-50">
              <div className="flex items-center gap-2">
                <Truck size={12} className="text-teal-500" />
                <h3 className="text-xs font-semibold text-gray-700">Approved Suppliers</h3>
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#005c87] rounded hover:bg-[#004a6e] transition-colors">
                <Plus size={12} /> Add Supplier
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">S. No.</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Supplier Code</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Supplier Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Supply Type</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Lead Time (Days)</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                        No suppliers linked
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((sup, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 text-blue-600">{sup.supplierCode}</td>
                        <td className="px-3 py-2 text-gray-700">{sup.supplierName}</td>
                        <td className="px-3 py-2 text-gray-500">{sup.supplyType}</td>
                        <td className="px-3 py-2 text-gray-500">{sup.leadTime}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            Approved
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-[#005c87]" title="View">
                              <Eye size={14} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-500" title="Remove">
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

        {/* ---- CUSTOMER PART MAP TAB ---------------------------------- */}
        {activeTab === 'customerPartMap' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{ alignSelf: 'start' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-purple-50">
              <div className="flex items-center gap-2">
                <Users size={12} className="text-purple-500" />
                <h3 className="text-xs font-semibold text-gray-700">Customer Part Mapping</h3>
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#005c87] rounded hover:bg-[#004a6e] transition-colors">
                <Plus size={12} /> Add Mapping
              </button>
            </div>
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
                  {customerPartMaps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                        No customer mappings found
                      </td>
                    </tr>
                  ) : (
                    customerPartMaps.map((map, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2 text-blue-600">{map.customerCode}</td>
                        <td className="px-3 py-2 text-gray-700">{map.customerName}</td>
                        <td className="px-3 py-2 text-gray-500">{map.customerPartNo}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            Active
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-[#005c87]" title="Edit">
                              <Eye size={14} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-500" title="Remove">
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
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#005c87] rounded hover:bg-[#004a6e] transition-colors">
                <Plus size={12} /> Add Component
              </button>
            </div>
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
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                      No BOM components defined
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- HISTORY TAB ---------------------------------- */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg border border-gray-200" style={{ alignSelf: 'start' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <History size={12} className="text-gray-500" />
              <h3 className="text-xs font-semibold text-gray-700">Change History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Date/Time</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">User</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Action</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Field Changed</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Old Value</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {isNew ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                        No history available for new items
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">20/01/2024 14:45</td>
                        <td className="px-3 py-2 text-gray-700">John Smith</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                            Updated
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">Standard Cost</td>
                        <td className="px-3 py-2 text-gray-400">‚¹4,200.00</td>
                        <td className="px-3 py-2 text-gray-700">‚¹4,500.00</td>
                      </tr>
                      <tr className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">15/01/2024 10:30</td>
                        <td className="px-3 py-2 text-gray-700">Sarah Wilson</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                            Updated
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">Drawing Revision</td>
                        <td className="px-3 py-2 text-gray-400">Rev C</td>
                        <td className="px-3 py-2 text-gray-700">Rev D</td>
                      </tr>
                      <tr className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">15/06/2023 10:30</td>
                        <td className="px-3 py-2 text-gray-700">Admin</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            Created
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">-</td>
                        <td className="px-3 py-2 text-gray-400">-</td>
                        <td className="px-3 py-2 text-gray-700">Initial creation</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
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













