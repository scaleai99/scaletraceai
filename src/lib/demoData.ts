/**
 * demoData.ts - Fallback demo data for all ERP modules.
 *
 * Used when the API returns an empty array (fresh install / demo mode).
 * Automatically replaced by real data once the database has records.
 *
 * Rule: if API returns [] → return DEMO_* constant.
 *       if API returns [item1, item2...] → return real data.
 *
 * The DEMO_ constants use the same TypeScript types as the API responses
 * so no casting is needed in components.
 */

import type { RFQ } from '../api/rfqApi'
import type { NCR, CAPA, CalibrationRecord } from '../api/qualityApi'
import type { Customer } from '../api/customerApi'
import type { Supplier } from '../api/supplierApi'
import type { Quotation } from '../api/quotationApi'
import type { CustomerPO, SalesOrder } from '../api/salesApi'
import type { PurchaseRequisition, PurchaseOrder, InventoryItem } from '../api/purchaseApi'
import type { EngineeringRelease, ProductionOrder, WorkOrder } from '../api/productionApi'
import type { MaintenanceRecord } from '../api/maintenanceApi'
import type { Employee } from '../api/hrApi'
import type { DeliveryChallan } from '../api/dispatchApi'
import type { Invoice } from '../api/financeApi'
import type { DocumentControlRecord } from '../api/documentControlApi'
import type { KPIData } from '../api/dashboardApi'

// ---------------------------------------------------------------------------
// Demo flag - injected into every demo item so components can detect it
// ---------------------------------------------------------------------------
export const DEMO_FLAG = '__isDemo' as const

// ---------------------------------------------------------------------------
// RFQs
// ---------------------------------------------------------------------------
export const DEMO_RFQS: RFQ[] = [
  {
    id: 'demo-rfq-001',
    rfq_number: 'RFQ-2025-0001',
    customer_id: 'demo-cust-001',
    customer_site_id: null,
    contact_name: 'Rajesh Kumar',
    received_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    quotation_due_date: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    priority: 'High',
    owner_id: null,
    status: 'Received',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: null,
    line_items: [],
  },
  {
    id: 'demo-rfq-002',
    rfq_number: 'RFQ-2025-0002',
    customer_id: 'demo-cust-002',
    customer_site_id: null,
    contact_name: 'Anita Sharma',
    received_date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
    quotation_due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    priority: 'Medium',
    owner_id: null,
    status: 'AI Costing',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: null,
    line_items: [],
  },
  {
    id: 'demo-rfq-003',
    rfq_number: 'RFQ-2025-0003',
    customer_id: 'demo-cust-001',
    customer_site_id: null,
    contact_name: 'Vikram Nair',
    received_date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
    quotation_due_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    priority: 'High',
    owner_id: null,
    status: 'Won',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: null,
    line_items: [],
  },
]

