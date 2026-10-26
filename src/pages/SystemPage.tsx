import { useState, useEffect, useCallback } from 'react'
import { api, type SystemStatus } from '../lib/api'
import { cn, formatRelativeTime, formatDate } from '../lib/utils'
import { LoadingScreen } from '../components/LoadingScreen'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { DecryptedText } from '../components/react-bits/DecryptedText'
import { ShinyText } from '../components/react-bits/ShinyText'
import { AgentOrb } from '../components/common/AgentOrb'
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Info,
  ShieldCheck,
  Radio,
} from 'lucide-react'

const COMPONENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  gateway: Server,
  dashboard: Terminal,
  storage: Database,
  platforms: Wifi,
  memory: MemoryStick,
  disk: HardDrive,
  cpu: Cpu,
}

export function SystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())

  const loadStatus = useCallback(async () => {
    try {
      const data = await api.getSystemStatus()
      setStatus(data)
      setLastRefreshedAt(new Date())
    } catch (err) {
      console.error('Falha ao obter telemetria do sistema:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 20000)
    return () => clearInterval(interval)
  }, [loadStatus])

  const handleRefresh = () => {
    setRefreshing(true)
    loadStatus()
  }

  if (loading && !status) {
    return <LoadingScreen />
  }

  const isHealthy = status?.overall === 'ok'

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-odin-graphite-800/80 pb-6">
        <div>
          <span className="font-mono text-xs font-semibold text-odin-orange-400 tracking-wider uppercase">
            <DecryptedText text="TELEMETRIA DO CORE" speed={30} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-odin-graphite-50 tracking-tight mt-1 flex items-center gap-3">
            <Radio className="w-6 h-6 text-odin-orange-400" />
            Diagnóstico e Telemetria
          </h1>
          <p className="font-mono text-xs text-odin-graphite-400 mt-1">
            Status verificado dos subsistemas, links neurais e componentes registrados.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-ghost font-mono text-xs flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin text-odin-orange-400')} />
          <span>ATUALIZAR DIAGNÓSTICO</span>
        </button>
      </div>

      {/* Primary Health Banner */}
      <SpotlightCard
        className="p-6"
        spotlightColor={isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}
        borderColor={isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 font-mono">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center border',
                isHealthy
                  ? 'bg-odin-emerald-500/15 border-odin-emerald-500/30 text-odin-emerald-400 shadow-hud-glow-cyan'
                  : 'bg-odin-amber-500/20 border-odin-amber-500/40 text-odin-amber-400'
              )}
            >
              {isHealthy ? (
                <CheckCircle className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase text-odin-graphite-400 tracking-wider">
                  ESTADO GLOBAL DO SISTEMA
                </span>
                <span className="text-odin-graphite-600">·</span>
                <AgentOrb state={isHealthy ? 'completed' : 'waiting_approval'} size={14} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-odin-graphite-50 mt-0.5">
                <ShinyText
                  text={isHealthy ? 'TODOS OS SUBSISTEMAS OPERACIONAIS' : 'STATUS EM MODO DEGRADADO'}
                />
              </h2>
              <p className="text-xs text-odin-graphite-400 mt-1">
                Última consulta: {formatDate(lastRefreshedAt.toISOString())} (
                {formatRelativeTime(lastRefreshedAt.toISOString())})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs border-t md:border-t-0 md:border-l border-odin-graphite-800 pt-4 md:pt-0 md:pl-6">
            {/* Hermes Connection */}
            <div className="p-3 rounded-lg bg-odin-surface-elevated/70 border border-odin-graphite-800 min-w-[140px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-odin-graphite-400">HERMES AGENT</span>
                {status?.hermes_connected ? (
                  <Wifi className="w-3.5 h-3.5 text-odin-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-odin-crimson-400" />
                )}
              </div>
              <span
                className={cn(
                  'font-bold text-xs',
                  status?.hermes_connected ? 'text-odin-emerald-400' : 'text-odin-crimson-400'
                )}
              >
                {status?.hermes_connected ? 'ONLINE' : 'DESCONECTADO'}
              </span>
            </div>

            {/* Database Connection */}
            <div className="p-3 rounded-lg bg-odin-surface-elevated/70 border border-odin-graphite-800 min-w-[140px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-odin-graphite-400">BANCO DE DADOS</span>
                <Database className="w-3.5 h-3.5 text-odin-emerald-400" />
              </div>
              <span
                className={cn(
                  'font-bold text-xs',
                  status?.database_connected ? 'text-odin-emerald-400' : 'text-odin-crimson-400'
                )}
              >
                {status?.database_connected ? 'CONECTADO' : 'FALHA'}
              </span>
            </div>

            {/* Core Version */}
            <div className="p-3 rounded-lg bg-odin-surface-elevated/70 border border-odin-graphite-800 min-w-[100px]">
              <span className="text-[10px] text-odin-graphite-400 block mb-1">VERSÃO</span>
              <span className="font-bold text-xs text-odin-orange-400">
                v{status?.version || '2.4.0'}
              </span>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Component Telemetry Cards */}
      <div className="space-y-3 font-mono">
        <h3 className="text-xs font-bold text-odin-graphite-300 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-odin-orange-400" />
          Componentes Registrados na API
        </h3>

        {status?.components && Object.keys(status.components).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(status.components).map(([key, component]) => (
              <ComponentCard
                key={key}
                name={key}
                component={component}
                icon={COMPONENT_ICONS[key] || Info}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-odin-surface/80 border border-odin-graphite-800 text-xs text-odin-graphite-400">
            Nenhum componente individual detalhado reportado pelo endpoint /system/status.
          </div>
        )}
      </div>

      {/* Technical Architecture Reference (Explicitly labeled) */}
      <div className="space-y-3 font-mono pt-4 border-t border-odin-graphite-800/80">
        <h3 className="text-xs font-bold text-odin-graphite-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-odin-cyan-300" />
          Especificações da Arquitetura Ativa
        </h3>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <SpotlightCard className="p-4" spotlightColor="rgba(255, 106, 0, 0.05)">
            <span className="text-[10px] uppercase text-odin-orange-400 font-bold block mb-2">
              Gateway & Backend
            </span>
            <ul className="space-y-1.5 text-odin-graphite-300">
              <li>Framework: FastAPI 0.115+</li>
              <li>Runtime: Python 3.12+</li>
              <li>Armazenamento: SQLite (aiosqlite)</li>
              <li>Streaming: SSE / EventSource</li>
            </ul>
          </SpotlightCard>

          <SpotlightCard className="p-4" spotlightColor="rgba(103, 223, 255, 0.05)">
            <span className="text-[10px] uppercase text-odin-cyan-300 font-bold block mb-2">
              Agente Hermes
            </span>
            <ul className="space-y-1.5 text-odin-graphite-300">
              <li>Módulo: Hermes CLI / Agent Core</li>
              <li>Canal: Subprocess PTY / WS</li>
              <li>Toolsets: terminal, files, web</li>
              <li>Segurança: Handshake tokenizado</li>
            </ul>
          </SpotlightCard>

          <SpotlightCard className="p-4" spotlightColor="rgba(255, 154, 61, 0.05)">
            <span className="text-[10px] uppercase text-odin-orange-400 font-bold block mb-2">
              Interface Neural
            </span>
            <ul className="space-y-1.5 text-odin-graphite-300">
              <li>Motor: React 18 + Vite</li>
              <li>Visualizador 3D: React Three Fiber</li>
              <li>Indicadores: Thinking Orbs</li>
              <li>HUD: React Bits + Tailwind v3</li>
            </ul>
          </SpotlightCard>
        </div>
      </div>
    </div>
  )
}

function ComponentCard({
  name,
  component,
  icon: Icon,
}: {
  name: string
  component: { status: string; details?: Record<string, any> }
  icon: React.ComponentType<{ className?: string }>
}) {
  const isOk = component.status === 'ok'

  return (
    <div className="p-4 rounded-xl bg-odin-surface/90 border border-odin-graphite-800 hover:border-odin-graphite-700 transition-colors shadow-hud-panel">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border',
            isOk
              ? 'bg-odin-emerald-500/15 border-odin-emerald-500/30 text-odin-emerald-400'
              : 'bg-odin-crimson-500/15 border-odin-crimson-500/30 text-odin-crimson-400'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-bold text-xs uppercase text-odin-graphite-100 truncate">
              {name}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.2 rounded border',
                isOk
                  ? 'bg-odin-emerald-500/15 text-odin-emerald-400 border-odin-emerald-500/30'
                  : 'bg-odin-crimson-500/15 text-odin-crimson-400 border-odin-crimson-500/30'
              )}
            >
              {component.status.toUpperCase()}
            </span>
          </div>

          {component.details && Object.keys(component.details).length > 0 ? (
            <div className="mt-2 text-[10px] text-odin-graphite-400 bg-odin-black/50 p-2 rounded border border-odin-graphite-800/60 overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(component.details, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-[11px] text-odin-graphite-400 mt-1">
              Subsistema operando dentro dos parâmetros nominais.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}