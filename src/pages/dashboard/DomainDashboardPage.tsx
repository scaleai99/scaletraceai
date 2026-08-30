import { useParams } from 'react-router-dom'
import { type DomainDashboard, type Kpi, type ChartSeries } from '../../api/dashboardsApi'

// ---------------------------------------------------------------------------
// Static demo data for all domain dashboards
// ---------------------------------------------------------------------------
const DEMO_DASHBOARDS: Record<string, DomainDashboard> = {
  sales: {
    domain: 'sales', title: 'Sales Dashboard',
    kpis: [
      { label: 'Open RFQs', value: 12, tone: 'info' },
      { label: 'Quotations Sent', value: 8, tone: 'good' },
      { label: 'Orders Won', value: 5, tone: 'good' },
      { label: 'Pipeline Value', value: '₹87.5L', tone: 'info' },
    ],
    charts: [
      { type: 'donut', title: 'RFQ Status', data: [{ label: 'Received', value: 4 }, { label: 'AI Costing', value: 3 }, { label: 'Quoted', value: 3 }, { label: 'Won', value: 2 }] },
      { type: 'bar', title: 'Revenue by Customer (₹L)', data: [{ label: 'Kun Aerospace', value: 32 }, { label: 'Collins Aerospace', value: 28 }, { label: 'Honeywell', value: 18 }, { label: 'Moog Controls', value: 9 }] },
    ],
  },
  production: {
    domain: 'production', title: 'Production Dashboard',
    kpis: [
      { label: 'Active Work Orders', value: 14, tone: 'info' },
      { label: 'OEE', value: '78.6%', tone: 'good' },
      { label: 'On-Time Completion', value: '91%', tone: 'good' },
      { label: 'Scrap Rate', value: '2.1%', tone: 'warn' },
    ],
    charts: [
      { type: 'donut', title: 'Work Order Status', data: [{ label: 'In Progress', value: 7 }, { label: 'Planned', value: 4 }, { label: 'Completed', value: 3 }] },
      { type: 'bar', title: 'Output by Part Family', data: [{ label: 'Brackets', value: 42 }, { label: 'Housings', value: 31 }, { label: 'Shafts', value: 18 }, { label: 'Flanges', value: 12 }] },
    ],
  },
  quality: {
    domain: 'quality', title: 'Quality Dashboard',
    kpis: [
      { label: 'Open NCRs', value: 3, tone: 'warn' },
      { label: 'CAPAs In Progress', value: 2, tone: 'warn' },
      { label: 'FAIRs Approved', value: 7, tone: 'good' },
      { label: 'Rejection Rate', value: '1.4%', tone: 'good' },
    ],
    charts: [
      { type: 'donut', title: 'NCR by Disposition', data: [{ label: 'Use As-Is', value: 1 }, { label: 'Rework', value: 2 }, { label: 'Scrap', value: 1 }] },
      { type: 'bar', title: 'Defects by Category', data: [{ label: 'Dimensional', value: 5 }, { label: 'Surface', value: 3 }, { label: 'Material', value: 2 }, { label: 'Other', value: 1 }] },
    ],
  },
  purchase: {
    domain: 'purchase', title: 'Purchase Dashboard',
    kpis: [
      { label: 'Open PRs', value: 6, tone: 'info' },
      { label: 'POs Raised', value: 4, tone: 'info' },
      { label: 'Pending GRNs', value: 2, tone: 'warn' },
      { label: 'Purchase Value', value: '₹24.2L', tone: 'info' },
    ],
    charts: [
      { type: 'donut', title: 'PO Status', data: [{ label: 'Draft', value: 2 }, { label: 'Approved', value: 4 }, { label: 'GRN Pending', value: 2 }] },
      { type: 'bar', title: 'Spend by Supplier (₹L)', data: [{ label: 'Bharat Aluminium', value: 11 }, { label: 'Precision Coatings', value: 8 }, { label: 'TechnoForge', value: 5 }] },
    ],
  },
  inventory: {
    domain: 'inventory', title: 'Inventory Dashboard',
    kpis: [
      { label: 'Total SKUs', value: 248, tone: 'info' },
      { label: 'Low Stock Items', value: 7, tone: 'warn' },
      { label: 'Stock Value', value: '₹43.8L', tone: 'info' },
      { label: 'Inventory Turns', value: 6.2, tone: 'good' },
    ],
    charts: [
      { type: 'donut', title: 'Stock by Category', data: [{ label: 'Raw Material', value: 120 }, { label: 'WIP', value: 68 }, { label: 'Finished Goods', value: 60 }] },
      { type: 'bar', title: 'Top Consumed Items (Qty)', data: [{ label: 'AL6061 Sheet', value: 84 }, { label: 'SS304 Rod', value: 62 }, { label: 'Titanium Billet', value: 38 }, { label: 'PTFE Seal', value: 27 }] },
    ],
  },
  finance: {
    domain: 'finance', title: 'Finance Dashboard',
    kpis: [
      { label: 'Revenue (MTD)', value: '₹38.6L', tone: 'good' },
      { label: 'Outstanding AR', value: '₹12.4L', tone: 'warn' },
      { label: 'Overdue AP', value: '₹3.1L', tone: 'bad' },
      { label: 'Gross Margin', value: '34.2%', tone: 'good' },
    ],
    charts: [
      { type: 'bar', title: 'Monthly Revenue (₹L)', data: [{ label: 'Apr', value: 28 }, { label: 'May', value: 33 }, { label: 'Jun', value: 31 }, { label: 'Jul', value: 38 }] },
      { type: 'donut', title: 'Invoice Status', data: [{ label: 'Paid', value: 18 }, { label: 'Pending', value: 7 }, { label: 'Overdue', value: 3 }] },
    ],
  },
  supplier: {
    domain: 'supplier', title: 'Supplier Dashboard',
    kpis: [
      { label: 'Active Suppliers', value: 18, tone: 'info' },
      { label: 'Avg Audit Score', value: '84 / 100', tone: 'good' },
      { label: 'On-Time Delivery', value: '88%', tone: 'good' },
      { label: 'Open SCARs', value: 2, tone: 'warn' },
    ],
    charts: [
      { type: 'donut', title: 'Suppliers by Category', data: [{ label: 'Machining', value: 8 }, { label: 'Surface Treatment', value: 4 }, { label: 'Raw Material', value: 6 }] },
      { type: 'bar', title: 'Delivery Performance (%)', data: [{ label: 'Bharat Aluminium', value: 92 }, { label: 'Precision Coatings', value: 85 }, { label: 'TechnoForge', value: 88 }] },
    ],
  },
}

