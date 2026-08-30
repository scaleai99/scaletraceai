/**
 * DemoBanner "" shown at the top of a table/list when displaying demo data.
 *
 * Usage:
 *   {isDemo && <DemoBanner />}
 */

import { FlaskConical } from 'lucide-react'

export function DemoBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 mb-3"
    >
      <FlaskConical size={13} className="shrink-0 text-blue-500" />
      <span>
        <strong>Demo data</strong> "" connect your database to see real records.
      </span>
    </div>
  )
}
