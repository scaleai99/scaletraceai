import { BrowserRouter, Routes, Route, Navigate , useParams } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthGuard } from './components/layout/AuthGuard'
import { LoginPage } from './pages/LoginPage'
import { StubPage } from './pages/StubPage'
import { ManagementDashboardPage } from './pages/dashboard/ManagementDashboardPage'
import { DomainDashboardPage } from './pages/dashboard/DomainDashboardPage'

// """ Finance " GSTR (Module 24) """"""""""""""""""""""""""""""""""""""""""
import { GSTRExportPage } from './pages/finance/GSTRExportPage'

// """ Quality " Calibration (Module 21) """""""""""""""""""""""""""""""""""
import { CalibrationPage } from './pages/quality/CalibrationPage'

// """ Quality " QMS Dashboard """""""""""""""""""""""""""""""""""""""""""""""
import { QMSDashboardPage } from './pages/quality/QMSDashboardPage'

// """ Inventory " Reports (Module 18) """"""""""""""""""""""""""""""""""""""
import { InventoryReportsPage } from './pages/inventory/InventoryReportsPage'


// """ Sales " RFQ (Module 04) """""""""""""""""""""""""""""""""""""""""""""
import { RFQListPage } from './pages/sales/RFQListPage'
import { RFQFormPage } from './pages/sales/RFQFormPage'
import { RFQDetailPage } from './pages/sales/RFQDetailPage'

// """ Sales " Quotation (Module 10) """""""""""""""""""""""""""""""""""""""
import { QuotationListPage } from './pages/sales/QuotationListPage'
import { QuotationDetailPage } from './pages/sales/QuotationDetailPage'
import { QuotationFormPage } from './pages/sales/QuotationFormPage'

// """ Sales " Customer PO (Module 11) """""""""""""""""""""""""""""""""""""
import { CustomerPOListPage } from './pages/sales/CustomerPOListPage'
import { CustomerPODetailPage } from './pages/sales/CustomerPODetailPage'

// """ Sales " Sales Orders (Module 14) """"""""""""""""""""""""""""""""""""
import { SalesOrderListPage } from './pages/sales/SalesOrderListPage'
import { SalesOrderDetailPage } from './pages/sales/SalesOrderDetailPage'

import { ReviewsPage } from './pages/reviews/ReviewsPage'
import { GeneralLedgerPage } from './pages/finance/GeneralLedgerPage'
import { FixedAssetsPage } from './pages/finance/FixedAssetsPage'
import { BudgetPage } from './pages/finance/BudgetPage'
import { PayrollPage } from './pages/hr/PayrollPage'
import { AppraisalPage } from './pages/hr/AppraisalPage'
import { RecruitmentPage } from './pages/hr/RecruitmentPage'
import { ESSPage } from './pages/hr/ESSPage'
import { ApqpPage } from './pages/quality/ApqpPage'
import { InternalAuditPage } from './pages/quality/InternalAuditPage'
import { ManagementReviewPage } from './pages/quality/ManagementReviewPage'
import { StorageBinsPage } from './pages/inventory/StorageBinsPage'
import { InternalTransfersPage } from './pages/inventory/InternalTransfersPage'
import { CycleCountPage } from './pages/inventory/CycleCountPage'
import { EdiPortalPage } from './pages/integration/EdiPortalPage'
import { PaymentsPage } from './pages/integration/PaymentsPage'
import { ESignaturePage } from './pages/integration/ESignaturePage'

// """ Masters " Customer (Module 02) """"""""""""""""""""""""""""""""""""""
import { CustomerListPage } from './pages/masters/CustomerListPage'
import { CustomerDetailPage } from './pages/masters/CustomerDetailPage'

// """ Masters " Supplier (Module 03) """"""""""""""""""""""""""""""""""""""
import { SupplierListPage } from './pages/masters/SupplierListPage'
import { SupplierDetailPage } from './pages/masters/SupplierDetailPage'

// """ Masters " Company (Module 01) """""""""""""""""""""""""""""""""""""""
import { CompanyMasterPage } from './pages/masters/CompanyMasterPage'

// """ Masters " Part Master (Module 05) """""""""""""""""""""""""""""""""""
import { ItemListPage } from './pages/masters/ItemListPage'
import { ItemDetailPage } from './pages/masters/ItemDetailPage'

