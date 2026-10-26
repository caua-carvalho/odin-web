import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Run, type Approval, type SystemStatus } from '../lib/api'
import { CoreVisualizer } from '../components/core/CoreVisualizer'
import { type CoreState } from '../components/core/core.types'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { DecryptedText } from '../components/react-bits/DecryptedText'
import { ShinyText } from '../components/react-bits/ShinyText'
import { AgentOrb } from '../components/common/AgentOrb'
import { formatRelativeTime } from '../lib/utils'
import {
  Send,
  Clock,
  Terminal,
  Activity,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Loader2,
} from 'lucide-react'

export function CommandCenterPage() {
  const navigate = useNavigate()
  const [coreState, setCoreState] = useState<CoreState>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Real data telemetry states
  const [recentRuns, setRecentRuns] = useState<Run[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loadingTelemetry, setLoadingTelemetry] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchDashboardTelemetry = async () => {
      try {
        const [runsData, approvalsData, statusData] = await Promise.all([
          api.listRuns({ page_size: 5 }).catch(() => []),
          api.listApprovals('pending').catch(() => ({ items: [] })),
          api.getSystemStatus().catch(() => null),
        ])

        if (!mounted) return

        const runs: Run[] = Array.isArray(runsData) ? runsData : runsData?.items || []
        const approvals: Approval[] = approvalsData?.items || (Array.isArray(approvalsData) ? approvalsData : [])

        setRecentRuns(runs)
        setPendingApprovals(approvals)
        setSystemStatus(statusData)

        // Dynamically compute central core state based on real system conditions
        if (approvals.length > 0) {
          setCoreState('waiting_approval')
          setStatusMessage(`${approvals.length} autorização(ões) de segurança pendente(s)`)
        } else {
          const activeRun = runs.find((r) => r.status === 'running' || r.status === 'queued')
          if (activeRun) {
            if (activeRun.status === 'running') {
              setCoreState('working')
              setStatusMessage('Agente executando tarefas em segundo plano')
            } else {
              setCoreState('queued')
              setStatusMessage('Execuções enfileiradas')
            }
          } else {
            setCoreState('idle')
            setStatusMessage('Todos os sistemas operacionais e prontos')
          }
        }
      } catch (err) {
        console.error('Failed to load command center telemetry', err)
      } finally {
        if (mounted) setLoadingTelemetry(false)
      }
    }

    fetchDashboardTelemetry()
    const interval = setInterval(fetchDashboardTelemetry, 15000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = prompt.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setCoreState('connecting')
    setStatusMessage('Estabelecendo sessão neural...')

    try {
      const conv = await api.createConversation({
        title: trimmed.slice(0, 40),
        initial_message: trimmed,
      })

      // Navigate straight to the chat session where live SSE will take over
      navigate(`/chat/${conv.id}`)
    } catch (err) {
      console.error('Falha ao despachar comando para o ODIN', err)
      setCoreState('error')
      setStatusMessage('Falha na transmissão do comando')
      setSubmitting(false)
    }
  }

  const handleSuggestedPrompt = (text: string) => {
    setPrompt(text)
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10 space-y-6">
      {/* Top Banner: Attention / Approval Alert if pending */}
      {pendingApprovals.length > 0 && (
        <div className="w-full p-3.5 rounded-xl bg-odin-amber-500/10 border border-odin-amber-500/40 flex items-center justify-between gap-4 shadow-hud-panel animate-fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-odin-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-mono text-xs font-semibold text-odin-amber-400 uppercase tracking-wide">
                Protocolo de Segurança Ativo — Autorização Requerida
              </p>
              <p className="text-xs text-odin-graphite-300">
                {pendingApprovals.length} operação(ões) crítica(s) de ferramenta aguardando validação do operador.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/activity')}
            className="btn btn-sm bg-odin-amber-500/20 text-odin-amber-400 border border-odin-amber-500/40 hover:bg-odin-amber-500/30"
          >
            <span>Examinar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Peripheral HUD left, Holographic Core center, HUD right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1">
        {/* Left Telemetry HUD Panel */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          <SpotlightCard className="p-4" spotlightColor="rgba(255, 106, 0, 0.08)">
            <div className="flex items-center justify-between border-b border-odin-graphite-800/80 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-odin-graphite-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-odin-orange-400" />
                Telemetria do Nó
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-odin-emerald-400" />
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-odin-graphite-400">
                <span>GATEWAY:</span>
                <span className={systemStatus?.hermes_connected ? 'text-odin-emerald-400 font-semibold' : 'text-odin-crimson-400'}>
                  {systemStatus?.hermes_connected ? 'HERMES V0.22' : 'DESCONECTADO'}
                </span>
              </div>
              <div className="flex justify-between items-center text-odin-graphite-400">
                <span>ESTADO DO BANCO:</span>
                <span className={systemStatus?.database_connected ? 'text-odin-emerald-400' : 'text-odin-crimson-400'}>
                  {systemStatus?.database_connected ? 'ONLINE' : 'FALHA'}
                </span>
              </div>
              <div className="flex justify-between items-center text-odin-graphite-400">
                <span>SAÚDE GLOBAL:</span>
                <span className="text-odin-graphite-200 uppercase">
                  {systemStatus?.overall || 'OK'}
                </span>
              </div>
              <div className="flex justify-between items-center text-odin-graphite-400">
                <span>VERSÃO CORE:</span>
                <span className="text-odin-graphite-300">{systemStatus?.version || '2.4.0'}</span>
              </div>
            </div>
          </SpotlightCard>

          {/* Quick Metrics */}
          <SpotlightCard className="p-4" spotlightColor="rgba(103, 223, 255, 0.08)" borderColor="rgba(103, 223, 255, 0.25)">
            <div className="flex items-center justify-between border-b border-odin-graphite-800/80 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-odin-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-odin-cyan-300" />
                Vetor Operacional
              </span>
              <AgentOrb state={coreState} size={16} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-odin-surface-elevated/50 border border-odin-graphite-800/80">
                <span className="block text-lg font-bold text-odin-orange-400">
                  {recentRuns.length}
                </span>
                <span className="text-[10px] text-odin-graphite-400 uppercase tracking-wide">
                  Execuções
                </span>
              </div>
              <div className="p-2 rounded-lg bg-odin-surface-elevated/50 border border-odin-graphite-800/80">
                <span className="block text-lg font-bold text-odin-amber-400">
                  {pendingApprovals.length}
                </span>
                <span className="text-[10px] text-odin-graphite-400 uppercase tracking-wide">
                  Aprovações
                </span>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Central Protagonist: 3D Holographic Core Visualizer */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2 py-4 sm:py-8">
          <div className="text-center mb-2">
            <span className="font-mono text-xs tracking-widest text-odin-orange-400/90 uppercase font-semibold">
              <DecryptedText text="SISTEMA NEURAL ATIVO" speed={40} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-odin-graphite-50 mt-1">
              <ShinyText text="ODIN COMMAND CORE" />
            </h1>
          </div>

          <CoreVisualizer
            state={coreState}
            statusText={statusMessage}
            size="xl"
            showStatusBadge={true}
          />
        </div>

        {/* Right HUD Panel: Recent Agent Activity */}
        <div className="lg:col-span-3 space-y-4 order-3">
          <SpotlightCard className="p-4" spotlightColor="rgba(255, 106, 0, 0.08)">
            <div className="flex items-center justify-between border-b border-odin-graphite-800/80 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-odin-graphite-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-odin-orange-400" />
                Atividades Recentes
              </span>
              <button
                onClick={() => navigate('/activity')}
                className="text-[11px] font-mono text-odin-orange-400 hover:text-odin-orange-300 transition-colors"
              >
                Ver tudo
              </button>
            </div>

            {loadingTelemetry ? (
              <div className="py-6 flex items-center justify-center text-odin-graphite-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="font-mono text-xs">Sincronizando...</span>
              </div>
            ) : recentRuns.length === 0 ? (
              <div className="py-6 text-center text-odin-graphite-500 font-mono text-xs">
                Nenhuma execução registrada no histórico.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRuns.slice(0, 4).map((run) => (
                  <div
                    key={run.id}
                    onClick={() => navigate(`/chat/${run.conversation_id}`)}
                    className="p-2 rounded-lg bg-odin-surface-elevated/40 hover:bg-odin-surface-elevated/80 border border-odin-graphite-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-odin-graphite-400">
                        {run.started_at ? formatRelativeTime(run.started_at) : 'recente'}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                          run.status === 'completed'
                            ? 'text-odin-emerald-400 bg-odin-emerald-500/10'
                            : run.status === 'failed'
                            ? 'text-odin-crimson-400 bg-odin-crimson-500/10'
                            : run.status === 'running'
                            ? 'text-odin-orange-400 bg-odin-orange-500/10 animate-pulse'
                            : 'text-odin-graphite-400 bg-odin-graphite-800/40'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <p className="text-xs text-odin-graphite-200 mt-1 font-mono truncate">
                      {run.result_summary || `Run ${run.id.slice(0, 8)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>

          {/* Quick Shortcuts */}
          <div className="flex flex-col gap-1.5 font-mono text-xs">
            <span className="text-[10px] text-odin-graphite-500 uppercase tracking-widest px-1">
              Diretrizes de Ação Rápida
            </span>
            <button
              onClick={() => handleSuggestedPrompt('Status geral da infraestrutura e diagnóstico dos agentes')}
              className="px-3 py-2 rounded-lg bg-odin-surface/60 hover:bg-odin-surface-elevated border border-odin-graphite-800 text-left text-odin-graphite-300 hover:text-odin-orange-400 transition-colors flex items-center justify-between"
            >
              <span>Diagnóstico de Sistema</span>
              <Sparkles className="w-3.5 h-3.5 text-odin-orange-400 opacity-60" />
            </button>
            <button
              onClick={() => handleSuggestedPrompt('Listar tarefas pendentes e sincronizações programadas')}
              className="px-3 py-2 rounded-lg bg-odin-surface/60 hover:bg-odin-surface-elevated border border-odin-graphite-800 text-left text-odin-graphite-300 hover:text-odin-orange-400 transition-colors flex items-center justify-between"
            >
              <span>Verificar Agendamentos</span>
              <Sparkles className="w-3.5 h-3.5 text-odin-cyan-300 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Region: Command Interface */}
      <div className="w-full max-w-3xl mx-auto pt-2">
        <form onSubmit={handleCommandSubmit} className="relative">
          <div className="relative flex items-center rounded-xl bg-odin-surface/90 border border-odin-orange-500/40 shadow-hud-glow-orange focus-within:border-odin-orange-400 transition-all duration-200">
            <div className="pl-4 pr-2 text-odin-orange-400 flex items-center">
              <Terminal className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Transmitir diretriz ou comando para ODIN..."
              disabled={submitting}
              className="w-full bg-transparent py-3.5 px-2 text-sm text-odin-graphite-50 placeholder-odin-graphite-500 focus:outline-none font-mono"
            />

            <div className="pr-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting || !prompt.trim()}
                className="btn btn-sm bg-odin-orange-500 text-white hover:bg-odin-orange-400 active:bg-odin-orange-600 disabled:opacity-30 disabled:cursor-not-allowed font-mono tracking-wider font-semibold"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>ENVIAR</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 px-2 text-[11px] font-mono text-odin-graphite-500">
          <span>INTERFACE NEURAL ODIN · V2</span>
          <span>PRESSIONE ENTER PARA DISPARAR</span>
        </div>
      </div>
    </div>
  )
}
