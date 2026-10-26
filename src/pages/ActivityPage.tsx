import { useState, useEffect } from 'react'
import { api, type Run, type Approval, type RunEvent } from '../lib/api'
import { cn, formatDate } from '../lib/utils'
import { LoadingScreen } from '../components/LoadingScreen'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { DecryptedText } from '../components/react-bits/DecryptedText'
import { AgentOrb } from '../components/common/AgentOrb'
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  FileText,
  Check,
  X,
  ChevronDown,
  Zap,
  Shield,
  Activity,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'

const RUN_STATUS_CONFIG = {
  queued: { label: 'NA FILA', color: 'text-odin-graphite-400', bg: 'bg-odin-graphite-800/60 border-odin-graphite-700', icon: Clock },
  running: { label: 'EXECUTANDO', color: 'text-odin-orange-400', bg: 'bg-odin-orange-500/15 border-odin-orange-500/40 shadow-hud-glow-orange', icon: Loader2 },
  waiting_approval: { label: 'APROVAÇÃO REQUERIDA', color: 'text-odin-amber-400', bg: 'bg-odin-amber-500/20 border-odin-amber-500/50', icon: AlertTriangle },
  completed: { label: 'CONCLUÍDO', color: 'text-odin-emerald-400', bg: 'bg-odin-emerald-500/15 border-odin-emerald-500/30', icon: CheckCircle },
  failed: { label: 'FALHOU', color: 'text-odin-crimson-400', bg: 'bg-odin-crimson-500/15 border-odin-crimson-500/30', icon: XCircle },
  cancelled: { label: 'CANCELADO', color: 'text-odin-graphite-400', bg: 'bg-odin-graphite-800/60 border-odin-graphite-700', icon: XCircle },
  interrupted: { label: 'INTERROMPIDO', color: 'text-odin-graphite-400', bg: 'bg-odin-graphite-800/60 border-odin-graphite-700', icon: Zap },
} as const

const APPROVAL_STATUS_CONFIG = {
  pending: { label: 'PENDENTE', color: 'text-odin-amber-400', bg: 'bg-odin-amber-500/20 border-odin-amber-500/50', icon: Clock },
  approved: { label: 'AUTORIZADO', color: 'text-odin-emerald-400', bg: 'bg-odin-emerald-500/15 border-odin-emerald-500/30', icon: CheckCircle },
  denied: { label: 'NEGADO', color: 'text-odin-crimson-400', bg: 'bg-odin-crimson-500/15 border-odin-crimson-500/30', icon: XCircle },
  expired: { label: 'EXPIRADO', color: 'text-odin-graphite-500', bg: 'bg-odin-graphite-800/60 border-odin-graphite-700', icon: Clock },
} as const

function getStatusConfig(status: Run['status']) {
  return RUN_STATUS_CONFIG[status] || RUN_STATUS_CONFIG.queued
}

function getApprovalStatusConfig(status: Approval['status']) {
  return APPROVAL_STATUS_CONFIG[status] || APPROVAL_STATUS_CONFIG.pending
}

