/**
 * axiosClient.ts - Shared Axios instance for Scale AI ERP frontend.
 *
 * STATIC DEMO MODE - No backend required.
 * All API errors are handled gracefully:
 * - GET list endpoints return [] so pages show empty states instead of errors
 * - Dashboard/KPI endpoints reject so pages use their rich DEMO_* fallbacks
 * - Mutation endpoints (POST/PUT/PATCH/DELETE) reject silently
 */

import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3_000, // Short timeout — fail fast in static demo
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT Bearer token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    try {
      const raw = localStorage.getItem('scale-erp-auth')
      if (raw) {
        const { state } = JSON.parse(raw) as { state: { token: string | null } }
        if (state?.token) {
          config.headers = config.headers ?? {}
          config.headers['Authorization'] = `Bearer ${state.token}`
        }
      }
    } catch {
      // ignore
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---------------------------------------------------------------------------
// Response interceptor — STATIC DEMO MODE
// ---------------------------------------------------------------------------
// ALL failures reject so .catch() in pages can load demo data.
// Never clear auth or redirect to login.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error)
)

export default apiClient
