import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { getDomainDashboard, type DomainDashboard, type Kpi, type ChartSeries } from '../../api/dashboardsApi'

const TONE: Record<string, string> = {
  good: 'text-green-600 border-green-200 bg-green-50',
  warn: 'text-amber-600 border-amber-200 bg-amber-50',
  bad: 'text-red-600 border-red-200 bg-red-50',
  info: 'text-blue-600 border-blue-200 bg-blue-50',
}
const PALETTE = ['#E8A838', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#475569']

function fmt(v: number | string, unit?: string) {
  if (typeof v === 'number' && unit === '‚¹') return '‚¹' + v.toLocaleString('en-IN')
  return (unit && unit !== '‚¹' ? unit + ' ' : '') + (typeof v === 'number' ? v.toLocaleString('en-IN') : v)
}

function KpiCard({ k }: { k: Kpi }) {
  return (
    <div className={`rounded-xl border p-4 ${TONE[k.tone || 'info']}`}>
      <div className="text-2xl font-bold">{fmt(k.value, k.unit)}</div>
      <div className="text-xs mt-1 opacity-80">{k.label}</div>
    </div>
  )
}

function BarChart({ c }: { c: ChartSeries }) {
  const max = Math.max(1, ...c.data.map((d) => d.value))
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h4 className="text-sm font-semibold mb-3 text-[#333]">{c.title}</h4>
      {c.data.length === 0 ? (
        <p className="text-xs text-gray-400">No data.</p>
      ) : (
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
      )}
    </div>
  )
}

function Donut({ c }: { c: ChartSeries }) {
  const total = c.data.reduce((s, d) => s + d.value, 0)
  const R = 52, C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h4 className="text-sm font-semibold mb-3 text-[#333]">{c.title}</h4>
      {total === 0 ? (
        <p className="text-xs text-gray-400">No data.</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <g transform="translate(65,65) rotate(-90)">
              <circle r={R} fill="none" stroke="#f1f1f1" strokeWidth="16" />
              {c.data.map((d, i) => {
                const len = (d.value / total) * C
                const el = <circle key={i} r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
                offset += len
                return el
              })}
            </g>
            <text x="65" y="70" textAnchor="middle" className="fill-gray-700" fontSize="20" fontWeight="700">{total}</text>
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

export function DomainDashboardPage() {
  const { domain = 'sales' } = useParams()
  const [data, setData] = useState<DomainDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const load = useCallback(() => {
    setLoading(true); setErr('')
    getDomainDashboard(domain).then(setData).catch((e) => setErr(e?.response?.data?.detail || String(e))).finally(() => setLoading(false))
  }, [domain])
  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{data?.title || 'Dashboard'}</h1>
        <button onClick={load} className="text-xs flex items-center gap-1 border border-gray-300 rounded px-2 py-1 hover:bg-gray-50">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-3">{err}</div>}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {data.kpis.map((k, i) => <KpiCard key={i} k={k} />)}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {data.charts.map((c, i) => (c.type === 'donut' ? <Donut key={i} c={c} /> : <BarChart key={i} c={c} />))}
          </div>
        </>
      )}
    </div>
  )
}
export default DomainDashboardPage