// """ Quality (Modules 20, 21, 22, 30) """"""""""""""""""""""""""""""""""""
import { NCRListPage } from './pages/quality/NCRListPage'
import { NCRDetailPage } from './pages/quality/NCRDetailPage'
import { CAPAListPage } from './pages/quality/CAPAListPage'
import { CAPADetailPage } from './pages/quality/CAPADetailPage'
import { FAIRListPage } from './pages/quality/FAIRListPage'
import { FAIRDetailPage } from './pages/quality/FAIRDetailPage'
import { SpecialProcessesPage } from './pages/quality/SpecialProcessesPage'
import { DocumentControlPage } from './pages/quality/DocumentControlPage'

// """ Production " Engineering Release (Module 15) """"""""""""""""""""""""
import { EngineeringPage } from './pages/production/EngineeringPage'

// """ Production " MPS / Planning (Module 16) """""""""""""""""""""""""""""
import { ProductionPlanningPage } from './pages/production/ProductionPlanningPage'

// """ Production " Work Orders / MES (Module 19) """"""""""""""""""""""""""
import { WorkOrderPage } from './pages/production/WorkOrderPage'
import { WorkOrderDetailPage } from './pages/production/WorkOrderDetailPage'

// """ Purchase (Module 17) """"""""""""""""""""""""""""""""""""""""""""""""
import { PurchasePage } from './pages/purchase/PurchasePage'

// """ Inventory / Stores (Module 18) """"""""""""""""""""""""""""""""""""""
import { InventoryPage } from './pages/inventory/InventoryPage'

// """ Dispatch (Module 23) """"""""""""""""""""""""""""""""""""""""""""""""
import { DispatchPage } from './pages/dispatch/DispatchPage'

// """ Finance (Module 24) """""""""""""""""""""""""""""""""""""""""""""""""
import { FinancePage } from './pages/finance/FinancePage'

// """ Maintenance (Module 25) """"""""""""""""""""""""""""""""""""""""""""""
import { MaintenancePage } from './pages/maintenance/MaintenancePage'

// """ HR (Module 26) """""""""""""""""""""""""""""""""""""""""""""""""""""""
import { HRPage } from './pages/hr/HRPage'
import { DesignationMasterPage } from './pages/hr/DesignationMasterPage'
import { DepartmentMasterPage } from './pages/hr/DepartmentMasterPage'
import { EmployeeMasterPage } from './pages/masters/EmployeeMasterPage'

// """ Phase 6 "" Gap-fix feature pages (2026-08-23) """"""""""""""""""""""""
import { NegotiationRoundsPage } from './pages/sales/NegotiationRoundsPage'          // Module 04 gap
import { ExchangeRatePage } from './pages/masters/ExchangeRatePage'                  // Module 34 gap
import { ToolingMasterPage } from './pages/masters/ToolingMasterPage'                // Module 09 gap
import { StepUploadPage } from './pages/masters/StepUploadPage'                      // Module 05 gap
import { Customer360Page } from './pages/masters/Customer360Page'                    // Module 02 gap
import { SupplierQualityClausesPage } from './pages/masters/SupplierQualityClausesPage' // Module 03 gap
import { SCARPage } from './pages/quality/SCARPage'                                  // Module 21 gap
import { SurfaceTreatmentPage } from './pages/quality/SurfaceTreatmentPage'          // Module 06 gap
import { ManpowerPlanningPage } from './pages/production/ManpowerPlanningPage'       // Module 16 gap
import { WhatsAppLogPage } from './pages/finance/WhatsAppLogPage'                    // Module 34 gap