// ---------------------------------------------------------------------------
// NCRs
// ---------------------------------------------------------------------------
export const DEMO_NCRS: NCR[] = [
  {
    id: 'demo-ncr-001',
    ncr_number: 'NCR-2025-0001',
    part_number: 'HA-2024-PP-01',
    drawing_number: '23-70-00006-00',
    detection_stage: 'Incoming',
    description: 'Dimensional non-conformance - OD exceeds tolerance by 0.02mm',
    disposition: 'Rework',
    concession_ref: null,
    assigned_to_id: null,
    status: 'Open',
    closed_at: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo-ncr-002',
    ncr_number: 'NCR-2025-0002',
    part_number: 'KA-2025-001',
    drawing_number: 'DWG-2025-042',
    detection_stage: 'In-Process',
    description: 'Surface finish below Ra 0.8 requirement - measured Ra 1.2',
    disposition: 'Scrap',
    concession_ref: null,
    assigned_to_id: null,
    status: 'Awaiting Approval',
    closed_at: null,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'demo-ncr-003',
    ncr_number: 'NCR-2025-0003',
    part_number: 'NAS1351-3-18P',
    drawing_number: '23-70-00006-01',
    detection_stage: 'Final',
    description: 'Hardness out of tolerance - 35 HRC vs requirement 38-42 HRC',
    disposition: 'Return-to-Supplier',
    concession_ref: null,
    assigned_to_id: null,
    status: 'Closed',
    closed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
]

// ---------------------------------------------------------------------------
// CAPAs
// ---------------------------------------------------------------------------
export const DEMO_CAPAS: CAPA[] = [
  {
    id: 'demo-capa-001',
    capa_number: 'CAPA-2025-0001',
    ncr_id: 'demo-ncr-001',
    title: 'Update incoming inspection procedure for dimensional checks',
    root_cause_method: '5-Why',
    root_cause_data: null,
    actions: null,
    effectiveness_evidence: null,
    target_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: 'Open',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-capa-002',
    capa_number: 'CAPA-2025-0002',
    ncr_id: 'demo-ncr-002',
    title: 'Surface treatment process parameter review and update',
    root_cause_method: 'Ishikawa',
    root_cause_data: null,
    actions: null,
    effectiveness_evidence: null,
    target_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    status: 'Action In Progress',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
]

// ---------------------------------------------------------------------------
// Calibration
// ---------------------------------------------------------------------------
export const DEMO_CALIBRATION: CalibrationRecord[] = [
  {
    id: 'demo-cal-001',
    instrument_code: 'CAL-2025-0001',
    instrument_name: 'Vernier Caliper 150mm',
    instrument_type: 'Caliper',
    serial_number: 'MC-12345',
    make_model: 'Mitutoyo 530-312',
    location: 'QC Lab',
    range_spec: '0-150mm ±0.02mm',
    calibration_interval_days: 365,
    last_calibrated_date: new Date(Date.now() - 300 * 86400000).toISOString().slice(0, 10),
    next_due_date: new Date(Date.now() + 65 * 86400000).toISOString().slice(0, 10),
    calibration_cert_number: 'NABL-2024-0123',
    calibrated_by: 'NABL Accredited Lab',
    status: 'Active',
    is_overdue: false,
    notes: null,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
    updated_at: null,
  },
  {
    id: 'demo-cal-002',
    instrument_code: 'CAL-2025-0002',
    instrument_name: 'Hardness Tester Rockwell',
    instrument_type: 'Hardness Tester',
    serial_number: 'HT-98765',
    make_model: 'Wilson Instruments B2000',
    location: 'Shop Floor',
    range_spec: '20-70 HRC',
    calibration_interval_days: 365,
    last_calibrated_date: new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10),
    next_due_date: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10),
    calibration_cert_number: null,
    calibrated_by: null,
    status: 'Overdue',
    is_overdue: true,
    notes: 'Overdue - schedule calibration immediately',
    created_at: new Date(Date.now() - 400 * 86400000).toISOString(),
    updated_at: null,
  },
]

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
// Default null values for new Customer fields (all nullable)
const CUSTOMER_NULL_DEFAULTS: Omit<Customer,
  'id' | 'customer_code' | 'customer_name' | 'gstin' | 'registered_address' | 'state_code' |
  'contact_name' | 'contact_email' | 'contact_mobile' | 'customer_tier' | 'industry' |
  'payment_terms' | 'delivery_terms' | 'credit_limit' | 'currency' | 'status' |
  'approved_by' | 'approved_at' | 'created_at'
> = {
  short_name: null,
  customer_type: null,
  pan: null,
  tan: null,
  cin: null,
  iec_code: null,
  duns_number: null,
  customer_since: null,
  parent_customer_id: null,
  website: null,
  business_nature: null,
  supply_type: null,
  payment_terms_text: null,
  incoterms: null,
  min_order_value: null,
  annual_turnover: null,
  preferred_currency: null,
  billing_address_line1: null,
  billing_address_line2: null,
  billing_city: null,
  billing_state: null,
  billing_country: null,
  billing_pin: null,
  shipping_same_as_billing: false,
  shipping_address_line1: null,
  shipping_address_line2: null,
  shipping_city: null,
  shipping_state: null,
  shipping_country: null,
  shipping_pin: null,
  bank_name: null,
  bank_branch: null,
  bank_account_number: null,
  bank_account_type: null,
  bank_ifsc_code: null,
  bank_micr_code: null,
  bank_upi_id: null,
  qa_approval_status: null,
  as9100_requirement: false,
  nadcap_requirement: false,
  flow_down_required: false,
  customer_approval_number: null,
  approval_date: null,
  approval_valid_upto: null,
  quality_rating: null,
  delivery_rating: null,
  service_rating: null,
  overall_rating: null,
  rating_date: null,
  rating_remarks: null,
  updated_at: null,
}

