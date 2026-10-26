import { useState } from 'react'
import { ApprovalCard, choiceLabel } from './types'
import { ShieldAlert, Terminal, Loader2, Check, X } from 'lucide-react'

interface ApprovalCardViewProps {
  card: ApprovalCard
  onResolve: (approvalId: string, choice?: string) => Promise<void>
  disabled?: boolean
}

export function ApprovalCardView({ card, onResolve, disabled = false }: ApprovalCardViewProps) {
  const [submittingChoice, setSubmittingChoice] = useState<string | null>(null)

  const handleAction = async (choice: string) => {
    if (disabled || submittingChoice) return
    setSubmittingChoice(choice)
    try {
      await onResolve(card.approval_id, choice)
    } finally {
      setSubmittingChoice(null)
    }
  }

  return (
    <div className="rounded-xl border border-odin-amber-500/50 bg-odin-amber-500/10 p-4 font-mono shadow-hud-panel my-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-odin-amber-500/20 text-odin-amber-400 flex-shrink-0">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-odin-amber-400">
              Autorização Requerida · Protocolo de Ação
            </h4>
            <span className="text-[10px] text-odin-graphite-400">
              ID: {card.approval_id.slice(0, 8)}
            </span>
          </div>

          <p className="text-sm font-semibold text-odin-graphite-100 mt-1">
            {card.operation}
          </p>

          {card.description && (
            <p className="text-xs text-odin-graphite-300 mt-1 leading-relaxed">
              {card.description}
            </p>
          )}

          {card.command && (
            <div className="mt-2.5">
              <div className="text-[10px] uppercase text-odin-graphite-400 mb-1 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-odin-amber-400" /> Comando a ser executado:
              </div>
              <pre className="p-2 rounded bg-odin-black/70 border border-odin-amber-500/30 text-odin-amber-300 overflow-x-auto text-xs leading-relaxed">
                {card.command}
              </pre>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {card.choices.map((choice) => {
              const isDeny = choice === 'deny'
              const isSubmitting = submittingChoice === choice

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={disabled || Boolean(submittingChoice)}
                  onClick={() => handleAction(choice)}
                  className={`btn btn-sm text-xs font-mono tracking-wide ${
                    isDeny
                      ? 'btn-danger'
                      : 'bg-odin-amber-500 text-black hover:bg-odin-amber-400 font-semibold'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isDeny ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{choiceLabel(choice)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
