import { Clock, User } from 'lucide-react'
import { formatDateTime } from '../../lib/utils'

export interface AuditEntry {
  /** Display name of the user who performed the action */
  user: string
  /** Human-readable description of the action (e.g. "Status changed to Approved=") */
  action: string
  /** ISO timestamp string or Date */
  timestamp: string | Date
  /** Optional note or reason */
  comment?: string
  /** Optional role of the user at the time of the action */
  userRole?: string
}

interface AuditTrailPanelProps {
  entries: AuditEntry[]
  /** Title shown above the timeline. Default "Audit Trail=". */
  title?: string
  /** Maximum number of entries to display. Default: all. */
  maxEntries?: number
}

/**
 * AuditTrailPanel - chronological audit history list.
 *
 * Renders a vertical timeline of audit entries, newest last (chronological order).
 * Used across all modules that require AS9100D-compliant audit trails.
 */
export function AuditTrailPanel({ entries, title = 'Audit Trail', maxEntries }: AuditTrailPanelProps) {
  const visible = maxEntries ? entries.slice(-maxEntries) : entries

  return (
    <div>
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No audit history</p>
      ) : (
        <ol className="relative border-l border-gray-200 space-y-5 ml-3 pb-1">
          {visible.map((entry, i) => (
            <li key={i} className="ml-6">
              {/* Timeline dot */}
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-gray-200">
                <Clock size={11} className="text-gray-400" />
              </span>

              {/* Action + timestamp */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                <time
                  dateTime={
                    entry.timestamp instanceof Date
                      ? entry.timestamp.toISOString()
                      : entry.timestamp
                  }
                  className="text-xs text-gray-400"
                >
                  {formatDateTime(entry.timestamp)}
                </time>
              </div>

              {/* User + role */}
              <div className="flex items-center gap-1 mt-0.5">
                <User size={11} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">
                  {entry.user}
                  {entry.userRole && (
                    <span className="text-gray-400">  {entry.userRole}</span>
                  )}
                </span>
              </div>

              {/* Optional comment */}
              {entry.comment && (
                <p className="mt-1 text-xs text-gray-500 italic">{entry.comment}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