export function ActivityPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'runs' | 'approvals'>('runs')
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [runsData, approvalsData] = await Promise.all([
        api.listRuns({ page_size: 50 }).catch(() => []),
        api.listApprovals().catch(() => ({ items: [] })),
      ])
      const runsList: Run[] = Array.isArray(runsData) ? runsData : runsData?.items || []
      const approvalsList: Approval[] = approvalsData?.items || (Array.isArray(approvalsData) ? approvalsData : [])
      setRuns(runsList)
      setApprovals(approvalsList)
    } catch (err) {
      console.error('Falha ao carregar telemetria de execuções:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleApprove = async (approvalId: string) => {
    try {
      await api.approve(approvalId)
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: 'approved' as const } : a))
      )
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao aprovar operação')
    }
  }

  const handleDeny = async (approvalId: string) => {
    try {
      await api.deny(approvalId)
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: 'denied' as const } : a))
      )
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao negar operação')
    }
  }

  const toggleRunExpand = (runId: string) => {
    setExpandedRun((prev) => (prev === runId ? null : runId))
  }

  if (loading && runs.length === 0 && approvals.length === 0) {
    return <LoadingScreen />
  }

  const pendingCount = approvals.filter((a) => a.status === 'pending').length

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-odin-graphite-800/80 pb-6">
        <div>
          <span className="font-mono text-xs font-semibold text-odin-orange-400 tracking-wider uppercase">
            <DecryptedText text="AUDITORIA DE EXECUÇÕES" speed={30} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-odin-graphite-50 tracking-tight mt-1 flex items-center gap-3">
            <Activity className="w-6 h-6 text-odin-orange-400" />
            <span>Atividade Operacional</span>
            <AgentOrb state={runs.some((r) => r.status === 'running') ? 'working' : 'idle'} size={20} />
          </h1>
          <p className="font-mono text-xs text-odin-graphite-400 mt-1">
            Registro cronológico das execuções do agente, invocações de ferramentas e autorizações.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-ghost font-mono text-xs flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin text-odin-orange-400')} />
          <span>ATUALIZAR</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-odin-graphite-800 pb-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab('runs')}
          className={cn(
            'px-4 py-2 rounded-lg font-semibold tracking-wider transition-all border',
            activeTab === 'runs'
              ? 'bg-odin-orange-500/15 border-odin-orange-500/40 text-odin-orange-400 shadow-hud-glow-orange'
              : 'border-transparent text-odin-graphite-400 hover:text-odin-graphite-100 hover:bg-odin-surface-elevated'
          )}
        >
          EXECUÇÕES DO AGENTE ({runs.length})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={cn(
            'px-4 py-2 rounded-lg font-semibold tracking-wider transition-all border relative flex items-center gap-2',
            activeTab === 'approvals'
              ? 'bg-odin-orange-500/15 border-odin-orange-500/40 text-odin-orange-400 shadow-hud-glow-orange'
              : 'border-transparent text-odin-graphite-400 hover:text-odin-graphite-100 hover:bg-odin-surface-elevated'
          )}
        >
          <span>AUTORIZAÇÕES</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-odin-amber-500 text-black font-bold text-[10px] animate-pulse">
              {pendingCount} PENDENTE{pendingCount > 1 ? 'S' : ''}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'runs' && (
          <RunsList
            runs={runs}
            expandedRun={expandedRun}
            onToggleExpand={toggleRunExpand}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsList
            approvals={approvals}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        )}
      </div>
    </div>
  )
}

