import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { Button, Input } from '../components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username and password are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post('/api/auth/login', { username, password })
      // Backend returns { access_token, token_type, expires_in, user: { user_id, username, full_name, email, roles, auth_type, plant_id } }
      const user = data.user ?? data  // support both nested and flat response shapes
      login(
        data.access_token,
        {
          user_id: user.user_id ?? user.id ?? '',
          username: user.username ?? username,
          full_name: user.full_name ?? user.username ?? username,
          email: user.email ?? null,
          auth_type: user.auth_type ?? 'local',
        },
        user.roles ?? data.roles ?? [],
        user.plant_id ?? null
      )
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      const detail = e?.response?.data?.detail
      setError(
        typeof detail === 'string' ? detail : e?.message ?? 'Login failed. Check username and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#204577] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-xl p-4 inline-block mb-4">
            <img 
              src="/logo.jpg" 
              alt="Scale TRACE AI" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <p className="text-gray-300 text-sm">Smart Traceability for Aerospace & Beyond</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>

          <div className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="admin"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              className="w-full mt-2"
              loading={loading}
              onClick={handleLogin}
            >
              Sign in
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Default credentials: <span className="font-mono text-gray-600">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  )
}