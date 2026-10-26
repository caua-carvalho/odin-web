import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  api,
  type Conversation,
  type Message,
  type Run,
} from '../lib/api'
import { LoadingScreen } from '../components/LoadingScreen'
import { useChatStream } from '../features/chat/useChatStream'
import { ChatSidebar } from '../features/chat/ChatSidebar'
import { ChatComposer } from '../features/chat/ChatComposer'
import { MessageBubble, QueuedBubble } from '../features/chat/MessageBubble'
import { LiveAssistant } from '../features/chat/LiveAssistant'
import { AgentOrb } from '../components/common/AgentOrb'
import { isActiveStatus } from '../features/chat/types'
import {
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
      console.error('Failed to load conversations:', err)
      return []
    }
  }, [])

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true)
    try {
      const data = await api.listMessages(convId, { page_size: 100 })
      const items: Message[] = Array.isArray(data) ? data : data?.items || []
      // Sort chronologically ascending
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setMessages(items)
    } catch (err) {
      console.error('Failed to load messages for conversation:', convId, err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const handleRunFinished = useCallback(
    async (_runId: string) => {
      if (conversationId) {
        await loadMessages(conversationId)
        loadConversations()
      }
    },
    [conversationId, loadMessages, loadConversations]
  )

  const handleTitleUpdate = useCallback(
    (newTitle: string) => {
      setCurrentConversation((prev) => (prev ? { ...prev, title: newTitle } : prev))
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c))
      )
    },
    [conversationId]
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

  // Detect and reattach to active run when switching conversation
  const checkActiveRun = useCallback(
    async (convId: string) => {
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
    },
    [attachToRun, resetLive]
  )

  // Initialize conversations list and select active
  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoadingInitial(true)
      const convs = await loadConversations()
      if (!mounted) return

      if (conversationId) {
        const found = convs.find((c) => c.id === conversationId)
        if (found) {
          setCurrentConversation(found)
          await loadMessages(conversationId)
          await checkActiveRun(conversationId)
        } else {
          // If not found in list, attempt direct fetch
          try {
            const fetched = await api.getConversation(conversationId)
            setCurrentConversation(fetched)
            await loadMessages(conversationId)
            await checkActiveRun(conversationId)
          } catch {
            navigate('/chat', { replace: true })
          }
        }
      } else if (convs.length > 0) {
        navigate(`/chat/${convs[0].id}`, { replace: true })
      }

      setLoadingInitial(false)
    }

    init()

    return () => {
      mounted = false
    }
  }, [conversationId, loadConversations, loadMessages, checkActiveRun, navigate])

  // Scroll on message arrival or streaming tokens
  useEffect(() => {
    scrollToBottom(true)
  }, [messages.length, live.text, live.reasoning, live.tools.length, scrollToBottom])

  const handleNewConversation = async () => {
    try {
      const created = await api.createConversation({ title: 'Nova Sessão Neural' })
      setConversations((prev) => [created, ...prev])
      navigate(`/chat/${created.id}`)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConversation?.id === id) {
        const remaining = conversations.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0].id}`)
        } else {
          navigate('/chat')
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
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
        navigate(`/chat/${created.id}`)
        return
      } catch (err) {
        console.error('Failed to initiate conversation:', err)
        return
      }
    }

    // Optimistically append user message
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
      console.error('Failed to dispatch run:', err)
      setLive((prev) => ({
        ...prev,
        phase: 'error',
        error: err.response?.data?.detail || 'Erro ao despachar comando para ODIN',
      }))
    }
  }

  if (loadingInitial) {
    return <LoadingScreen />
  }

  const isLiveRunning = live.phase !== 'idle' && live.phase !== 'done'

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Sessions Left Drawer/Sidebar */}
      <div
        className={`transition-all duration-300 ease-out-expo flex-shrink-0 border-r border-odin-graphite-800/80 bg-odin-surface/60 backdrop-blur-md ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={currentConversation?.id || null}
          onSelect={(id) => navigate(`/chat/${id}`)}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Main Conversation Terminal */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-transparent relative">
        {/* Session Sub-header */}
        <div className="h-12 border-b border-odin-graphite-800/80 px-4 flex items-center justify-between bg-odin-surface/40 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded text-odin-graphite-400 hover:text-odin-orange-400 hover:bg-odin-surface-elevated transition-colors"
              title={sidebarOpen ? 'Recolher histórico' : 'Expandir histórico'}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2 truncate font-mono text-xs">
              <span className="text-odin-orange-400 font-bold">SESSION:</span>
              <span className="text-odin-graphite-100 truncate font-medium">
                {currentConversation?.title || 'Nova Sessão Neural'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {connection === 'live' && (
              <span className="flex items-center gap-1.5 text-odin-emerald-400 bg-odin-emerald-500/10 px-2 py-0.5 rounded border border-odin-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-odin-emerald-400 animate-pulse" />
                STREAM ATIVO
              </span>
            )}
            {connection === 'reconnecting' && (
              <span className="flex items-center gap-1.5 text-odin-amber-400 bg-odin-amber-500/10 px-2 py-0.5 rounded border border-odin-amber-500/30 animate-pulse">
                RECONECTANDO...
              </span>
            )}
            <AgentOrb state={isLiveRunning ? 'thinking' : 'idle'} size={18} />
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {messages.length === 0 && !isLiveRunning ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
              <div className="w-12 h-12 rounded-2xl bg-odin-orange-500/15 border border-odin-orange-500/40 flex items-center justify-center text-odin-orange-400 mb-4 shadow-hud-glow-orange">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-mono text-base font-bold text-odin-graphite-100 uppercase tracking-wider">
                ODIN NEURAL INTERFACE ONLINE
              </h3>
              <p className="font-mono text-xs text-odin-graphite-400 max-w-sm mt-1.5 leading-relaxed">
                Pronto para executar tarefas, pesquisar bases de dados, raciocinar e coordenar ferramentas.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                <button
                  onClick={() => handleSendMessage('Faça um resumo dos recursos e capacidades atuais do sistema')}
                  className="px-3 py-1.5 rounded-lg bg-odin-surface/80 border border-odin-graphite-800 text-xs font-mono text-odin-graphite-300 hover:text-odin-orange-400 hover:border-odin-orange-500/40 transition-colors"
                >
                  Resumo de capacidades
                </button>
                <button
                  onClick={() => handleSendMessage('Quais arquivos e notas estão indexados na biblioteca?')}
                  className="px-3 py-1.5 rounded-lg bg-odin-surface/80 border border-odin-graphite-800 text-xs font-mono text-odin-graphite-300 hover:text-odin-orange-400 hover:border-odin-orange-500/40 transition-colors"
                >
                  Consultar conhecimento
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Historical Messages */}
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Active Live Assistant Streaming Bubble */}
              {isLiveRunning && (
                <LiveAssistant
                  live={live}
                  pendingApproval={pendingApproval}
                  onResolveApproval={resolveApproval}
                  onStop={stopActiveRun}
                  isStopping={isStopping}
                />
              )}

              {/* Queued runs if any */}
              {queuedRuns.map((qr, idx) => (
                <QueuedBubble key={qr.id} position={idx + 1} />
              ))}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer Console at Bottom */}
        <div className="p-4 sm:px-6 lg:px-8 border-t border-odin-graphite-800/80 bg-odin-surface/50 backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
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