export const DEMO_CUSTOMERS: Customer[] = [
  {
    ...CUSTOMER_NULL_DEFAULTS,
    id: 'demo-cust-001',
    customer_code: 'KUN001',
    customer_name: 'Kun Aerospace Pvt Ltd',
    gstin: '29AABCK1234A1Z5',
    registered_address: 'Plot 12, Aerospace SEZ, Bangalore 560099',
    state_code: '29',
    contact_name: 'Rajesh Kumar',
    contact_email: 'rajesh@kunaerospace.com',
    contact_mobile: '9876543210',
    customer_tier: 'Tier-1',
    industry: 'Aerospace',
    payment_terms: 45,
    delivery_terms: 'Ex-Works',
    credit_limit: 5000000,
    currency: 'INR',
    status: 'Active',
    approved_by: null,
    approved_at: null,
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
  {
    ...CUSTOMER_NULL_DEFAULTS,
    id: 'demo-cust-002',
    customer_code: 'COL001',
    customer_name: 'Collins Aerospace India',
    gstin: '27AABCC5678B1Z3',
    registered_address: 'Collins House, Pune 411014',
    state_code: '27',
    contact_name: 'Anita Sharma',
    contact_email: 'anita.sharma@collins.com',
    contact_mobile: '9123456780',
    customer_tier: 'Tier-1',
    industry: 'Aerospace',
    payment_terms: 30,
    delivery_terms: 'CIF',
    credit_limit: 10000000,
    currency: 'INR',
    status: 'Active',
    approved_by: null,
    approved_at: null,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    ...CUSTOMER_NULL_DEFAULTS,
    id: 'demo-cust-003',
    customer_code: 'HON001',
    customer_name: 'Honeywell Technology Solutions',
    gstin: null,
    registered_address: 'Honeywell Campus, Gurgaon 122002',
    state_code: '06',
    contact_name: 'Vikram Nair',
    contact_email: 'vikram.nair@honeywell.com',
    contact_mobile: '9988776655',
    customer_tier: 'Tier-2',
    industry: 'Aerospace',
    payment_terms: 60,
    delivery_terms: 'FOB',
    credit_limit: 7500000,
    currency: 'INR',
    status: 'Active',
    approved_by: null,
    approved_at: null,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    ...CUSTOMER_NULL_DEFAULTS,
    id: 'demo-cust-004',
    customer_code: 'MOO001',
    customer_name: 'Moog Controls India Pvt Ltd',
    gstin: '33AABCM9012C1Z1',
    registered_address: 'Moog Park, Chennai 600032',
    state_code: '33',
    contact_name: 'Priya Menon',
    contact_email: 'priya.menon@moog.com',
    contact_mobile: '9445566778',
    customer_tier: 'Tier-1',
    industry: 'Aerospace',
    payment_terms: 45,
    delivery_terms: 'Ex-Works',
    credit_limit: 8000000,
    currency: 'INR',
    status: 'Active',
    approved_by: null,
    approved_at: null,
    created_at: new Date(Date.now() - 270 * 86400000).toISOString(),
  },
]

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------
// Null-placeholder for all new optional supplier fields (added in rewrite)
const _supplierNullFields = {
  short_name: null, supplier_type: null, category: null, sub_category: null, website: null,
  pan: null, tan: null, cin: null, iec_code: null, msme_no: null, date_of_incorporation: null,
  business_nature: null, supply_type: null, main_products: null, payment_terms_text: null,
  incoterms: null, min_order_value: null, annual_turnover: null, preferred_currency: null,
  manufacturing_location: null, plant_size: null, num_employees: null,
  equipment_facility: null, core_competencies: null, capacity_per_month: null,
  bank_name: null, bank_branch: null, bank_account_number: null,
  bank_account_type: null, bank_ifsc_code: null, bank_micr_code: null, bank_upi_id: null,
  as9100_status: null, nadcap_status: null, iso9001_status: null,
  iso14001_status: null, iso45001_status: null, other_certifications: null,
  qa_system: null, fai_ppap_support: null,
  approved_for_raw_material: false, approved_for_sub_contract: false,
  approved_for_heat_treatment: false, approved_for_surface: false,
  approved_for_ndt: false, approved_for_others: false, approved_for_others_text: null,
  dgca_approval_number: null, dgca_approval_expiry: null,
  hal_vendor_code: null, isro_vendor_code: null,
}

export const DEMO_SUPPLIERS: Supplier[] = [
  {
    ..._supplierNullFields,
    id: 'demo-sup-001',
    supplier_code: 'SUP001',
    supplier_name: 'Bharat Aluminium Works',
    gstin: '29AABCB1234A1Z5',
    registered_address: 'Plot 5, KIADB Industrial Area, Belgaum 590010',
    state_code: '29',
    contact_name: 'Suresh Patil',
    contact_email: 'suresh@bharatal.com',
    contact_mobile: '9876512345',
    supply_category: 'Raw Material',
    msme_category: 'Small',
    payment_terms: 30,
    currency: 'INR',
    asl_status: 'Active',
    approved_by: null,
    approved_at: null,
    delisted_reason: null,
    delisted_at: null,
    audit_overdue: false,
    dgca_reference: null,
    hal_supplier_code: 'HAL-SUP-0145',
    isro_registration_number: null,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
    updated_at: null,
    last_audit_score: 87,
    last_audit_date: new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10),
  },
  {
    ..._supplierNullFields,
    id: 'demo-sup-002',
    supplier_code: 'SUP002',
    supplier_name: 'Precision Coatings India',
    gstin: '27AABCP5678B1Z3',
    registered_address: 'MIDC, Pune 411018',
    state_code: '27',
    contact_name: 'Abhay Kulkarni',
    contact_email: 'abhay@precisioncoatings.in',
    contact_mobile: '9765432109',
    supply_category: 'Special Process',
    msme_category: 'Micro',
    payment_terms: 45,
    currency: 'INR',
    asl_status: 'Active',
    approved_by: null,
    approved_at: null,
    delisted_reason: null,
    delisted_at: null,
    audit_overdue: false,
    dgca_reference: 'DGCA-2024-0012',
    hal_supplier_code: null,
    isro_registration_number: null,
    created_at: new Date(Date.now() - 500 * 86400000).toISOString(),
    updated_at: null,
    last_audit_score: 92,
    last_audit_date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
  },
  {
    ..._supplierNullFields,
    id: 'demo-sup-003',
    supplier_code: 'SUP003',
    supplier_name: 'TechnoForge Components',
    gstin: '29AABCT9012C1Z1',
    registered_address: 'Plot 88, Peenya Industrial Area, Bangalore 560058',
    state_code: '29',
    contact_name: 'Ganesh Rao',
    contact_email: 'ganesh@technoforge.com',
    contact_mobile: '9654321098',
    supply_category: 'Sub-contract Machining',
    msme_category: 'Small',
    payment_terms: 30,
    currency: 'INR',
    asl_status: 'Active',
    approved_by: null,
    approved_at: null,
    delisted_reason: null,
    delisted_at: null,
    audit_overdue: true,
    dgca_reference: null,
    hal_supplier_code: null,
    isro_registration_number: null,
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: null,
    last_audit_score: 74,
    last_audit_date: new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10),
  },
]

