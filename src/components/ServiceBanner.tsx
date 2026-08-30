/**
 * ServiceBanner
 *
 * DISABLED for static demo deployment - no backend health stream available.
 * In production with a backend, this would subscribe to SSE at /api/v1/health/stream
 * and display service status banners.
 */

export function ServiceBanner() {
  // Static demo mode - no health stream, return nothing
  return null
}
