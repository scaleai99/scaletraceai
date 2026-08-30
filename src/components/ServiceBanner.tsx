/**
 * ServiceBanner
 *
 * Subscribes to the backend SSE stream at /api/v1/health/stream.
 * Displays a dismissible amber banner at the top of the screen whenever
 * any infrastructure service (Database, Qdrant, Ollama) is unavailable.
 * The banner auto-clears when the service recovers.
 *
 * SSE payload shape:
 *   { "service": "Ollama", "status": "unavailable" | "degraded" | "healthy", "message": "..." }
 */

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ServiceEvent {
  service: string
  status: 'healthy' | 'degraded' | 'unavailable'
  message: string
}

// One banner entry per service that is not healthy
type BannerMap = Record<string, ServiceEvent>

export function ServiceBanner() {
  const [banners, setBanners] = useState<BannerMap>({})
  // Manually dismissed services "" cleared when service recovers
  const dismissed = useRef<Set<string>>(new Set())
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/v1/health/stream')
      esRef.current = es

      es.onmessage = (evt) => {
        // Skip SSE comment lines (heartbeats) that arrive as empty data
        if (!evt.data || evt.data.trim() === '') return

        let parsed: ServiceEvent
        try {
          parsed = JSON.parse(evt.data) as ServiceEvent
        } catch {
          return
        }

        const { service, status } = parsed

        setBanners((prev) => {
          const next = { ...prev }
          if (status === 'healthy') {
            // Service recovered "" remove its banner and clear any dismissal
            delete next[service]
            dismissed.current.delete(service)
          } else {
            // Only show if the user hasn't manually dismissed it since it went down
            if (!dismissed.current.has(service)) {
              next[service] = parsed
            }
          }
          return next
        })
      }

      es.onerror = () => {
        // EventSource auto-reconnects; nothing extra needed here
        es.close()
        // Retry after 5 s so we don't spam the backend
        setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
    }
  }, [])

  const visible = Object.values(banners)

  if (visible.length === 0) return null

  function dismiss(service: string) {
    dismissed.current.add(service)
    setBanners((prev) => {
      const next = { ...prev }
      delete next[service]
      return next
    })
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-0.5 flex-shrink-0"
    >
      {visible.map((evt) => (
        <div
          key={evt.service}
          className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle
              size={15}
              className="flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <span>
              {evt.message ||
                `š  ${evt.service} unavailable "" read-only mode active`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => dismiss(evt.service)}
            className="flex-shrink-0 p-0.5 rounded hover:bg-amber-100 transition-colors"
            aria-label={`Dismiss ${evt.service} banner`}
          >
            <X size={14} className="text-amber-600" />
          </button>
        </div>
      ))}
    </div>
  )
}