// ---------------------------------------------------------------------------
// Quotations
// ---------------------------------------------------------------------------
export const DEMO_QUOTATIONS: Quotation[] = [
  {
    id: 'demo-qtn-001',
    quotation_number: 'QTN-2025-0001',
    rfq_id: 'demo-rfq-001',
    customer_id: 'demo-cust-001',
    revision: 1,
    parent_id: null,
    validity_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    delivery_lead_days: 45,
    payment_terms: 45,
    total_value: 385000,
    status: 'Approved',
    approved_by: null,
    approved_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: null,
    line_items: [
      { id: 'demo-qli-001', quotation_id: 'demo-qtn-001', line_number: 1, part_number: 'HA-2024-PP-01', drawing_number: '23-70-00006-00', drawing_revision: 'B', quantity: 500, unit_price: 770, total_price: 385000, costing_sheet_id: null, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
    ],
  },
  {
    id: 'demo-qtn-002',
    quotation_number: 'QTN-2025-0002',
    rfq_id: 'demo-rfq-002',
    customer_id: 'demo-cust-002',
    revision: 1,
    parent_id: null,
    validity_date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    delivery_lead_days: 60,
    payment_terms: 30,
    total_value: 620000,
    status: 'Draft',
    approved_by: null,
    approved_at: null,
    sent_at: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: null,
    line_items: [],
  },
  {
    id: 'demo-qtn-003',
    quotation_number: 'QTN-2025-0003',
    rfq_id: null,
    customer_id: 'demo-cust-003',
    revision: 2,
    parent_id: null,
    validity_date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
    delivery_lead_days: 30,
    payment_terms: 45,
    total_value: 198000,
    status: 'Sent',
    approved_by: null,
    approved_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    sent_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: null,
    line_items: [],
  },
]

// ---------------------------------------------------------------------------
// Customer POs
// ---------------------------------------------------------------------------
export const DEMO_CUSTOMER_POS: CustomerPO[] = [
  {
    id: 'demo-cpo-001',
    internal_ref: 'CPO-2025-0001',
    po_number: 'KUN-PO-2025-1042',
    po_date: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10),
    customer_id: 'demo-cust-001',
    customer_site_id: null,
    quotation_id: 'demo-qtn-001',
    po_pdf_path: null,
    payment_terms: 45,
    delivery_terms: 'Ex-Works',
    difference_report: null,
    status: 'Accepted',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: null,
    line_items: [
      { id: 'demo-cpoli-001', customer_po_id: 'demo-cpo-001', line_number: 1, part_number: 'HA-2024-PP-01', drawing_number: '23-70-00006-00', drawing_revision: 'B', quantity: 500, agreed_unit_price: 770, delivery_date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10), created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
    ],
  },
  {
    id: 'demo-cpo-002',
    internal_ref: 'CPO-2025-0002',
    po_number: 'COL-PO-2025-0387',
    po_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    customer_id: 'demo-cust-002',
    customer_site_id: null,
    quotation_id: null,
    po_pdf_path: null,
    payment_terms: 30,
    delivery_terms: 'CIF',
    difference_report: null,
    status: 'Under Review',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: null,
    line_items: [],
  },
]

