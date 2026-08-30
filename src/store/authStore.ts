/**
 * authStore.ts - Zustand auth store for Scale AI ERP.
 *
 * Stores the authenticated user's JWT token, profile, roles, and active plant.
 * Persists to localStorage so the session survives a page refresh.
 *
 * Usage
 * -----
 *   const { user, token, isAuthenticated, login, logout } = useAuthStore()
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  user_id: string
  username: string
  full_name: string
  email: string | null
  auth_type: string
}

export interface AuthState {
  /** Signed JWT string (null when logged out) */
  token: string | null
  /** Decoded user profile (null when logged out) */
  user: AuthUser | null
  /** List of role codes assigned to the current user */
  roles: string[]
  /** Active plant UUID (null when not set) */
  plantId: string | null
  /** True when a valid token is present */
  isAuthenticated: boolean

  // --- Actions --------------------------------------------------------------
  /**
   * Set auth state after a successful login or token refresh.
   * @param token  - JWT access token string
   * @param user   - user profile from API response
   * @param roles  - role codes list (may come from token claims or API)
   * @param plantId - active plant UUID or null
   */
  login: (token: string, user: AuthUser, roles?: string[], plantId?: string | null) => void

  /**
   * Clear all auth state (logout, token expiry, 401 responses).
   */
  logout: () => void

  /**
   * Update the active plant without re-login.
   */
  setPlantId: (plantId: string | null) => void

  /**
   * Update roles (e.g. after a role assignment change on the server).
   */
  setRoles: (roles: string[]) => void

  /**
   * Convenience: return true if the current user has at least one of the given roles.
   */
  hasRole: (...allowedRoles: string[]) => boolean
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roles: [],
      plantId: null,
      isAuthenticated: false,

      login(token, user, roles = [], plantId = null) {
        set({
          token,
          user,
          roles,
          plantId,
          isAuthenticated: true,
        })
      },

      logout() {
        set({
          token: null,
          user: null,
          roles: [],
          plantId: null,
          isAuthenticated: false,
        })
      },

      setPlantId(plantId) {
        set({ plantId })
      },

      setRoles(roles) {
        set({ roles })
      },

      hasRole(...allowedRoles) {
        const { roles } = get()
        return allowedRoles.some((r) => roles.includes(r))
      },
    }),
    {
      name: 'scale-erp-auth',           // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist state fields, not the action functions
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        roles: state.roles,
        plantId: state.plantId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