function RunsList({
  runs,
  expandedRun,
  onToggleExpand,
}: {
  runs: Run[]
  expandedRun: string | null
  onToggleExpand: (runId: string) => void
}) {
  if (runs.length === 0) {
    return (
      <SpotlightCard className="p-12 text-center text-odin-graphite-500 font-mono">
        <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30 text-odin-orange-400" />
        <h3 className="text-sm font-semibold text-odin-graphite-300">
          NENHUMA EXECUÇÃO REGISTRADA
        </h3>
        <p className="text-xs text-odin-graphite-500 mt-1">
          Inicie uma diretriz no Command Center ou no Chat para gerar execuções.
        </p>
      </SpotlightCard>
    )
  }

  return (
    <div className="space-y-3 font-mono">
      {runs.map((run) => {
        const statusConfig = getStatusConfig(run.status)
        const StatusIcon = statusConfig.icon
        const isExpanded = expandedRun === run.id
        const events = run.events || []

        const duration =
          run.started_at && run.completed_at
            ? Math.round(
                (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) /
                  1000
              )
            : null

        return (
          <div key={run.id} className="group">
            <button
              onClick={() => onToggleExpand(run.id)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border bg-odin-surface/90 hover:bg-odin-surface-elevated/90 transition-all text-left shadow-hud-panel',
                isExpanded ? 'border-odin-orange-500/40' : 'border-odin-graphite-800'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border',
                  statusConfig.bg
                )}
              >
                <StatusIcon className={cn('w-5 h-5', statusConfig.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-odin-graphite-100 truncate">
                    RUN_{run.id.slice(0, 8)}
                  </span>
                  <span className="text-odin-graphite-600">·</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                      statusConfig.bg,
                      statusConfig.color
                    )}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-[11px] text-odin-graphite-400 truncate mt-1">
                  Iniciado em {formatDate(run.started_at)}
                  {run.conversation_id && ` · Sessão ${run.conversation_id.slice(0, 8)}`}
                </p>
              </div>

              <div className="flex items-center gap-3 text-odin-graphite-400 flex-shrink-0">
                {duration !== null && (
                  <span className="text-xs text-odin-graphite-400 bg-odin-surface-elevated px-2 py-0.5 rounded border border-odin-graphite-800">
                    {duration}s
                  </span>
                )}
                <ChevronDown
                  className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180 text-odin-orange-400')}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="mt-2 p-4 bg-odin-surface-elevated/60 rounded-xl border border-odin-graphite-800 space-y-3 animate-slide-down">
                {run.result_summary && (
                  <div className="p-3 bg-odin-black/70 rounded-lg border border-odin-graphite-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-odin-graphite-500 block mb-1">
                      Resumo da Execução:
                    </span>
                    <p className="text-xs text-odin-graphite-200 whitespace-pre-wrap leading-relaxed">
                      {run.result_summary}
                    </p>
                  </div>
                )}

                {run.error && (
                  <div className="p-3 bg-odin-crimson-500/10 rounded-lg border border-odin-crimson-500/30">
                    <span className="text-[10px] uppercase tracking-wider text-odin-crimson-400 block mb-1">
                      Log de Falha:
                    </span>
                    <p className="text-xs text-odin-crimson-300 whitespace-pre-wrap">
                      {run.error}
                    </p>
                  </div>
                )}

                {events.length > 0 ? (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[10px] uppercase tracking-wider text-odin-graphite-500 mb-2">
                      Sequência de Eventos ({events.length})
                    </div>
                    {events.map((event, idx) => (
                      <EventRow key={idx} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-odin-graphite-500 py-2">
                    Nenhum sub-evento detalhado registrado para esta execução.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EventRow({ event }: { event: RunEvent }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    token: MessageSquare,
    tool_call: Terminal,
    tool_result: FileText,
    approval_requested: Shield,
    run_completed: CheckCircle,
    run_failed: XCircle,
    run_cancelled: XCircle,
  }
  const Icon = icons[event.type] || MessageSquare

  return (
    <div className="flex items-start gap-2.5 p-2 rounded bg-odin-surface/80 border border-odin-graphite-800/70 text-xs">
      <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-odin-orange-400" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] text-odin-graphite-500">
            {formatDate(event.timestamp)}
          </span>
          <span className="text-odin-orange-400/90 font-bold text-[10px] uppercase">
            {event.type}
          </span>
        </div>
        <pre className="text-odin-graphite-400 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
          {JSON.stringify(event.data, null, 2).slice(0, 350)}
        </pre>
      </div>
    </div>
  )
}

function ApprovalsList({
  approvals,
  onApprove,
  onDeny,
}: {
  approvals: Approval[]
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}) {
  const pendingApprovals = approvals.filter((a) => a.status === 'pending')
  const resolvedApprovals = approvals.filter((a) => a.status !== 'pending')

  if (approvals.length === 0) {
    return (
      <SpotlightCard className="p-12 text-center text-odin-graphite-500 font-mono">
        <Shield className="w-10 h-10 mx-auto mb-3 opacity-30 text-odin-amber-400" />
        <h3 className="text-sm font-semibold text-odin-graphite-300">
          NENHUMA AUTORIZAÇÃO PENDENTE
        </h3>
        <p className="text-xs text-odin-graphite-500 mt-1">
          Operações críticas protegidas que exigirem autorização humana serão listadas aqui.
        </p>
      </SpotlightCard>
    )
  }

  return (
    <div className="space-y-6 font-mono">
      {pendingApprovals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-odin-amber-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-odin-amber-400 animate-pulse" />
            Autorizações Críticas Pendentes ({pendingApprovals.length})
          </div>
          <div className="space-y-3">
            {pendingApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={onApprove}
                onDeny={onDeny}
              />
            ))}
          </div>
        </section>
      )}

      {resolvedApprovals.length > 0 && (
        <section className="space-y-3 pt-4">
          <div className="text-xs font-bold text-odin-graphite-400 uppercase tracking-wider">
            Histórico de Decisões ({resolvedApprovals.length})
          </div>
          <div className="space-y-2">
            {resolvedApprovals.slice(0, 15).map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={onApprove}
                onDeny={onDeny}
                readonly
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ApprovalCard({
  approval,
  onApprove,
  onDeny,
  readonly = false,
}: {
  approval: Approval
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  readonly?: boolean
}) {
  const statusConfig = getApprovalStatusConfig(approval.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="p-4 rounded-xl bg-odin-surface/90 border border-odin-graphite-800 hover:border-odin-amber-500/40 transition-all shadow-hud-panel">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border',
            statusConfig.bg
          )}
        >
          <StatusIcon className={cn('w-5 h-5', statusConfig.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-odin-graphite-100">{approval.operation}</span>
            <span className="text-odin-graphite-600">·</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                statusConfig.bg,
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </span>
          </div>

          <p className="text-xs text-odin-graphite-300 mt-1 font-mono break-all leading-relaxed">
            {JSON.stringify(approval.details, null, 2).slice(0, 200)}
          </p>

          <p className="text-[10px] text-odin-graphite-500 mt-2">
            Emitido em {formatDate(approval.created_at)}
            {approval.expires_at && ` · Limite: ${formatDate(approval.expires_at)}`}
          </p>
        </div>

        {!readonly && approval.status === 'pending' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onDeny(approval.id)}
              className="btn btn-sm btn-danger text-xs font-mono"
            >
              <X className="w-3.5 h-3.5" />
              <span>Negar</span>
            </button>
            <button
              onClick={() => onApprove(approval.id)}
              className="btn btn-sm bg-odin-amber-500 text-black hover:bg-odin-amber-400 font-mono font-bold text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Autorizar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}