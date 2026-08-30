/**
 * axiosClient.ts - Shared Axios instance for Scale AI ERP frontend.
 *
 * Features
 * --------
 * - Base URL: '' (relative) - Vite dev proxy routes /api/* to ERP FastAPI on :8001
 * - Request interceptor: injects `Authorization: Bearer <token>` from authStore
 * - Response interceptor: auto-logout on 401 (expired/invalid token)
 * - Default headers: JSON content type
 *
 * Usage
 * -----
 *   import { apiClient } from './axiosClient'
 *   const { data } = await apiClient.get('/api/v1/customers')
 */

import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

// In production (Cloudflare Pages), VITE_API_BASE_URL points to the deployed
// backend (e.g. https://api.yourdomain.com). In local dev it is empty so the
// Vite proxy handles /api/* → localhost:8000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor - attach JWT Bearer token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Read token from localStorage at request time to pick up refreshed tokens
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
// Response interceptor - handle 401 (token expired / invalid)
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear persisted auth state and redirect to login
      try {
        localStorage.removeItem('scale-erp-auth')
      } catch {
        // Ignore storage errors
      }
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
