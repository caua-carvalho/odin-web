import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LogOut,
  Menu,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { BackgroundParticles } from './react-bits/BackgroundParticles'
import { DecryptedText } from './react-bits/DecryptedText'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hermesOnline, setHermesOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const checkStatus = async () => {
      try {
        const res = await api.getSystemStatus()
        if (mounted) {
          setHermesOnline(res?.hermes_connected ?? true)
        }
      } catch {
        if (mounted) {
          setHermesOnline(false)
        }
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-odin-black text-odin-graphite-50 relative overflow-hidden">
      {/* Background Cinematic Particles */}
      <BackgroundParticles particleCount={30} particleColor="#FF6A00" accentColor="#67DFFF" />

      {/* Top HUD Status Bar */}
      <header className="h-14 border-b border-odin-graphite-800/80 bg-odin-surface/80 backdrop-blur-md z-30 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-1.5 rounded-lg text-odin-graphite-400 hover:text-odin-graphite-50 hover:bg-odin-graphite-900 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-odin-orange-500/15 border border-odin-orange-500/40 flex items-center justify-center shadow-hud-glow-orange group-hover:border-odin-orange-400 transition-colors">
              <span className="font-mono font-bold text-xs text-odin-orange-400">Ω</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold tracking-widest text-odin-graphite-100 uppercase">
                <DecryptedText text="ODIN V2" speed={25} />
              </span>
              <span className="font-mono text-[9px] tracking-wider text-odin-orange-400/90 uppercase -mt-0.5">
                Neural Command
              </span>
            </div>
          </NavLink>
        </div>

        {/* System Telemetry Badges */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-odin-surface-elevated/70 border border-odin-graphite-800 text-odin-graphite-300">
            {hermesOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-odin-emerald-400" />
                <span>HERMES LINK:</span>
                <span className="text-odin-emerald-400 font-semibold">ONLINE</span>
              </>
            ) : hermesOnline === false ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-odin-crimson-400" />
                <span>HERMES LINK:</span>
                <span className="text-odin-crimson-400 font-semibold">OFFLINE</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-odin-amber-400 animate-pulse" />
                <span>HERMES LINK:</span>
                <span className="text-odin-amber-400 font-semibold">SYNC</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-odin-surface-elevated/70 border border-odin-graphite-800 text-odin-graphite-300">
            <span className="w-1.5 h-1.5 rounded-full bg-odin-orange-400 animate-pulse" />
            <span>NODE:</span>
            <span className="text-odin-orange-400 font-semibold">ODIN-CORE</span>
          </div>
        </div>

        {/* User profile & quick exit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-odin-surface-elevated/40 border border-odin-graphite-800/60">
            <div className="w-5 h-5 rounded-full bg-odin-orange-500/20 text-odin-orange-400 flex items-center justify-center font-mono text-xs font-semibold">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline font-mono text-xs text-odin-graphite-300 truncate max-w-[130px]">
              {user?.email || 'operador'}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-odin-graphite-400 hover:text-odin-crimson-400 hover:bg-odin-crimson-500/10 border border-transparent hover:border-odin-crimson-500/20 transition-colors"
            title="Encerrar sessão"
            aria-label="Encerrar sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}