import { useCallback, useEffect, useRef, useState } from 'react'
import {
  api,
  type Conversation,
  type Message,
  type Run,
} from '../../lib/api'
import { useChatStream } from './useChatStream'
import { ChatSidebar } from './ChatSidebar'
import { ChatComposer } from './ChatComposer'
import { MessageBubble, QueuedBubble } from './MessageBubble'
import { LiveAssistant } from './LiveAssistant'
import { AgentOrb } from '../../components/common/AgentOrb'
import { isActiveStatus } from './types'
import {
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

interface ChatPanelProps {
  initialConversationId?: string | null
  onConversationChange?: (id: string) => void
  onStreamingChange?: (isStreaming: boolean) => void
}

export function ChatPanel({
  initialConversationId,
  onConversationChange,
  onStreamingChange,
}: ChatPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [queuedRuns] = useState<Run[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.listConversations({ page_size: 50 })
      const items: Conversation[] = Array.isArray(data) ? data : data?.items || []
      setConversations(items)
      return items
    } catch (err) {
      console.error('Falha ao carregar conversas no painel:', err)
      return []
    }
  }, [])

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true)
    try {
      const data = await api.listMessages(convId, { page_size: 100 })
      const items: Message[] = Array.isArray(data) ? data : data?.items || []
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setMessages(items)
    } catch (err) {
      console.error('Falha ao carregar mensagens:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const handleRunFinished = useCallback(
    async (_runId: string) => {
      if (currentConversation?.id) {
        await loadMessages(currentConversation.id)
        loadConversations()
      }
    },
    [currentConversation?.id, loadMessages, loadConversations]
  )

  const handleTitleUpdate = useCallback(
    (newTitle: string) => {
      setCurrentConversation((prev) => (prev ? { ...prev, title: newTitle } : prev))
      setConversations((prev) =>
        prev.map((c) => (c.id === currentConversation?.id ? { ...c, title: newTitle } : c))
      )
    },
    [currentConversation?.id]
  )

  const {
    live,
    connection,
    pendingApproval,
    isStopping,
    attachToRun,
    stopActiveRun,
    resolveApproval,
    resetLive,
    setLive,
  } = useChatStream({
    onRunFinished: handleRunFinished,
    onTitleUpdate: handleTitleUpdate,
  })

  const isLiveRunning = live.phase !== 'idle' && live.phase !== 'done'

  useEffect(() => {
    if (onStreamingChange) {
      onStreamingChange(isLiveRunning)
    }
  }, [isLiveRunning, onStreamingChange])

  const selectConversation = useCallback(
    async (convId: string) => {
      const found = conversations.find((c) => c.id === convId)
      if (found) {
        setCurrentConversation(found)
        if (onConversationChange) onConversationChange(convId)
        await loadMessages(convId)
        try {
          const activeRun = await api.getActiveRun(convId)
          if (activeRun && isActiveStatus(activeRun.status)) {
            attachToRun(activeRun.id, activeRun.events?.length || 0)
          } else {
            resetLive()
          }
        } catch {
          resetLive()
        }
      }
    },
    [conversations, onConversationChange, loadMessages, attachToRun, resetLive]
  )

  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoadingInitial(true)
      const convs = await loadConversations()
      if (!mounted) return

      const targetId = initialConversationId || (convs.length > 0 ? convs[0].id : null)
      if (targetId) {
        const found = convs.find((c) => c.id === targetId)
        if (found) {
          setCurrentConversation(found)
          await loadMessages(targetId)
          try {
            const activeRun = await api.getActiveRun(targetId)
            if (activeRun && isActiveStatus(activeRun.status)) {
              attachToRun(activeRun.id, activeRun.events?.length || 0)
            }
          } catch {
            // noop
          }
        }
      }
      setLoadingInitial(false)
    }

    init()

    return () => {
      mounted = false
    }
  }, [initialConversationId, loadConversations, loadMessages, attachToRun])

  useEffect(() => {
    scrollToBottom(true)
  }, [messages.length, live.text, live.reasoning, live.tools.length, scrollToBottom])

  const handleNewConversation = async () => {
    try {
      const created = await api.createConversation({ title: 'Nova Sessão Neural' })
      setConversations((prev) => [created, ...prev])
      setCurrentConversation(created)
      setMessages([])
      resetLive()
      if (onConversationChange) onConversationChange(created.id)
    } catch (err) {
      console.error('Falha ao criar sessão:', err)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConversation?.id === id) {
        const remaining = conversations.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          selectConversation(remaining[0].id)
        } else {
          setCurrentConversation(null)
          setMessages([])
          resetLive()
        }
      }
    } catch (err) {
      console.error('Falha ao excluir conversa:', err)
    }
  }

  const handleSendMessage = async (text: string) => {
    let convId = currentConversation?.id
    if (!convId) {
      try {
        const created = await api.createConversation({
          title: text.slice(0, 32),
          initial_message: text,
        })
        convId = created.id
        setConversations((prev) => [created, ...prev])
        setCurrentConversation(created)
        if (onConversationChange) onConversationChange(created.id)
      } catch (err) {
        console.error('Falha ao iniciar conversa:', err)
        return
      }
    }

    if (!convId) return

    const optimisticUserMessage: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: convId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
      run_id: null,
    }
    setMessages((prev) => [...prev, optimisticUserMessage])

    try {
      const run = await api.createRun(convId, { message: text })
      attachToRun(run.id, 0)
    } catch (err: any) {
      console.error('Falha ao despachar comando:', err)
      setLive((prev) => ({
        ...prev,
        phase: 'error',
        error: err.response?.data?.detail || 'Erro ao despachar comando para ODIN',
      }))
    }
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-transparent">
      {/* Sub-header Bar */}
      <div className="h-10 border-b border-odin-graphite-800/80 px-3 flex items-center justify-between bg-odin-surface-elevated/40 text-xs font-mono">
        <div className="flex items-center gap-2 truncate">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-odin-graphite-400 hover:text-odin-orange-400"
            title={sidebarOpen ? 'Ocultar sessões' : 'Ver sessões'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          </button>
          <span className="text-odin-graphite-300 truncate font-semibold">
            {currentConversation?.title || 'Sessão Neural'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {connection === 'live' && (
            <span className="flex items-center gap-1 text-[10px] text-odin-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-odin-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
          <AgentOrb state={isLiveRunning ? 'thinking' : 'idle'} size={14} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible sessions drawer */}
        {sidebarOpen && (
          <div className="w-52 flex-shrink-0 border-r border-odin-graphite-800/80 bg-odin-surface/80">
            <ChatSidebar
              conversations={conversations}
              activeId={currentConversation?.id || null}
              onSelect={(id) => {
                selectConversation(id)
                setSidebarOpen(false)
              }}
              onNew={handleNewConversation}
              onDelete={handleDeleteConversation}
            />
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingInitial ? (
              <div className="h-full flex items-center justify-center font-mono text-xs text-odin-graphite-500">
                Sincronizando sessão...
              </div>
            ) : messages.length === 0 && !isLiveRunning ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Bot className="w-8 h-8 text-odin-orange-400 mb-2 opacity-80" />
                <p className="font-mono text-xs text-odin-graphite-300 font-semibold">
                  SESSÃO PRONTA PARA DIRETRIZES
                </p>
                <p className="font-mono text-[11px] text-odin-graphite-500 mt-1">
                  Digite seu comando no console abaixo para o ODIN executar.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {isLiveRunning && (
                  <LiveAssistant
                    live={live}
                    pendingApproval={pendingApproval}
                    onResolveApproval={resolveApproval}
                    onStop={stopActiveRun}
                    isStopping={isStopping}
                  />
                )}

                {queuedRuns.map((qr, idx) => (
                  <QueuedBubble key={qr.id} position={idx + 1} />
                ))}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-2 sm:p-3 border-t border-odin-graphite-800/80 bg-odin-surface-elevated/40">
            <ChatComposer
              onSend={handleSendMessage}
              onStop={stopActiveRun}
              isRunning={isLiveRunning}
              isStopping={isStopping}
              disabled={loadingMessages}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