// ---------------------------------------------------------------------------
// Sales Orders
// ---------------------------------------------------------------------------
export const DEMO_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'demo-so-001',
    so_number: 'SO-2025-0001',
    customer_po_id: 'demo-cpo-001',
    quotation_id: 'demo-qtn-001',
    customer_id: 'demo-cust-001',
    config_baseline_id: null,
    status: 'In Production',
    cancellation_reason: null,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: null,
    line_items: [
      { id: 'demo-soli-001', so_id: 'demo-so-001', line_number: 1, part_number: 'HA-2024-PP-01', drawing_number: '23-70-00006-00', drawing_revision: 'B', quantity: 500, agreed_unit_price: 770, delivery_date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10), dispatched_qty: 0, status: 'Open', created_at: new Date(Date.now() - 18 * 86400000).toISOString() },
    ],
  },
  {
    id: 'demo-so-002',
    so_number: 'SO-2025-0002',
    customer_po_id: 'demo-cpo-002',
    quotation_id: null,
    customer_id: 'demo-cust-002',
    config_baseline_id: null,
    status: 'Open',
    cancellation_reason: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: null,
    line_items: [],
  },
]

// ---------------------------------------------------------------------------
// Purchase Requisitions
// ---------------------------------------------------------------------------
export const DEMO_PRS: PurchaseRequisition[] = [
  { id: 'demo-pr-001', pr_number: 'PR-2025-0001', pr_date: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10), item_code: 'AL6061-T6', description: 'Aluminium 6061-T6 billet 50x50x300mm', quantity: 100, uom: 'PCS', required_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), priority: 'High', status: 'Approved', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'demo-pr-002', pr_number: 'PR-2025-0002', pr_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), item_code: 'TI-6AL4V', description: 'Titanium Ti-6Al-4V round bar dia 25mm', quantity: 20, uom: 'KG', required_date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10), priority: 'Medium', status: 'Pending', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'demo-pr-003', pr_number: 'PR-2025-0003', pr_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), item_code: 'SS316L-SHT', description: 'Stainless Steel 316L sheet 2mm x 1000x2000mm', quantity: 5, uom: 'SHEET', required_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), priority: 'High', status: 'Draft', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------------
export const DEMO_POS: PurchaseOrder[] = [
  { id: 'demo-po-001', po_number: 'PO-2025-0001', po_date: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10), supplier_id: 'demo-sup-001', total_value: 75000, cgst_amount: 6750, sgst_amount: 6750, igst_amount: 0, status: 'Open', line_items: [], created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'demo-po-002', po_number: 'PO-2025-0002', po_date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10), supplier_id: 'demo-sup-002', total_value: 42000, cgst_amount: 0, sgst_amount: 0, igst_amount: 7560, status: 'Partially Received', line_items: [], created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// Inventory Items
