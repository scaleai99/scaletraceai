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
        // Real data only (CLAUDE.md rule 2): an empty list renders empty,
        // never synthetic demo rows.
        setData(Array.isArray(result) ? result : [])
        setIsDemo(false)
      })
      .catch((err: any) => {
        if (cancelled) return
        // Surface the real failure instead of masking a broken endpoint with
        // fake data (this exact masking previously hid a broken Item list).
        setData([])
        setIsDemo(false)
        setError(err?.response?.data?.detail || err?.message || 'Failed to load data')
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
