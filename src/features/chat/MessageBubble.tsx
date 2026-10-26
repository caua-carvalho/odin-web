import { useState } from 'react'
import { type Message } from '../../lib/api'
import { mergePersistedTools, ToolActivity } from './types'
import { ToolCard } from './ToolCard'
import { formatRelativeTime } from '../../lib/utils'
import { Bot, User, Clock, Copy, Check } from 'lucide-react'

export function QueuedBubble({ position }: { position?: number }) {
  return (
    <div className="flex gap-3 justify-start my-3 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-odin-surface border border-odin-graphite-800 flex items-center justify-center text-odin-graphite-400 flex-shrink-0">
        <Clock className="w-4 h-4 animate-pulse" />
      </div>
      <div className="p-3 rounded-xl bg-odin-surface-elevated/40 border border-odin-graphite-800/80 font-mono text-xs text-odin-graphite-400">
        <p className="font-semibold text-odin-graphite-300">
          Mensagem na fila de execução {position ? `(Posição #${position})` : ''}
        </p>
        <p className="text-[11px] text-odin-graphite-500 mt-0.5">
          Aguardando conclusão do processo em andamento...
        </p>
      </div>
    </div>
  )
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const [copied, setCopied] = useState(false)

  const tools: ToolActivity[] = !isUser
    ? mergePersistedTools(message.tool_calls, message.tool_results)
    : []

  const handleCopy = () => {
    if (!message.content) return
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isSystem) {
    return (
      <div className="flex justify-center my-2 text-center">
        <span className="font-mono text-[11px] text-odin-graphite-500 bg-odin-surface/40 px-3 py-1 rounded-full border border-odin-graphite-800/40">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 my-4 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-odin-orange-500/15 border border-odin-orange-500/40 flex items-center justify-center text-odin-orange-400 flex-shrink-0 mt-0.5 shadow-hud-glow-orange">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1 font-mono text-[10px] text-odin-graphite-500">
          <span className="uppercase font-semibold tracking-wider">
            {isUser ? 'OPERADOR' : 'ODIN NEURAL'}
          </span>
          <span>·</span>
          <span>{formatRelativeTime(message.created_at)}</span>
        </div>

        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${
            isUser
              ? 'bg-odin-surface-elevated border border-odin-cyan-300/30 text-odin-graphite-100 rounded-tr-sm shadow-hud-panel'
              : 'bg-odin-surface/90 border border-odin-graphite-800 text-odin-graphite-100 rounded-tl-sm shadow-hud-panel backdrop-blur-sm'
          }`}
        >
          {/* Persisted Tools if any */}
          {tools.length > 0 && (
            <div className="mb-3 space-y-1 w-full">
              {tools.map((tool) => (
                <ToolCard key={tool.call_id} tool={tool} />
              ))}
            </div>
          )}

          {/* Message text content */}
          <div className="whitespace-pre-wrap font-sans break-words selection:bg-odin-orange-500/30">
            {message.content}
          </div>

          {/* Quick copy hover button for assistant responses */}
          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded bg-odin-surface-elevated/80 border border-odin-graphite-800 text-odin-graphite-400 hover:text-odin-orange-400 opacity-0 group-hover:opacity-100 transition-all duration-150"
              title="Copiar resposta"
              aria-label="Copiar resposta"
            >
              {copied ? <Check className="w-3 h-3 text-odin-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-odin-surface border border-odin-cyan-300/40 flex items-center justify-center text-odin-cyan-300 flex-shrink-0 mt-0.5 shadow-hud-glow-cyan">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
