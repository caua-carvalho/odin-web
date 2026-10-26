import { useState } from 'react'
import { LiveState, ApprovalCard, formatElapsed } from './types'
import { AgentOrb } from '../../components/common/AgentOrb'
import { ToolCard } from './ToolCard'
import { ApprovalCardView } from './ApprovalCardView'
import { type CoreState } from '../../components/core/core.types'
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Square,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

interface LiveAssistantProps {
  live: LiveState
  pendingApproval: ApprovalCard | null
  onResolveApproval: (approvalId: string, choice?: string) => Promise<void>
  onStop: () => void
  isStopping?: boolean
}

export function LiveAssistant({
  live,
  pendingApproval,
  onResolveApproval,
  onStop,
  isStopping = false,
}: LiveAssistantProps) {
  const [reasoningOpen, setReasoningOpen] = useState(true)

  // Map phase to CoreState for the compact AgentOrb
  const orbState: CoreState =
    live.phase === 'connecting'
      ? 'connecting'
      : live.phase === 'waiting_approval'
      ? 'waiting_approval'
      : live.phase === 'stopping'
      ? 'stopping'
      : live.phase === 'error'
      ? 'error'
      : live.phase === 'queued'
      ? 'queued'
      : live.reasoning && !live.text
      ? 'thinking'
      : live.tools.some((t) => t.status === 'running')
      ? 'working'
      : 'thinking'

  const elapsedSeconds = live.startedAt ? (Date.now() - live.startedAt) / 1000 : 0

  return (
    <div className="flex gap-3 justify-start my-4 animate-fade-in w-full">
      {/* Dynamic AgentOrb */}
      <div className="w-8 h-8 rounded-lg bg-odin-surface border border-odin-orange-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-hud-glow-orange">
        <AgentOrb state={orbState} size={20} />
      </div>

      <div className="flex-1 max-w-[85%] sm:max-w-[82%] flex flex-col items-start min-w-0">
        {/* Status Header Bar */}
        <div className="flex items-center justify-between w-full mb-1.5 px-1 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-odin-orange-400 font-semibold uppercase tracking-wider">
              ODIN NEURAL
            </span>
            <span className="text-odin-graphite-600">·</span>
            <span className="text-odin-graphite-400">
              {live.statusText || (live.phase === 'connecting' ? 'Conectando...' : 'Processando...')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {elapsedSeconds > 0 && (
              <span className="text-[10px] text-odin-graphite-500 font-mono">
                {formatElapsed(elapsedSeconds)}
              </span>
            )}
            <button
              onClick={onStop}
              disabled={isStopping}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-odin-crimson-400 hover:bg-odin-crimson-500/10 border border-odin-crimson-500/30 transition-colors disabled:opacity-50"
              title="Interromper execução"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>{isStopping ? 'Parando...' : 'Parar'}</span>
            </button>
          </div>
        </div>

        {/* Bubble Container */}
        <div className="w-full rounded-2xl rounded-tl-sm bg-odin-surface/90 border border-odin-orange-500/30 p-4 shadow-hud-panel backdrop-blur-md">
          {/* Pending Approval Priority Card */}
          {pendingApproval && (
            <ApprovalCardView
              card={pendingApproval}
              onResolve={onResolveApproval}
              disabled={isStopping}
            />
          )}

          {/* Live Reasoning Block */}
          {live.reasoning && (
            <div className="mb-3 rounded-lg border border-odin-graphite-800 bg-odin-surface-elevated/60 overflow-hidden font-mono text-xs">
              <button
                type="button"
                onClick={() => setReasoningOpen(!reasoningOpen)}
                className="w-full px-3 py-2 flex items-center justify-between bg-odin-surface-elevated/80 text-odin-graphite-300 hover:text-odin-orange-400 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-odin-orange-400 animate-pulse" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider">
                    Raciocínio Interno
                  </span>
                </div>
                {reasoningOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-odin-graphite-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-odin-graphite-400" />
                )}
              </button>

              {reasoningOpen && (
                <div className="p-3 text-[11px] leading-relaxed text-odin-graphite-400 whitespace-pre-wrap max-h-56 overflow-y-auto border-t border-odin-graphite-800/80 bg-odin-black/40">
                  {live.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Live Tools Block */}
          {live.tools.length > 0 && (
            <div className="mb-3 space-y-1">
              {live.tools.map((tool) => (
                <ToolCard key={tool.call_id} tool={tool} />
              ))}
            </div>
          )}

          {/* Streaming Text Output */}
          {live.text ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-odin-graphite-100 font-sans break-words">
              {live.text}
              <span className="inline-block w-1.5 h-4 ml-1 bg-odin-orange-400 animate-pulse align-middle" />
            </div>
          ) : !live.reasoning && live.tools.length === 0 ? (
            <div className="flex items-center gap-2 text-xs font-mono text-odin-graphite-400 py-1">
              <Sparkles className="w-3.5 h-3.5 text-odin-orange-400 animate-spin-slow" />
              <span>Sintetizando resposta neural...</span>
            </div>
          ) : null}

          {/* Error Message if any */}
          {live.error && (
            <div className="mt-3 p-2.5 rounded-lg bg-odin-crimson-500/15 border border-odin-crimson-500/40 text-odin-crimson-300 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-odin-crimson-400 flex-shrink-0" />
              <span>{live.error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