// ---------------------------------------------------------------------------
export const DEMO_INVENTORY: InventoryItem[] = [
  { id: 'demo-inv-001', item_code: 'AL6061-T6', description: 'Aluminium 6061-T6 Billet', category: 'Raw Material', qty_on_hand: 87, reorder_level: 50, bin_location: 'RMW-A1-01', valuation_method: 'FIFO' },
  { id: 'demo-inv-002', item_code: 'TI-6AL4V', description: 'Titanium Ti-6Al-4V Round Bar', category: 'Raw Material', qty_on_hand: 12, reorder_level: 20, bin_location: 'RMW-B2-03', valuation_method: 'FIFO' },
  { id: 'demo-inv-003', item_code: 'SS316L-SHT', description: 'SS 316L Sheet 2mm', category: 'Raw Material', qty_on_hand: 3, reorder_level: 10, bin_location: 'RMW-C1-05', valuation_method: 'FIFO' },
  { id: 'demo-inv-004', item_code: 'CAPTIVE-SCREW-M3', description: 'Captive Screw M3x8mm NAS', category: 'Fasteners', qty_on_hand: 1250, reorder_level: 500, bin_location: 'FAS-D3-02', valuation_method: 'Weighted Avg' },
  { id: 'demo-inv-005', item_code: 'CUTTING-OIL-5L', description: 'CNC Cutting Oil 5L Drum', category: 'Consumable', qty_on_hand: 8, reorder_level: 5, bin_location: 'CON-E1-01', valuation_method: 'Weighted Avg' },
]

// ---------------------------------------------------------------------------
// Engineering Releases
// ---------------------------------------------------------------------------
export const DEMO_ENGINEERING: EngineeringRelease[] = [
  { id: 'demo-er-001', er_number: 'ER-2025-0001', so_id: 'demo-so-001', part_number: 'HA-2024-PP-01', drawing_number: '23-70-00006-00', drawing_revision: 'B', bom: [], process_route: [], status: 'Approved', approved_by: null, approved_at: new Date(Date.now() - 15 * 86400000).toISOString(), created_at: new Date(Date.now() - 17 * 86400000).toISOString() },
  { id: 'demo-er-002', er_number: 'ER-2025-0002', so_id: null, part_number: 'KA-2025-001', drawing_number: 'DWG-2025-042', drawing_revision: 'A', bom: [], process_route: [], status: 'Draft', approved_by: null, approved_at: null, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// Production Orders
// ---------------------------------------------------------------------------
export const DEMO_PRODUCTION: ProductionOrder[] = [
  { id: 'demo-prod-001', so_id: 'demo-so-001', er_id: 'demo-er-001', part_number: 'HA-2024-PP-01', planned_qty: 500, planned_start: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), planned_end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), status: 'In Progress', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'demo-prod-002', so_id: 'demo-so-002', er_id: null, part_number: 'KA-2025-001', planned_qty: 200, planned_start: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), planned_end: new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10), status: 'Planned', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// Work Orders
