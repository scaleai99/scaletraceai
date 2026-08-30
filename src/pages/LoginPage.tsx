import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button, Input } from '../components/ui'

// Demo-mode credentials — no backend required
const DEMO_USERNAME = 'admin'
const DEMO_PASSWORD = 'admin123'

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

    // Simulate a brief loading feel, then validate against demo credentials
    await new Promise((resolve) => setTimeout(resolve, 400))

    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      login(
        'demo-token',
        {
          user_id: 'demo-user-001',
          username: DEMO_USERNAME,
          full_name: 'Demo Admin',
          email: 'admin@scaletrace.ai',
          auth_type: 'local',
        },
        ['admin'],
        null
      )
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Use admin / admin123')
    }

    setLoading(false)
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