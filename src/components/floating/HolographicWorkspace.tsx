import { useState, useCallback, useEffect, useRef } from 'react'
import { WindowId, WindowState, WorkspaceLayout, WindowPosition, WindowSize } from './floating.types'
import { FloatingCard } from './FloatingCard'
import { FloatingDock } from './FloatingDock'
import { AgentOrb } from '../common/AgentOrb'
import { type CoreState } from '../core/core.types'
import { ChatPanel } from '../../features/chat/ChatPanel'
import { KnowledgePanel } from '../../features/knowledge/KnowledgePanel'
import { ActivityPanel } from '../../features/activity/ActivityPanel'
import { SystemPanel } from '../../features/system/SystemPanel'
import { DecryptedText } from '../react-bits/DecryptedText'
import { ShinyText } from '../react-bits/ShinyText'
import {
  Bot,
  Library,
  Activity,
  Cpu,
} from 'lucide-react'

interface HolographicWorkspaceProps {
  initialOpenWindow?: WindowId | null
  initialConversationId?: string | null
}

function getDefaultWindows(): Record<WindowId, WindowState> {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  return {
    chat: {
      id: 'chat',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 15,
      position: isDesktop
        ? { x: Math.max(20, screenWidth - 580), y: 76 }
        : { x: 16, y: 70 },
      size: isDesktop
        ? { width: 540, height: Math.min(680, screenHeight - 170) }
        : { width: Math.min(screenWidth - 32, 480), height: Math.min(540, screenHeight - 170) },
    },
    activity: {
      id: 'activity',
      isOpen: isDesktop,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      position: { x: 24, y: 76 },
      size: { width: 420, height: Math.min(520, screenHeight - 200) },
    },
    knowledge: {
      id: 'knowledge',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 8,
      position: { x: Math.max(40, (screenWidth - 500) / 2), y: 90 },
      size: { width: 500, height: Math.min(560, screenHeight - 190) },
    },
    system: {
      id: 'system',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 6,
      position: { x: 30, y: Math.max(100, screenHeight - 480) },
      size: { width: 380, height: 360 },
    },
  }
}

