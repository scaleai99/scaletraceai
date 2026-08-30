/**
 * useDemoFallback - React hook for transparent demo data fallback.
 *
 * Usage:
 *   const { data, isDemo, loading, error } = useDemoFallback(
 *     () => listRFQs(),   // API call
 *     DEMO_RFQS,          // fallback data
 *     []                  // deps array (re-fetch when these change)
 *   )
 *
 * Behaviour:
 *   - Calls the API function once on mount (and when deps change)
 *   - If the API returns a non-empty array → real data, isDemo = false
 *   - If the API returns an empty array → demo data, isDemo = true
 *   - If the API throws → demo data, isDemo = true (graceful degradation)
 *   - Always shows loading = true while fetching
 */

import { useState, useEffect, useRef, DependencyList } from 'react'

export interface DemoFallbackResult<T> {
  data: T[]
  isDemo: boolean
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDemoFallback<T>(
  apiFn: () => Promise<T[]>,
  demoData: T[],
  deps: DependencyList = []
): DemoFallbackResult<T> {
  const [data, setData] = useState<T[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const apiFnRef = useRef(apiFn)
  apiFnRef.current = apiFn

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    apiFnRef.current()
      .then((result) => {
        if (cancelled) return
        if (Array.isArray(result) && result.length > 0) {
          setData(result)
          setIsDemo(false)
        } else {
          // Empty array from API → use demo data
          setData(demoData)
          setIsDemo(demoData.length > 0)
        }
      })
      .catch(() => {
        if (cancelled) return
        // API error → use demo data
        setData(demoData)
        setIsDemo(demoData.length > 0)
        setError(null) // Don't show error when demo data is available
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  return {
    data,
    isDemo,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  }
}
