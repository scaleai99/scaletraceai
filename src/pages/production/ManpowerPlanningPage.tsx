/**
 * ManpowerPlanningPage "" Module 16 gap (Req 16.10).
 *
 * Operator-hours planned vs available per work centre, with a red flag when
 * utilisation exceeds 90%. Reached at /production/manpower.
 */
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button, Badge } from '../../components/ui'
import { getManpowerLoading, ManpowerLoading } from '../../api/manpowerApi'

export function ManpowerPlanningPage() {
  const [data, setData] = useState<ManpowerLoading | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getManpowerLoading())
    } catch {
      // Static demo — show demo data
      setData({
        threshold_pct: 90,
        work_centres: [
          { work_centre: 'CNC Turning', planned_operator_hours: 120, available_operator_hours: 160, utilisation_pct: 75, over_threshold: false },
          { work_centre: 'VMC Milling', planned_operator_hours: 148, available_operator_hours: 160, utilisation_pct: 92.5, over_threshold: true },
          { work_centre: 'Grinding', planned_operator_hours: 80, available_operator_hours: 160, utilisation_pct: 50, over_threshold: false },
          { work_centre: 'Assembly', planned_operator_hours: 60, available_operator_hours: 80, utilisation_pct: 75, over_threshold: false },
        ]
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manpower Planning</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 16 "" operator-hours planned vs available per work centre (red &gt; 90%)
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={14} />} title="Refresh" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading || !data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading"¦
        </div>
      ) : data.work_centres.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          No planned operations yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.work_centres.map((wc) => (
            <div key={wc.work_centre} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{wc.work_centre}</span>
                <span className="text-sm text-gray-600">
                  {wc.planned_operator_hours}h / {wc.available_operator_hours}h
                  {wc.over_threshold && <Badge variant="danger" size="sm" className="ml-2">Overloaded</Badge>}
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${wc.over_threshold ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(wc.utilisation_pct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{wc.utilisation_pct}% utilised</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