// ---------------------------------------------------------------------------
export const DEMO_WORK_ORDERS: WorkOrder[] = [
  { id: 'demo-wo-001', jc_number: 'WO-2025-0001', so_id: 'demo-so-001', er_id: 'demo-er-001', part_number: 'HA-2024-PP-01', drawing_number: '23-70-00006-00', drawing_revision: 'B', batch_quantity: 50, status: 'In Progress', total_actual_cost: 28500, operations: [], created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'demo-wo-002', jc_number: 'WO-2025-0002', so_id: 'demo-so-001', er_id: 'demo-er-001', part_number: 'HA-2024-PP-01', drawing_number: '23-70-00006-00', drawing_revision: 'B', batch_quantity: 50, status: 'Released', total_actual_cost: 0, operations: [], created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'demo-wo-003', jc_number: 'WO-2025-0003', so_id: 'demo-so-002', er_id: null, part_number: 'KA-2025-001', drawing_number: 'DWG-2025-042', drawing_revision: 'A', batch_quantity: 25, status: 'Planned', total_actual_cost: 0, operations: [], created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// Document Control
// ---------------------------------------------------------------------------
export const DEMO_DOCUMENTS: DocumentControlRecord[] = [
  { id: 'demo-doc-001', doc_number: 'DOC-2025-0001', doc_type: 'Quality Manual', title: 'Scale Aerospace Quality Manual AS9100D', revision: 'C', status: 'Approved', effective_date: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), expiry_date: new Date(Date.now() + 275 * 86400000).toISOString().slice(0, 10), content_path: null, description: 'Top-level quality management system manual per AS9100D:2016', distribution_list: [{department: 'Quality', role: 'QM'}, {department: 'Production', role: 'Manager'}], as9100d_clause: '4.0', approved_by: null, approved_at: new Date(Date.now() - 90 * 86400000).toISOString(), obsoleted_at: null, created_at: new Date(Date.now() - 120 * 86400000).toISOString(), updated_at: null },
  { id: 'demo-doc-002', doc_number: 'DOC-2025-0002', doc_type: 'Work Instruction', title: 'CNC Turning Setup and Operation WI', revision: 'B', status: 'Approved', effective_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), expiry_date: null, content_path: null, description: 'Work instruction for CNC turning operations on aluminium components', distribution_list: [{department: 'Production', role: 'Operator'}], as9100d_clause: '8.5.1', approved_by: null, approved_at: new Date(Date.now() - 30 * 86400000).toISOString(), obsoleted_at: null, created_at: new Date(Date.now() - 45 * 86400000).toISOString(), updated_at: null },
  { id: 'demo-doc-003', doc_number: 'DOC-2025-0003', doc_type: 'Procedure', title: 'Incoming Inspection Procedure', revision: 'A', status: 'Under Review', effective_date: null, expiry_date: null, content_path: null, description: 'Incoming material inspection procedure and acceptance criteria', distribution_list: null, as9100d_clause: '8.4.3', approved_by: null, approved_at: null, obsoleted_at: null, created_at: new Date(Date.now() - 5 * 86400000).toISOString(), updated_at: null },
]

// ---------------------------------------------------------------------------
// Dispatch / Delivery Challans
// ---------------------------------------------------------------------------
export const DEMO_CHALLANS: DeliveryChallan[] = [
  { id: 'demo-dc-001', dc_number: 'DC-2025-0001', so_id: 'demo-so-001', customer_id: 'demo-cust-001', dispatch_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), transporter: 'DTDC Logistics', lr_number: 'DTDC-LR-240001', taxable_value: 115500, cgst_amount: 10395, sgst_amount: 10395, igst_amount: 0, total_value: 136290, state_from: '29', state_to: '29', status: 'Dispatched', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), line_items: [] },
  { id: 'demo-dc-002', dc_number: 'DC-2025-0002', so_id: 'demo-so-001', customer_id: 'demo-cust-001', dispatch_date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), transporter: 'BlueDart Express', lr_number: 'BD-LR-250012', taxable_value: 92400, cgst_amount: 8316, sgst_amount: 8316, igst_amount: 0, total_value: 109032, state_from: '29', state_to: '29', status: 'Draft', created_at: new Date(Date.now() - 1 * 86400000).toISOString(), line_items: [] },
]