export function HolographicWorkspace({
  initialOpenWindow,
  initialConversationId,
}: HolographicWorkspaceProps) {
  const [windows, setWindows] = useState<Record<WindowId, WindowState>>(getDefaultWindows)
  const [activeWindowId, setActiveWindowId] = useState<WindowId | null>('chat')
  const [maxZIndex, setMaxZIndex] = useState(20)

  // System Core Status states
  const [isChatStreaming, setIsChatStreaming] = useState(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)

  const chatPanelRef = useRef<{ sendMessage?: (text: string) => void }>({})

  // Apply initial requested open window from route
  useEffect(() => {
    if (initialOpenWindow) {
      setActiveWindowId(initialOpenWindow)
      setMaxZIndex((curr) => {
        const next = curr + 1
        setWindows((prev) => {
          const target = prev[initialOpenWindow]
          return {
            ...prev,
            [initialOpenWindow]: {
              ...target,
              isOpen: true,
              isMinimized: false,
              zIndex: next,
            },
          }
        })
        return next
      })
    }
  }, [initialOpenWindow])

  const bringToFront = useCallback(
    (id: WindowId) => {
      setActiveWindowId(id)
      setMaxZIndex((curr) => {
        const next = curr + 1
        setWindows((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            zIndex: next,
          },
        }))
        return next
      })
    },
    []
  )

  const toggleWindow = useCallback(
    (id: WindowId) => {
      setWindows((prev) => {
        const win = prev[id]
        if (!win.isOpen) {
          // Open and focus
          bringToFront(id)
          return {
            ...prev,
            [id]: { ...win, isOpen: true, isMinimized: false },
          }
        }
        if (win.isMinimized) {
          // Unminimize and focus
          bringToFront(id)
          return {
            ...prev,
            [id]: { ...win, isMinimized: false },
          }
        }
        if (activeWindowId === id) {
          // Minimize if clicked when already active
          return {
            ...prev,
            [id]: { ...win, isMinimized: true },
          }
        }
        // Focus if clicked when not top active
        bringToFront(id)
        return prev
      })
    },
    [activeWindowId, bringToFront]
  )

  const handleMinimize = useCallback((id: WindowId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMinimized: true },
    }))
  }, [])

  const handleMaximize = useCallback((id: WindowId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMaximized: !prev[id].isMaximized },
    }))
  }, [])

  const handleClose = useCallback((id: WindowId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false },
    }))
  }, [])

  const handleMove = useCallback((id: WindowId, pos: WindowPosition) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], position: pos },
    }))
  }, [])

  const handleResize = useCallback((id: WindowId, size: WindowSize) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], size },
    }))
  }, [])

  const applyLayout = useCallback(
    (layout: WorkspaceLayout) => {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight

      if (layout === 'clean-core') {
        // Minimize all windows to display pure 3D Core
        setWindows((prev) => {
          const next = { ...prev }
          ;(Object.keys(next) as WindowId[]).forEach((k) => {
            next[k] = { ...next[k], isMinimized: true }
          })
          return next
        })
      } else if (layout === 'focus-chat') {
        // Maximize Chat, minimize others
        setWindows((prev) => ({
          ...prev,
          chat: { ...prev.chat, isOpen: true, isMinimized: false, isMaximized: true, zIndex: 30 },
          activity: { ...prev.activity, isMinimized: true },
          knowledge: { ...prev.knowledge, isMinimized: true },
          system: { ...prev.system, isMinimized: true },
        }))
        setActiveWindowId('chat')
      } else if (layout === 'split') {
        // Side by side: Activity on left, Chat on right
        const colWidth = Math.max(360, Math.floor((screenWidth - 60) / 2))
        const colHeight = Math.min(680, screenHeight - 160)

        setWindows((prev) => ({
          ...prev,
          activity: {
            ...prev.activity,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: { x: 20, y: 74 },
            size: { width: colWidth, height: colHeight },
            zIndex: 21,
          },
          chat: {
            ...prev.chat,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: { x: screenWidth - colWidth - 20, y: 74 },
            size: { width: colWidth, height: colHeight },
            zIndex: 22,
          },
        }))
        setActiveWindowId('chat')
      } else {
        // Default layout
        setWindows(getDefaultWindows())
        setActiveWindowId('chat')
      }
    },
    []
  )

  // Compute central 3D core state
  const computedCoreState: CoreState =
    isChatStreaming
      ? 'working'
      : pendingApprovalsCount > 0
      ? 'waiting_approval'
      : 'idle'

  const coreStatusText =
    isChatStreaming
      ? 'Processando diretriz em tempo real...'
      : pendingApprovalsCount > 0
      ? `${pendingApprovalsCount} autorização(ões) de segurança requerida(s)`
      : 'Sistemas neurais em prontidão'

  const handleQuickCommand = (promptText: string) => {
    // Open chat and focus
    setWindows((prev) => ({
      ...prev,
      chat: {
        ...prev.chat,
        isOpen: true,
        isMinimized: false,
        zIndex: maxZIndex + 1,
      },
    }))
    bringToFront('chat')

    // If chat has a direct send callback or trigger, it will take it
    if (chatPanelRef.current.sendMessage) {
      chatPanelRef.current.sendMessage(promptText)
    }
  }

  // Count how many floating windows are currently visible and not minimized
  const visibleCount = (Object.keys(windows) as WindowId[]).filter(
    (k) => windows[k].isOpen && !windows[k].isMinimized
  ).length

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col justify-center items-center select-none">
      {/* Background Central Holographic Core */}
      <div
        className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 z-0 ${
          visibleCount > 1 ? 'opacity-35 scale-90' : visibleCount === 1 ? 'opacity-65 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div className="text-center mb-1">
          <span className="font-mono text-[10px] tracking-widest text-odin-orange-400/90 uppercase font-bold">
            <DecryptedText text="SISTEMA CENTRAL HOLOGRÁFICO" speed={40} />
          </span>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-odin-graphite-100 tracking-tight">
            <ShinyText text="ODIN V2 · NEURAL WORKSPACE" />
          </h2>
        </div>

        <AgentOrb
          state={computedCoreState}
          label={coreStatusText}
          size={328}
        />
      </div>

      {/* Floating Card: Neural Chat */}
      <FloatingCard
        id="chat"
        title="Chat Neural"
        subtitle="Sessão Operacional"
        icon={<Bot className="w-4 h-4" />}
        isOpen={windows.chat.isOpen}
        isMinimized={windows.chat.isMinimized}
        isMaximized={windows.chat.isMaximized}
        zIndex={windows.chat.zIndex}
        position={windows.chat.position}
        size={windows.chat.size}
        onFocus={() => bringToFront('chat')}
        onMinimize={() => handleMinimize('chat')}
        onMaximize={() => handleMaximize('chat')}
        onClose={() => handleClose('chat')}
        onMove={(pos) => handleMove('chat', pos)}
        onResize={(sz) => handleResize('chat', sz)}
      >
        <ChatPanel
          initialConversationId={initialConversationId}
          onStreamingChange={(streaming) => setIsChatStreaming(streaming)}
        />
      </FloatingCard>

      {/* Floating Card: Base de Conhecimento */}
      <FloatingCard
        id="knowledge"
        title="Biblioteca"
        subtitle="Repositório Técnico"
        icon={<Library className="w-4 h-4" />}
        isOpen={windows.knowledge.isOpen}
        isMinimized={windows.knowledge.isMinimized}
        isMaximized={windows.knowledge.isMaximized}
        zIndex={windows.knowledge.zIndex}
        position={windows.knowledge.position}
        size={windows.knowledge.size}
        onFocus={() => bringToFront('knowledge')}
        onMinimize={() => handleMinimize('knowledge')}
        onMaximize={() => handleMaximize('knowledge')}
        onClose={() => handleClose('knowledge')}
        onMove={(pos) => handleMove('knowledge', pos)}
        onResize={(sz) => handleResize('knowledge', sz)}
      >
        <KnowledgePanel />
      </FloatingCard>

      {/* Floating Card: Atividade & Auditoria */}
      <FloatingCard
        id="activity"
        title="Atividade Operacional"
        subtitle="Eventos e Autorizações"
        icon={<Activity className="w-4 h-4" />}
        badge={
          pendingApprovalsCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-odin-amber-500 text-black font-mono text-[9px] font-bold animate-pulse">
              {pendingApprovalsCount} PENDENTE
            </span>
          ) : undefined
        }
        isOpen={windows.activity.isOpen}
        isMinimized={windows.activity.isMinimized}
        isMaximized={windows.activity.isMaximized}
        zIndex={windows.activity.zIndex}
        position={windows.activity.position}
        size={windows.activity.size}
        onFocus={() => bringToFront('activity')}
        onMinimize={() => handleMinimize('activity')}
        onMaximize={() => handleMaximize('activity')}
        onClose={() => handleClose('activity')}
        onMove={(pos) => handleMove('activity', pos)}
        onResize={(sz) => handleResize('activity', sz)}
      >
        <ActivityPanel
          onApprovalsCountChange={(count) => setPendingApprovalsCount(count)}
        />
      </FloatingCard>

      {/* Floating Card: Telemetria do Sistema */}
      <FloatingCard
        id="system"
        title="Telemetria"
        subtitle="Status do Nó"
        icon={<Cpu className="w-4 h-4" />}
        isOpen={windows.system.isOpen}
        isMinimized={windows.system.isMinimized}
        isMaximized={windows.system.isMaximized}
        zIndex={windows.system.zIndex}
        position={windows.system.position}
        size={windows.system.size}
        onFocus={() => bringToFront('system')}
        onMinimize={() => handleMinimize('system')}
        onMaximize={() => handleMaximize('system')}
        onClose={() => handleClose('system')}
        onMove={(pos) => handleMove('system', pos)}
        onResize={(sz) => handleResize('system', sz)}
      >
        <SystemPanel />
      </FloatingCard>

      {/* Floating Bottom Dock */}
      <FloatingDock
        windows={windows}
        activeWindowId={activeWindowId}
        onToggleWindow={toggleWindow}
        onApplyLayout={applyLayout}
        onQuickCommand={handleQuickCommand}
        isChatStreaming={isChatStreaming}
        hasPendingApprovals={pendingApprovalsCount > 0}
      />
    </div>
  )
}
