import { useState } from 'react'
import { ToolActivity, pretty, clampText } from './types'
import {
  ChevronDown,
  ChevronUp,
  Wrench,
  Check,
  AlertTriangle,
  Loader2,
  Terminal,
} from 'lucide-react'

export function ToolCard({ tool }: { tool: ToolActivity }) {
  const [open, setOpen] = useState(false)
  const isRunning = tool.status === 'running'
  const isError = Boolean(tool.is_error || tool.error)

  const argsStr = tool.args !== undefined ? pretty(tool.args) : ''
  const hasDetails = Boolean(argsStr || tool.result || tool.error)

  return (
    <div
      className={`rounded-lg border text-xs font-mono transition-colors my-1.5 overflow-hidden ${
        isError
          ? 'border-odin-crimson-500/40 bg-odin-crimson-500/10 text-odin-crimson-300'
          : isRunning
          ? 'border-odin-orange-500/40 bg-odin-surface-elevated/70 text-odin-orange-400'
          : 'border-odin-graphite-800 bg-odin-surface/70 text-odin-graphite-300'
      }`}
    >
      <button
        type="button"
        onClick={() => hasDetails && setOpen(!open)}
        className="w-full px-3 py-2 flex items-center justify-between gap-3 text-left hover:bg-odin-surface-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-odin-orange-400 flex-shrink-0" />
          ) : isError ? (
            <AlertTriangle className="w-3.5 h-3.5 text-odin-crimson-400 flex-shrink-0" />
          ) : (
            <Check className="w-3.5 h-3.5 text-odin-emerald-400 flex-shrink-0" />
          )}

          <div className="flex items-center gap-1.5 truncate">
            <Wrench className="w-3 h-3 text-odin-graphite-400 flex-shrink-0" />
            <span className="font-semibold text-odin-graphite-100 truncate">{tool.tool}</span>
            {tool.context && (
              <span className="text-[10px] text-odin-graphite-400 truncate">({tool.context})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {typeof tool.duration_s === 'number' && (
            <span className="text-[10px] text-odin-graphite-500">{tool.duration_s.toFixed(1)}s</span>
          )}
          {hasDetails && (
            open ? <ChevronUp className="w-3.5 h-3.5 text-odin-graphite-400" /> : <ChevronDown className="w-3.5 h-3.5 text-odin-graphite-400" />
          )}
        </div>
      </button>

      {open && hasDetails && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-odin-graphite-800/60 bg-odin-black/40">
          {argsStr && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-odin-graphite-500 mb-1 flex items-center gap-1">
                <Terminal className="w-2.5 h-2.5" /> Parâmetros:
              </div>
              <pre className="p-2 rounded bg-odin-surface border border-odin-graphite-800/60 text-odin-graphite-300 overflow-x-auto text-[11px] leading-relaxed">
                {clampText(argsStr, 2000)}
              </pre>
            </div>
          )}

          {tool.result !== undefined && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-odin-graphite-500 mb-1">Resultado:</div>
              <pre className="p-2 rounded bg-odin-surface border border-odin-graphite-800/60 text-odin-graphite-200 overflow-x-auto text-[11px] leading-relaxed max-h-48">
                {clampText(tool.result, 3000)}
              </pre>
            </div>
          )}

          {tool.error && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-odin-crimson-400 mb-1">Erro:</div>
              <pre className="p-2 rounded bg-odin-crimson-500/10 border border-odin-crimson-500/30 text-odin-crimson-300 overflow-x-auto text-[11px] leading-relaxed">
                {tool.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