// ---------------------------------------------------------------------------
// Finance / Invoices
// ---------------------------------------------------------------------------
export const DEMO_INVOICES: Invoice[] = [
  { id: 'demo-inv-f-001', inv_number: 'INV-2025-0001', dc_id: 'demo-dc-001', customer_id: 'demo-cust-001', invoice_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), due_date: new Date(Date.now() + 42 * 86400000).toISOString().slice(0, 10), taxable_value: 115500, cgst_amount: 10395, sgst_amount: 10395, igst_amount: 0, total_amount: 136290, paid_amount: 0, outstanding_amount: 136290, status: 'Sent', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'demo-inv-f-002', inv_number: 'INV-2025-0002', dc_id: null, customer_id: 'demo-cust-002', invoice_date: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10), due_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), taxable_value: 198000, cgst_amount: 0, sgst_amount: 0, igst_amount: 35640, total_amount: 233640, paid_amount: 233640, outstanding_amount: 0, status: 'Paid', created_at: new Date(Date.now() - 35 * 86400000).toISOString() },
  { id: 'demo-inv-f-003', inv_number: 'INV-2025-0003', dc_id: null, customer_id: 'demo-cust-003', invoice_date: new Date(Date.now() - 65 * 86400000).toISOString().slice(0, 10), due_date: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10), taxable_value: 85000, cgst_amount: 7650, sgst_amount: 7650, igst_amount: 0, total_amount: 100300, paid_amount: 0, outstanding_amount: 100300, status: 'Overdue', created_at: new Date(Date.now() - 65 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// HR / Employees
// ---------------------------------------------------------------------------
export const DEMO_EMPLOYEES: Employee[] = [
  { id: 'demo-emp-001', employee_code: 'EMP-001', full_name: 'Arjun Krishnaswamy', email: 'arjun.k@scaleaerospace.com', mobile: '9876543200', department: 'Production', designation: 'CNC Operator', date_of_joining: '2021-06-01', aadhaar_last4: '4821', pan_masked: 'AXXXK1234P', user_id: null, is_active: true, created_at: new Date(Date.now() - 1095 * 86400000).toISOString() },
  { id: 'demo-emp-002', employee_code: 'EMP-002', full_name: 'Meera Subramaniam', email: 'meera.s@scaleaerospace.com', mobile: '9765432100', department: 'Quality', designation: 'Quality Engineer', date_of_joining: '2020-09-15', aadhaar_last4: '3765', pan_masked: 'BXXXS5678M', user_id: null, is_active: true, created_at: new Date(Date.now() - 1460 * 86400000).toISOString() },
  { id: 'demo-emp-003', employee_code: 'EMP-003', full_name: 'Ravi Shankar Iyer', email: 'ravi.i@scaleaerospace.com', mobile: '9654321000', department: 'Engineering', designation: 'Design Engineer', date_of_joining: '2022-03-01', aadhaar_last4: '9012', pan_masked: 'CXXXI9012R', user_id: null, is_active: true, created_at: new Date(Date.now() - 730 * 86400000).toISOString() },
  { id: 'demo-emp-004', employee_code: 'EMP-004', full_name: 'Divya Ramachandran', email: 'divya.r@scaleaerospace.com', mobile: '9543210900', department: 'Purchase', designation: 'Purchase Executive', date_of_joining: '2023-01-10', aadhaar_last4: '6543', pan_masked: 'DXXXR6543D', user_id: null, is_active: true, created_at: new Date(Date.now() - 365 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// Maintenance Records
// ---------------------------------------------------------------------------
export const DEMO_MAINTENANCE: MaintenanceRecord[] = [
  { id: 'demo-maint-001', machine_id: 'MCH-001', maintenance_type: 'Planned', description: 'Monthly PM - CNC Turning Centre TC-01', fault_description: null, scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), completed_date: null, next_due_date: new Date(Date.now() + 37 * 86400000).toISOString().slice(0, 10), downtime_hours: null, spare_parts_used: null, root_cause: null, repair_actions: null, status: 'Scheduled', performed_by: null, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'demo-maint-002', machine_id: 'MCH-002', maintenance_type: 'Breakdown', description: 'VMC-02 spindle bearing noise', fault_description: 'Unusual noise from spindle at 6000 RPM', scheduled_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), completed_date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), next_due_date: null, downtime_hours: 8.5, spare_parts_used: [{part: 'Spindle Bearing SKF 6206', qty: 2}], root_cause: 'Lubrication failure', repair_actions: 'Replaced bearings, refilled lubricant', status: 'Completed', performed_by: 'Maintenance Team', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'demo-maint-003', machine_id: 'MCH-001', maintenance_type: 'Planned', description: 'CNC TC-01 quarterly calibration check', fault_description: null, scheduled_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), completed_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), next_due_date: new Date(Date.now() + 85 * 86400000).toISOString().slice(0, 10), downtime_hours: 2, spare_parts_used: null, root_cause: null, repair_actions: 'Calibrated X/Y/Z axes, checked tool changer', status: 'Completed', performed_by: 'Service Engineer', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
]

// ---------------------------------------------------------------------------
// Dashboard KPIs
// ---------------------------------------------------------------------------
export const DEMO_KPI: KPIData = {
  sales_pipeline_inr: 8750000,
  otd_pct: 92.4,
  oee_pct: 78.6,
  copq_inr: 125000,
  ncr_trend_12m: 12,
  supplier_avg_audit_score: 84.5,
  ebitda_estimate_inr: 2150000,
  date_from: new Date(new Date().getFullYear(), 3, 1).toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10),
}

// ---------------------------------------------------------------------------
// Helper: check if a value is demo data
// ---------------------------------------------------------------------------
export function isDemoItem(item: unknown): boolean {
  if (typeof item === 'object' && item !== null) {
    return (item as Record<string, unknown>).id?.toString().startsWith('demo-') ?? false
  }
  return false
}
