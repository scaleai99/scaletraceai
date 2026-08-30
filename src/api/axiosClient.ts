/**
 * axiosClient.ts - Shared Axios instance for Scale AI ERP frontend.
 *
 * STATIC DEMO MODE - No backend required!
 * All API calls return empty arrays/objects so pages show "no data" states
 * instead of error messages.
 */

import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3_000, // Short timeout - fail fast in static demo
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor - attach JWT Bearer token
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
      // localStorage unavailable or JSON malformed - proceed without token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---------------------------------------------------------------------------
// Response interceptor - STATIC DEMO MODE
// ---------------------------------------------------------------------------
// Convert all errors to empty successful responses.
// This allows pages to render with empty states instead of showing errors.

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Check if the request URL contains list-like endpoints
    const url = error.config?.url ?? ''
    const method = error.config?.method?.toLowerCase() ?? 'get'
    
    // For GET requests, return empty array or object based on URL pattern
    if (method === 'get') {
      // Endpoints that return arrays (lists)
      if (url.includes('/customers') || url.includes('/suppliers') || 
          url.includes('/items') || url.includes('/rfqs') || 
          url.includes('/quotations') || url.includes('/orders') ||
          url.includes('/employees') || url.includes('/inventory') ||
          url.includes('/ncrs') || url.includes('/capas') ||
          url.includes('/prs') || url.includes('/pos') ||
          url.includes('/invoices') || url.includes('/challans') ||
          url.includes('/companies') || url.includes('/plants') ||
          url.includes('/documents') || url.includes('/holidays') ||
          url.includes('/work-orders') || url.includes('/engineering') ||
          url.includes('/calibration') || url.includes('/fairs')) {
        // Return empty array wrapped in axios-like response
        return Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: error.config } as AxiosResponse)
      }
      // Dashboard/KPI endpoints return empty object
      if (url.includes('/dashboard') || url.includes('/kpis') || url.includes('/summary')) {
        return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: error.config } as AxiosResponse)
      }
    }
    
    // For POST/PUT/PATCH/DELETE, just reject - these are user actions that should fail silently
    return Promise.reject(error)
  }
)

export default apiClient
