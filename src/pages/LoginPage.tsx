import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CoreVisualizer } from '../components/core/CoreVisualizer'
import { BackgroundParticles } from '../components/react-bits/BackgroundParticles'
import { DecryptedText } from '../components/react-bits/DecryptedText'
import { ShinyText } from '../components/react-bits/ShinyText'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import {
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
} from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Erro ao autenticar. Verifique suas credenciais de acesso.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-odin-black relative overflow-hidden select-none">
      {/* Background Cinematic Particles */}
      <BackgroundParticles particleCount={35} particleColor="#FF6A00" accentColor="#67DFFF" />

      <div className="w-full max-w-md relative z-10 animate-fade-in font-mono">
        {/* Terminal Header & Mini 3D Core */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-2">
            <CoreVisualizer
              state={loading ? 'connecting' : error ? 'error' : 'idle'}
              size="sm"
              showStatusBadge={false}
            />
          </div>

          <span className="text-[11px] font-bold tracking-widest text-odin-orange-400 uppercase">
            <DecryptedText text="TERMINAL DE ACESSO ODIN" speed={30} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-odin-graphite-50 mt-1">
            <ShinyText text="ODIN V2" />
          </h1>
          <p className="text-xs text-odin-graphite-400 mt-1">
            Autenticação de operador para comandos neurais
          </p>
        </div>

        {/* Login Card */}
        <SpotlightCard
          className="p-6 sm:p-8 shadow-hud-glow-orange border-odin-orange-500/30"
          spotlightColor="rgba(255, 106, 0, 0.15)"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="flex items-center gap-2.5 p-3 rounded-lg bg-odin-crimson-500/15 border border-odin-crimson-500/30 text-odin-crimson-400 text-xs"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Credencial de Acesso (Email)
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-odin-graphite-500"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9 font-mono text-xs"
                  placeholder="operador@odin.ai"
                  required
                  disabled={loading || authLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Chave de Segurança (Senha)
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-odin-graphite-500"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9 pr-9 font-mono text-xs"
                  placeholder="••••••••••••"
                  required
                  disabled={loading || authLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-odin-graphite-500 hover:text-odin-graphite-100 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-xs font-mono font-bold tracking-wider mt-2 flex items-center justify-center gap-2"
              disabled={loading || authLoading}
            >
              {loading || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTENTICANDO...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>INICIAR SESSÃO NEURAL</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-odin-graphite-800 text-center text-[10px] text-odin-graphite-500 font-mono flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-odin-emerald-400" />
            <span>CANAL PROTEGIDO POR CRIPTOGRAFIA DE PONTA A PONTA</span>
          </div>
        </SpotlightCard>

        <p className="mt-6 text-center text-[11px] text-odin-graphite-600 font-mono">
          ODIN V2 · NEURAL COMMAND INTERFACE
        </p>
      </div>
    </div>
  )
}