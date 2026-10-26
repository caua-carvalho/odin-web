import { WindowId, WindowState, WorkspaceLayout } from './floating.types'
import { AgentOrb } from '../common/AgentOrb'
import {
  Bot,
  Library,
  Activity,
  Cpu,
  LayoutGrid,
  Columns2,
  Maximize,
  Compass,
  Terminal,
  Send,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'

interface FloatingDockProps {
  windows: Record<WindowId, WindowState>
  activeWindowId: WindowId | null
  onToggleWindow: (id: WindowId) => void
  onApplyLayout: (layout: WorkspaceLayout) => void
  onQuickCommand: (prompt: string) => void
  isDispatching?: boolean
  hasPendingApprovals?: boolean
  isChatStreaming?: boolean
}

const MODULES: { id: WindowId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'chat', label: 'Chat Neural', icon: Bot },
  { id: 'knowledge', label: 'Biblioteca', icon: Library },
  { id: 'activity', label: 'Atividade', icon: Activity },
  { id: 'system', label: 'Telemetria', icon: Cpu },
]

export function FloatingDock({
  windows,
  activeWindowId,
  onToggleWindow,
  onApplyLayout,
  onQuickCommand,
  isDispatching = false,
  hasPendingApprovals = false,
  isChatStreaming = false,
}: FloatingDockProps) {
  const [prompt, setPrompt] = useState('')
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isDispatching) return
    onQuickCommand(prompt.trim())
    setPrompt('')
  }

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none flex flex-col items-center gap-2">
      {/* Quick Layout Flyout Menu */}
      {showLayoutMenu && (
        <div className="pointer-events-auto p-2 rounded-xl bg-odin-surface/95 border border-odin-graphite-800 shadow-hud-panel backdrop-blur-xl flex items-center gap-1.5 font-mono text-xs animate-slide-up">
          <button
            onClick={() => {
              onApplyLayout('clean-core')
              setShowLayoutMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-odin-graphite-300 hover:text-odin-orange-400 hover:bg-odin-surface-elevated transition-colors"
            title="Minimizar janelas e focar no Núcleo 3D"
          >
            <Compass className="w-3.5 h-3.5 text-odin-orange-400" />
            <span>Foco no Núcleo</span>
          </button>

          <button
            onClick={() => {
              onApplyLayout('split')
              setShowLayoutMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-odin-graphite-300 hover:text-odin-orange-400 hover:bg-odin-surface-elevated transition-colors"
            title="Dispor Chat e Atividade lado a lado"
          >
            <Columns2 className="w-3.5 h-3.5 text-odin-cyan-300" />
            <span>Divisão Dupla</span>
          </button>

          <button
            onClick={() => {
              onApplyLayout('focus-chat')
              setShowLayoutMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-odin-graphite-300 hover:text-odin-orange-400 hover:bg-odin-surface-elevated transition-colors"
            title="Maximizar Chat Neural"
          >
            <Maximize className="w-3.5 h-3.5 text-odin-orange-400" />
            <span>Foco no Chat</span>
          </button>

          <button
            onClick={() => {
              onApplyLayout('default')
              setShowLayoutMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-odin-graphite-300 hover:text-odin-orange-400 hover:bg-odin-surface-elevated transition-colors"
            title="Restaurar layout padrão"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-odin-graphite-400" />
            <span>Padrão</span>
          </button>
        </div>
      )}

      {/* Main Glass Floating Dock */}
      <div className="pointer-events-auto max-w-4xl w-full flex items-center justify-between gap-3 p-2 rounded-2xl bg-odin-surface/90 border border-odin-graphite-800/90 shadow-hud-panel backdrop-blur-2xl">
        {/* Module Window Pills */}
        <div className="flex items-center gap-1.5">
          {MODULES.map((mod) => {
            const Icon = mod.icon
            const win = windows[mod.id]
            const isVisible = win.isOpen && !win.isMinimized
            const isActive = activeWindowId === mod.id && isVisible

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onToggleWindow(mod.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs transition-all border ${
                  isActive
                    ? 'bg-odin-orange-500/20 text-odin-orange-400 border-odin-orange-500/50 shadow-hud-glow-orange font-semibold'
                    : isVisible
                    ? 'bg-odin-surface-elevated text-odin-graphite-100 border-odin-graphite-700'
                    : 'bg-odin-surface/40 text-odin-graphite-400 border-transparent hover:text-odin-graphite-100 hover:bg-odin-surface-elevated/80'
                }`}
                title={isVisible ? `Minimizar ${mod.label}` : `Abrir ${mod.label}`}
              >
                {mod.id === 'chat' && isChatStreaming ? (
                  <AgentOrb state="thinking" size={16} />
                ) : (
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-odin-orange-400' : 'text-odin-graphite-400'}`} />
                )}

                <span className="hidden sm:inline">{mod.label}</span>

                {/* Attention badges */}
                {mod.id === 'activity' && hasPendingApprovals && (
                  <span className="w-2 h-2 rounded-full bg-odin-amber-400 animate-pulse ml-0.5" />
                )}

                {/* Minimized / Open Indicator */}
                {win.isOpen && (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      win.isMinimized ? 'bg-odin-graphite-500' : 'bg-odin-orange-400'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Integrated Quick Direct Prompt Command Bar */}
        <form onSubmit={handleCommandSubmit} className="flex-1 max-w-sm hidden md:flex items-center">
          <div className="relative w-full flex items-center rounded-xl bg-odin-black/70 border border-odin-graphite-800/80 focus-within:border-odin-orange-500/60 focus-within:shadow-hud-glow-orange transition-all px-2.5 py-1">
            <Terminal className="w-3.5 h-3.5 text-odin-orange-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Diretriz para ODIN..."
              disabled={isDispatching}
              className="w-full bg-transparent text-xs font-mono text-odin-graphite-100 placeholder-odin-graphite-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isDispatching}
              className="p-1 text-odin-orange-400 hover:text-odin-orange-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Disparar comando"
            >
              {isDispatching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>

        {/* Layout Preset Toggle */}
        <button
          type="button"
          onClick={() => setShowLayoutMenu(!showLayoutMenu)}
          className={`p-2 rounded-xl border transition-colors ${
            showLayoutMenu
              ? 'bg-odin-orange-500/20 text-odin-orange-400 border-odin-orange-500/40'
              : 'bg-odin-surface/40 text-odin-graphite-400 border-odin-graphite-800 hover:text-odin-graphite-100 hover:bg-odin-surface-elevated'
          }`}
          title="Opções de arranjo de janelas"
          aria-label="Opções de arranjo de janelas"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