// Wrapper to force remount when customer id changes
function CustomerDetailPageWrapper() {
  const { id } = useParams<{ id: string }>()
  return <CustomerDetailPage key={id} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes "" redirect to /login if not authenticated */}
        <Route element={<AuthGuard />}>
        <Route path="/" element={<AppShell />}>
          {/* Default redirect */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Module 27 - Management Dashboard */}
          <Route path="dashboard" element={<ManagementDashboardPage />} />
          <Route path="dashboards/:domain" element={<DomainDashboardPage />} />

          {/* """ Masters """"""""""""""""""""""""""""""""""""""""""" */}
          {/* Module 01 - Company Master */}
          <Route path="masters/company" element={<CompanyMasterPage />} />
          <Route path="masters/company/:id" element={<CompanyMasterPage />} />
          {/* Module 02 - Customer Master */}
          <Route path="masters/customers" element={<CustomerListPage />} />
          <Route path="masters/customers/:id" element={<CustomerDetailPageWrapper />} />
          {/* Module 02 gap - Customer 360  */}
          <Route path="masters/customers/:id/dashboard-360" element={<Customer360Page />} />
          {/* Module 03 - Supplier Master */}
          <Route path="masters/suppliers" element={<SupplierListPage />} />
          <Route path="masters/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="masters/employees" element={<EmployeeMasterPage />} />
          {/* Module 03 gap - Supplier Quality Clause Library */}
          <Route path="masters/suppliers/:id/quality-clauses" element={<SupplierQualityClausesPage />} />
          {/* Module 05 - Item Master */}
          <Route path="masters/items" element={<ItemListPage />} />
          <Route path="masters/items/:id" element={<ItemDetailPage />} />
          {/* Module 05 gap - STEP / 3D ingestion */}
          <Route path="masters/step" element={<StepUploadPage />} />
          {/* Module 09 gap - Tooling Master */}
          <Route path="masters/tooling" element={<ToolingMasterPage />} />
          {/* Module 34 gap - Exchange Rates */}
          <Route path="masters/exchange-rates" element={<ExchangeRatePage />} />
          <Route path="masters/departments" element={<DepartmentMasterPage />} />
          <Route path="masters/designations" element={<DesignationMasterPage />} />

          {/* """ Sales """"""""""""""""""""""""""""""""""""""""""""" */}
          {/* Module 04 - RFQ */}
          <Route path="sales/rfqs" element={<RFQListPage />} />
          <Route path="sales/rfqs/new" element={<RFQFormPage />} />
          <Route path="sales/rfqs/:id" element={<RFQDetailPage />} />
          {/* Module 04 gap - RFQ Negotiation */}
          <Route path="sales/rfqs/:id/negotiation" element={<NegotiationRoundsPage />} />
          {/* Module 10 - Quotations */}
          <Route path="sales/quotations" element={<QuotationListPage />} />
          <Route path="sales/quotations/new" element={<QuotationFormPage />} />
          <Route path="sales/quotations/:id" element={<QuotationDetailPage />} />
          {/* Module 11 - Customer PO */}
          <Route path="sales/customer-pos" element={<CustomerPOListPage />} />
          <Route path="sales/customer-pos/:id" element={<CustomerPODetailPage />} />
          {/* Module 14 - Sales Orders */}
          <Route path="sales/sales-orders" element={<SalesOrderListPage />} />
          <Route path="sales/sales-orders/:id" element={<SalesOrderDetailPage />} />

          {/* """ Reviews (config / contract gates) """"""""""""""""" */}
          <Route path="reviews" element={<ReviewsPage />} />

          {/* """ Phase 2 "" Finance + HR gap modules """"""""""""""" */}
          <Route path="finance/general-ledger" element={<GeneralLedgerPage />} />
          <Route path="finance/fixed-assets" element={<FixedAssetsPage />} />
          <Route path="finance/budget" element={<BudgetPage />} />
          <Route path="hr/payroll" element={<PayrollPage />} />
          <Route path="hr/appraisals" element={<AppraisalPage />} />
          <Route path="hr/recruitment" element={<RecruitmentPage />} />
          <Route path="hr/ess" element={<ESSPage />} />

          {/* """ Phase 3 "" QMS + Inventory gap modules """""""""""""" */}
          <Route path="quality/apqp" element={<ApqpPage />} />
          <Route path="quality/internal-audits" element={<InternalAuditPage />} />
          <Route path="quality/management-review" element={<ManagementReviewPage />} />
          <Route path="inventory/bins" element={<StorageBinsPage />} />
          <Route path="inventory/transfers" element={<InternalTransfersPage />} />
          <Route path="inventory/cycle-count" element={<CycleCountPage />} />

          {/* """ Phase 4 "" Integration gap modules """""""""""""""" */}
          <Route path="integration/edi" element={<EdiPortalPage />} />
          <Route path="integration/payments" element={<PaymentsPage />} />
          <Route path="integration/e-signature" element={<ESignaturePage />} />

          {/* """ Purchase """""""""""""""""""""""""""""""""""""""""" */}
          {/* Module 17 - Purchase (tabbed: PRs, POs, GRNs) */}
          <Route path="purchase/*" element={<PurchasePage />} />

          {/* """ Inventory """"""""""""""""""""""""""""""""""""""""" */}
          {/* Module 18 - Inventory / Stock */}
          <Route path="inventory/stock" element={<InventoryPage />} />
          <Route path="inventory/grns" element={<PurchasePage />} />
          <Route path="inventory/reports" element={<InventoryReportsPage />} />

          {/* """ Production """""""""""""""""""""""""""""""""""""""" */}
          {/* Module 15 - Engineering Release */}
          <Route path="production/engineering" element={<EngineeringPage />} />
          {/* Module 16 - Production Planning / MPS */}
          <Route path="production/planning" element={<ProductionPlanningPage />} />
          {/* Module 16 gap - Manpower Planning */}
          <Route path="production/manpower" element={<ManpowerPlanningPage />} />
          {/* Module 19 - Work Orders / MES */}
          <Route path="production/work-orders" element={<WorkOrderPage />} />
          <Route path="production/work-orders/:id" element={<WorkOrderDetailPage />} />

          {/* """ Quality """"""""""""""""""""""""""""""""""""""""""" */}
          {/* QMS Dashboard */}
          <Route path="quality/dashboard" element={<QMSDashboardPage />} />
          {/* Module 20 - Special Processes */}
          <Route path="quality/special-processes" element={<SpecialProcessesPage />} />
          {/* Module 06 gap - AI Surface Treatment Analysis */}
          <Route path="quality/surface-treatment" element={<SurfaceTreatmentPage />} />
          {/* Module 21 - QMS: NCR */}
          <Route path="quality/ncrs" element={<NCRListPage />} />
          <Route path="quality/ncrs/:id" element={<NCRDetailPage />} />
          {/* Module 21 gap - SCAR */}
          <Route path="quality/scars" element={<SCARPage />} />
          {/* Module 30 - CAPA */}
          <Route path="quality/capas" element={<CAPAListPage />} />
          <Route path="quality/capas/:id" element={<CAPADetailPage />} />
          {/* Module 22 - FAI / AS9102B */}
          <Route path="quality/fairs" element={<FAIRListPage />} />
          <Route path="quality/fairs/:id" element={<FAIRDetailPage />} />
          {/* Module 21 - Calibration */}
          <Route path="quality/calibration" element={<CalibrationPage />} />
          {/* Module 21 - Document Control */}
          <Route path="quality/documents" element={<DocumentControlPage />} />

          {/* """ Dispatch """""""""""""""""""""""""""""""""""""""""" */}
          {/* Module 23 - Delivery Challans */}
          <Route path="dispatch/challans" element={<DispatchPage />} />
          <Route path="dispatch/challans/:id" element={<DispatchPage />} />

          {/* """ Finance """"""""""""""""""""""""""""""""""""""""""" */}
          {/* Module 24 - Invoices */}
          <Route path="finance/invoices" element={<FinancePage defaultTab="invoices" />} />
          <Route path="finance/invoices/:id" element={<FinancePage defaultTab="invoices" />} />
          <Route path="finance/ar" element={<FinancePage defaultTab="ar" />} />
          <Route path="finance/ap" element={<FinancePage defaultTab="ap" />} />
          <Route path="finance/gstr" element={<GSTRExportPage />} />
          {/* Module 34 gap - WhatsApp delivery log */}
          <Route path="finance/whatsapp-log" element={<WhatsAppLogPage />} />

          {/* """ Operations """""""""""""""""""""""""""""""""""""""" */}
          {/* Module 26 - HR */}
          <Route path="hr" element={<HRPage />} />
          {/* Module 25 - Maintenance */}
          <Route path="maintenance" element={<MaintenancePage />} />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <StubPage
                title="Page Not Found"
                description="The route you requested does not exist."
              />
            }
          />
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}





