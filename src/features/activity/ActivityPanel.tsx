import { useState, useEffect, useCallback } from 'react'
import { api, type Run, type Approval } from '../../lib/api'
import { cn, formatDate } from '../../lib/utils'
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Check,
  X,
  ChevronDown,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react'

const RUN_STATUS_CONFIG = {
  queued: { label: 'NA FILA', color: 'text-odin-graphite-400', bg: 'bg-odin-graphite-800/60 border-odin-graphite-700', icon: Clock },
  running: { label: 'EXECUTANDO', color: 'text-odin-orange-400', bg: 'bg-odin-orange-500/15 border-odin-orange-500/40 shadow-hud-glow-orange', icon: Loader2 },
  waiting_approval: { label: 'APROVAÇÃO', color: 'text-odin-amber-400', bg: 'bg-odin-amber-500/20 border-odin-amber-500/50', icon: AlertTriangle },
  completed: { label: 'CONCLUÍDO', color: 'text-odin-emerald-400', bg: 'bg-odin-emerald-500/15 border-odin-emerald-500/30', icon: CheckCircle },
  failed: { label: 'FALHOU', color: 'text-odin-crimson-400', bg: 'bg-odin-crimson-500/15 border-odin-crimson-500/30', icon: XCircle },
  cancelled: { label: 'CANCELADO', color: 'text-odin-graphite-400', bg: 'bg-odin-graphite-800/60 border-odin-graphite-700', icon: XCircle },
  interrupted: { label: 'INTERROMPIDO', color: 'text-odin-graphite-400', bg: 'bg-odin-graphite-800/60 border-odin-graphite-700', icon: Zap },
} as const

interface ActivityPanelProps {
  onApprovalsCountChange?: (count: number) => void
}

export function ActivityPanel({ onApprovalsCountChange }: ActivityPanelProps) {
  const [runs, setRuns] = useState<Run[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'runs' | 'approvals'>('runs')
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [runsData, approvalsData] = await Promise.all([
        api.listRuns({ page_size: 30 }).catch(() => []),
        api.listApprovals().catch(() => ({ items: [] })),
      ])
      const runsList: Run[] = Array.isArray(runsData) ? runsData : runsData?.items || []
      const approvalsList: Approval[] = approvalsData?.items || (Array.isArray(approvalsData) ? approvalsData : [])
      setRuns(runsList)
      setApprovals(approvalsList)

      const pending = approvalsList.filter((a) => a.status === 'pending').length
      if (onApprovalsCountChange) onApprovalsCountChange(pending)
    } catch (err) {
      console.error('Falha ao carregar auditoria:', err)
    } finally {
      setLoading(false)
    }
  }, [onApprovalsCountChange])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 12000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleApprove = async (approvalId: string) => {
    try {
      await api.approve(approvalId)
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: 'approved' as const } : a))
      )
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao autorizar')
    }
  }

  const handleDeny = async (approvalId: string) => {
    try {
      await api.deny(approvalId)
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: 'denied' as const } : a))
      )
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao negar')
    }
  }

  const pendingApprovals = approvals.filter((a) => a.status === 'pending')

  return (
    <div className="w-full h-full flex flex-col p-3 font-mono text-xs space-y-3 relative overflow-hidden">
      {/* Sub tabs and refresh */}
      <div className="flex items-center justify-between border-b border-odin-graphite-800 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('runs')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
              activeTab === 'runs'
                ? 'bg-odin-orange-500/15 text-odin-orange-400 border border-odin-orange-500/30'
                : 'text-odin-graphite-400 hover:text-odin-graphite-100'
            )}
          >
            EXECUÇÕES ({runs.length})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'approvals'
                ? 'bg-odin-orange-500/15 text-odin-orange-400 border border-odin-orange-500/30'
                : 'text-odin-graphite-400 hover:text-odin-graphite-100'
            )}
          >
            <span>AUTORIZAÇÕES</span>
            {pendingApprovals.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-odin-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-1 rounded text-odin-graphite-400 hover:text-odin-orange-400"
          title="Recarregar"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="py-8 text-center text-odin-graphite-500">
            Sincronizando auditoria de eventos...
          </div>
        ) : activeTab === 'runs' ? (
          runs.length === 0 ? (
            <div className="py-8 text-center text-odin-graphite-500">
              Nenhuma execução registrada.
            </div>
          ) : (
            runs.map((run) => {
              const statusConfig = RUN_STATUS_CONFIG[run.status] || RUN_STATUS_CONFIG.queued
              const StatusIcon = statusConfig.icon
              const isExpanded = expandedRun === run.id

              return (
                <div
                  key={run.id}
                  className="rounded-lg border border-odin-graphite-800 bg-odin-surface overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                    className="w-full p-2.5 flex items-center justify-between text-left hover:bg-odin-surface-elevated/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn('p-1 rounded border', statusConfig.bg)}>
                        <StatusIcon className={cn('w-3.5 h-3.5', statusConfig.color)} />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-xs text-odin-graphite-100 truncate block">
                          RUN_{run.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-odin-graphite-500 block">
                          {formatDate(run.started_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.2 rounded border',
                          statusConfig.bg,
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                      <ChevronDown
                        className={cn('w-3.5 h-3.5 text-odin-graphite-500 transition-transform', isExpanded && 'rotate-180')}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-2.5 border-t border-odin-graphite-800 bg-odin-black/50 text-[11px] space-y-1.5">
                      {run.result_summary && (
                        <p className="text-odin-graphite-200 whitespace-pre-wrap leading-relaxed">
                          {run.result_summary}
                        </p>
                      )}
                      {run.error && (
                        <p className="text-odin-crimson-400 whitespace-pre-wrap">
                          {run.error}
                        </p>
                      )}
                      <div className="text-[10px] text-odin-graphite-500 pt-1">
                        Total de eventos registrados: {run.events?.length || 0}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )
        ) : approvals.length === 0 ? (
          <div className="py-8 text-center text-odin-graphite-500">
            Nenhuma autorização pendente.
          </div>
        ) : (
          approvals.map((approval) => {
            const isPending = approval.status === 'pending'
            return (
              <div
                key={approval.id}
                className={`p-3 rounded-lg border transition-all ${
                  isPending
                    ? 'bg-odin-amber-500/10 border-odin-amber-500/40'
                    : 'bg-odin-surface border-odin-graphite-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className={`w-3.5 h-3.5 ${isPending ? 'text-odin-amber-400' : 'text-odin-graphite-400'}`} />
                    <span className="font-bold text-xs text-odin-graphite-100">
                      {approval.operation}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      isPending ? 'bg-odin-amber-500/20 text-odin-amber-400' : 'text-odin-graphite-500'
                    }`}
                  >
                    {approval.status}
                  </span>
                </div>

                <p className="text-[11px] text-odin-graphite-400 mt-1 break-all">
                  {JSON.stringify(approval.details).slice(0, 120)}
                </p>

                {isPending && (
                  <div className="mt-2.5 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDeny(approval.id)}
                      className="btn btn-sm btn-danger py-0.5 px-2 text-[10px]"
                    >
                      <X className="w-3 h-3" />
                      <span>Negar</span>
                    </button>
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="btn btn-sm bg-odin-amber-500 text-black font-bold py-0.5 px-2 text-[10px]"
                    >
                      <Check className="w-3 h-3" />
                      <span>Autorizar</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
