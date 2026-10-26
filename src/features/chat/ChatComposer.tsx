import { useState, useRef, useEffect } from 'react'
import { Send, Square, Terminal, Loader2 } from 'lucide-react'

interface ChatComposerProps {
  onSend: (message: string) => void
  onStop: () => void
  disabled?: boolean
  isRunning?: boolean
  isStopping?: boolean
  placeholder?: string
}

export function ChatComposer({
  onSend,
  onStop,
  disabled = false,
  isRunning = false,
  isStopping = false,
  placeholder = 'Transmitir instrução ou consultar ODIN...',
}: ChatComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [text])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="w-full relative">
      <div className="relative rounded-xl bg-odin-surface/90 border border-odin-graphite-800 focus-within:border-odin-orange-500/60 focus-within:shadow-hud-glow-orange transition-all duration-150 p-2 sm:p-3 flex items-end gap-2 backdrop-blur-md">
        <div className="text-odin-orange-400 pb-2 pl-1 hidden sm:block">
          <Terminal className="w-4 h-4" />
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-odin-graphite-50 placeholder-odin-graphite-500 focus:outline-none resize-none max-h-44 min-h-[38px] py-1.5 px-1 font-sans"
        />

        <div className="flex items-center gap-1.5 pb-0.5">
          {isRunning ? (
            <button
              type="button"
              onClick={onStop}
              disabled={isStopping}
              className="btn btn-sm bg-odin-crimson-500/20 text-odin-crimson-400 border border-odin-crimson-500/40 hover:bg-odin-crimson-500/30 transition-colors"
              title="Interromper execução ativa"
            >
              {isStopping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-current" />
              )}
              <span className="hidden sm:inline font-mono text-xs">
                {isStopping ? 'Parando...' : 'Parar'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={disabled || !text.trim()}
              className="btn btn-sm bg-odin-orange-500 text-white hover:bg-odin-orange-400 active:bg-odin-orange-600 disabled:opacity-30 disabled:cursor-not-allowed font-mono tracking-wider font-semibold transition-all"
              title="Transmitir mensagem"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono text-xs">ENVIAR</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] font-mono text-odin-graphite-500">
        <span>SHIFT + ENTER PARA QUEBRA DE LINHA</span>
        <span className="text-odin-orange-400/80">CANAL SEGURO ODIN</span>
      </div>
    </div>
  )
}