// ---------------------------------------------------------------------------
// Colour map
// ---------------------------------------------------------------------------
const TONE: Record<string, string> = {
  good: 'text-green-600 border-green-200 bg-green-50',
  warn: 'text-amber-600 border-amber-200 bg-amber-50',
  bad:  'text-red-600 border-red-200 bg-red-50',
  info: 'text-blue-600 border-blue-200 bg-blue-50',
}
const PALETTE = ['#E8A838', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#475569']

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function KpiCard({ k }: { k: Kpi }) {
  const cls = TONE[k.tone ?? 'info'] ?? TONE.info
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-2xl font-bold">{String(k.value)}{k.unit ? ` ${k.unit}` : ''}</div>
      <div className="text-xs mt-1 opacity-80">{k.label}</div>
    </div>
  )
}

function BarChart({ c }: { c: ChartSeries }) {
  const max = Math.max(1, ...c.data.map((d) => d.value))
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h4 className="text-sm font-semibold mb-3 text-gray-800">{c.title}</h4>
      <div className="space-y-2">
        {c.data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-28 truncate text-gray-600">{d.label}</span>
            <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
              <div className="h-4 rounded" style={{ width: `${(d.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
            </div>
            <span className="w-8 text-right font-medium text-gray-700">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Donut({ c }: { c: ChartSeries }) {
  const total = c.data.reduce((s, d) => s + d.value, 0)
  const R = 52
  const CIRC = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h4 className="text-sm font-semibold mb-3 text-gray-800">{c.title}</h4>
      {total === 0 ? (
        <p className="text-xs text-gray-400">No data.</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <g transform="translate(65,65) rotate(-90)">
              <circle r={R} fill="none" stroke="#f1f1f1" strokeWidth="16" />
              {c.data.map((d, i) => {
                const len = (d.value / total) * CIRC
                const el = (
                  <circle
                    key={i} r={R} fill="none"
                    stroke={PALETTE[i % PALETTE.length]} strokeWidth="16"
                    strokeDasharray={`${len} ${CIRC - len}`}
                    strokeDashoffset={-offset}
                  />
                )
                offset += len
                return el
              })}
            </g>
            <text x="65" y="70" textAnchor="middle" fill="#374151" fontSize="20" fontWeight="700">{total}</text>
          </svg>
          <div className="space-y-1">
            {c.data.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="text-gray-600">{d.label}</span>
                <span className="font-medium text-gray-700">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page — pure static, no API calls
// ---------------------------------------------------------------------------
export function DomainDashboardPage() {
  const { domain = 'sales' } = useParams()
  const data: DomainDashboard = DEMO_DASHBOARDS[domain] ?? DEMO_DASHBOARDS.sales

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{data.title}</h1>
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          Demo data
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {data.kpis.map((k, i) => <KpiCard key={i} k={k} />)}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data.charts.map((c, i) =>
          c.type === 'donut' ? <Donut key={i} c={c} /> : <BarChart key={i} c={c} />
        )}
      </div>
    </div>
  )
}

export default DomainDashboardPage
