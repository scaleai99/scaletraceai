import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  Building2,
  Users,
  Truck,
  FileText,
  Search,
  ClipboardCheck,
  Calculator,
  Receipt,
  ShoppingCart,
  Package,
  Factory,
  Wrench,
  BarChart3,
  Settings,
  Coins,
  Box,
  ShieldAlert,
  Sparkles,
  UsersRound,
  Send,
  BookOpen,
  Boxes,
  PieChart,
  Wallet,
  Star,
  UserPlus,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  Presentation,
  Warehouse,
  ArrowLeftRight,
  ListChecks,
  Network,
  CreditCard,
  PenTool,
  Layers,
  GitBranch,
  ChevronDown,
  FlaskConical,
  Cpu,
  Ruler,
  Percent,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Dashboards',
    items: [
      { to: '/dashboards/sales', label: 'Sales', icon: BarChart3 },
      { to: '/dashboards/production', label: 'Production', icon: Factory },
      { to: '/dashboards/quality', label: 'Quality', icon: ClipboardCheck },
      { to: '/dashboards/purchase', label: 'Purchase', icon: ShoppingCart },
      { to: '/dashboards/inventory', label: 'Inventory', icon: Package },
      { to: '/dashboards/finance', label: 'Finance', icon: Receipt },
      { to: '/dashboards/supplier', label: 'Supplier', icon: Truck },
    ],
  },
  {
    label: 'Masters',
    items: [
      { to: '/masters/company', label: 'Company', icon: Building2 },
      { to: '/masters/customers', label: 'Customers', icon: Users },
      { to: '/masters/suppliers', label: 'Suppliers', icon: Truck },
      { to: '/masters/items', label: 'Items', icon: Package },
      { to: '/masters/specifications', label: 'Specifications', icon: FileText },
      { to: '/masters/machines', label: 'Machine', icon: Cpu },
      { to: '/masters/process-methods', label: 'Process & Methods', icon: Network },
      { to: '/masters/materials', label: 'Material', icon: Boxes },
      { to: '/masters/measurements', label: 'Measurements', icon: Ruler },
      { to: '/masters/rates', label: 'Rates & Overheads', icon: Percent },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/sales/rfqs', label: 'RFQ', icon: FileText },
      { to: '/sales/quotations', label: 'Quotations', icon: Receipt },
      { to: '/sales/customer-pos', label: 'Customer PO', icon: ShoppingCart },
      { to: '/sales/sales-orders', label: 'Sales Orders', icon: ClipboardCheck },
      { to: '/reviews', label: 'Reviews', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Purchase',
    items: [
      { to: '/purchase/requisitions', label: 'Requisitions', icon: FileText },
      { to: '/purchase/orders', label: 'Purchase Orders', icon: ShoppingCart },
      { to: '/inventory/stock', label: 'Inventory', icon: Package },
      { to: '/inventory/reports', label: 'Inventory Reports', icon: BarChart3 },
      { to: '/inventory/bins', label: 'Storage / Bins', icon: Warehouse },
      { to: '/inventory/transfers', label: 'Internal Transfers', icon: ArrowLeftRight },
      { to: '/inventory/cycle-count', label: 'Cycle Count', icon: ListChecks },
    ],
  },
  {
    label: 'Production',
    items: [
      { to: '/production/engineering', label: 'Engineering', icon: Settings },
      { to: '/production/planning', label: 'Planning / MPS', icon: BarChart3 },
      { to: '/production/manpower', label: 'Manpower', icon: UsersRound },
      { to: '/production/work-orders', label: 'Work Orders', icon: Factory },
    ],
  },
  {
    label: 'Shop Floor - Special Process',
    items: [
      { to: '/shopfloor/chemical-batches', label: 'Chemical Batches', icon: FlaskConical },
    ],
  },
  {
    label: 'Quality',
    items: [
      { to: '/quality/dashboard', label: 'QMS Dashboard', icon: ClipboardCheck },
      { to: '/quality/ncrs', label: 'NCR', icon: ClipboardCheck },
      { to: '/quality/capas', label: 'CAPA', icon: Search },
      { to: '/quality/scars', label: 'SCAR', icon: ShieldAlert },
      { to: '/quality/fairs', label: 'FAI / AS9102', icon: FileText },
      { to: '/quality/special-processes', label: 'Special Processes', icon: Wrench },
      { to: '/quality/export-control', label: 'Export Control', icon: ShieldAlert },
      { to: '/quality/surface-treatment', label: 'Surface Treatment AI', icon: Sparkles },
      { to: '/quality/calibration', label: 'Calibration', icon: Calculator },
      { to: '/quality/documents', label: 'Document Control', icon: FileText },
      { to: '/quality/apqp', label: 'APQP / PPAP', icon: ClipboardList },
      { to: '/quality/internal-audits', label: 'Internal Audits', icon: ShieldCheck },
      { to: '/quality/management-review', label: 'Management Review', icon: Presentation },
    ],
  },
  {
    label: 'Dispatch',
    items: [
      { to: '/dispatch/challans', label: 'Delivery Challan', icon: Truck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance/invoices', label: 'Invoices', icon: Receipt },
      { to: '/finance/ar', label: 'AR / AP', icon: BarChart3 },
      { to: '/finance/gstr', label: 'GSTR-1 Export', icon: FileText },
      { to: '/finance/general-ledger', label: 'General Ledger', icon: BookOpen },
      { to: '/finance/fixed-assets', label: 'Fixed Assets', icon: Boxes },
      { to: '/finance/budget', label: 'Budgeting', icon: PieChart },
      { to: '/masters/exchange-rates', label: 'Exchange Rates', icon: Coins },
      { to: '/masters/tooling', label: 'Tooling', icon: Wrench },
      { to: '/masters/step', label: 'STEP / 3D Ingest', icon: Box },
    ],
  },
  {
    label: 'Integration',
    items: [
      { to: '/integration/edi', label: 'EDI / Portal', icon: Network },
      { to: '/integration/payments', label: 'Payments', icon: CreditCard },
      { to: '/integration/e-signature', label: 'E-Signature', icon: PenTool },
      { to: '/finance/whatsapp-log', label: 'WhatsApp Log', icon: Send },
    ],
  },
  {
    label: 'HR',
    items: [
      { to: '/masters/employees', label: 'Employee Master', icon: Users },
      { to: '/masters/departments', label: 'Department', icon: GitBranch },
      { to: '/masters/designations', label: 'Designation', icon: Layers },
      { to: '/hr', label: 'HR Dashboard', icon: Users },
      { to: '/hr/payroll', label: 'Payroll', icon: Wallet },
      { to: '/hr/appraisals', label: 'Appraisals', icon: Star },
      { to: '/hr/recruitment', label: 'Recruitment', icon: UserPlus },
      { to: '/hr/ess', label: 'Self-Service', icon: CalendarDays },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/maintenance', label: 'Maintenance', icon: Wrench },
    ],
  },
]

const activeLinkClass = 'bg-[#005c87]/30 text-cyan-200 font-medium'
const defaultLinkClass = 'text-gray-300 hover:bg-[#2a5a8f] hover:text-white'

export function LeftNav() {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const q = query.trim().toLowerCase()
  return (
    <aside className="w-60 min-h-screen bg-[#204577] flex flex-col flex-shrink-0">
      {/* Brand Logo */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="bg-white rounded-lg p-2">
          <img 
            src="/logo.jpg" 
            alt="Scale TRACE AI" 
            className="h-10 w-auto object-contain mx-auto"
          />
        </div>
      </div>

      {/* Dashboard link */}
      <div className="px-3 pt-3">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-[#005c87] text-white' : 'text-gray-200 hover:bg-[#2a5a8f] hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
      </div>

      {/* Audit Trail link -- standalone top-level, like Dashboard, not nested
          in a collapsible group, since it spans every module. Administrator
          only on the backend; visible to all here since the API itself
          enforces the gate and returns a clear 403 otherwise. */}
      <div className="px-3 pt-1">
        <NavLink
          to="/audit-trail"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-[#005c87] text-white' : 'text-gray-200 hover:bg-[#2a5a8f] hover:text-white'
            }`
          }
        >
          <History size={18} />
          Audit Trail
        </NavLink>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full bg-[#2a5a8f] text-sm text-gray-100 placeholder-gray-400 rounded-lg pl-8 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-[#005c87]"
          />
        </div>
      </div>

      {/* Module groups (collapsible + searchable) */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 mt-2 space-y-1">
        {navGroups.map((group) => {
          const items = q
            ? group.items.filter((i) => i.label.toLowerCase().includes(q))
            : group.items
          if (items.length === 0) return null
          const open = q ? true : !collapsed[group.label]
          return (
            <div key={group.label}>
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
              >
                <span>{group.label}</span>
                <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
              </button>
              {open && (
                <ul className="space-y-0.5 mb-2">
                  {items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive ? activeLinkClass : defaultLinkClass
                          }`
                        }
                      >
                        <item.icon size={16} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

    </aside>
  )
}


