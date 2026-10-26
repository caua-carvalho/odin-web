import { useCallback, useEffect, useRef, useState } from 'react'
import {
  api,
  type RunEvent,
} from '../../lib/api'
import {
  type LiveState,
  type ApprovalCard,
  type ConnectionState,
  emptyLive,
  RUN_EVENT_TYPES,
  TERMINAL_STATUSES,
  upsertTool,
  completeTool,
  approvalFromEvent,
} from './types'

interface UseChatStreamOptions {
  onRunFinished?: (runId: string) => void
  onTitleUpdate?: (title: string) => void
}

export function useChatStream({ onRunFinished, onTitleUpdate }: UseChatStreamOptions = {}) {
  const [live, setLive] = useState<LiveState>(emptyLive())
  const [connection, setConnection] = useState<ConnectionState>('idle')
  const [pendingApproval, setPendingApproval] = useState<ApprovalCard | null>(null)
  const [isStopping, setIsStopping] = useState(false)

  const activeRunIdRef = useRef<string | null>(null)
  const lastSeqRef = useRef<number>(0)
  const esRef = useRef<EventSource | null>(null)
  const reconnectAttemptRef = useRef<number>(0)
  const reconnectTimerRef = useRef<number | null>(null)
  const runActiveRef = useRef<boolean>(false)

  const closeStream = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (esRef.current) {
      try {
        esRef.current.close()
      } catch {
        // noop
      }
      esRef.current = null
    }
    setConnection('idle')
  }, [])

  const handleRunEvent = useCallback(
    (ev: RunEvent) => {
      const { type, data, seq } = ev
      if (typeof seq === 'number' && seq > lastSeqRef.current) {
        lastSeqRef.current = seq
      }

      switch (type) {
        case 'run_queued':
          setLive((prev) => ({
            ...prev,
            phase: 'queued',
            statusText: data.message || 'Na fila de execução...',
          }))
          break

        case 'run_started':
        case 'session_started':
        case 'message_start':
          runActiveRef.current = true
          setLive((prev) => ({
            ...prev,
            phase: 'streaming',
            startedAt: prev.startedAt || Date.now(),
            statusText: data.status || 'Processando...',
          }))
          break

        case 'token': {
          const delta = data.delta ?? data.text ?? ''
          if (delta) {
            setLive((prev) => ({
              ...prev,
              phase: 'streaming',
              text: prev.text + delta,
            }))
          }
          break
        }

        case 'reasoning': {
          const delta = data.delta ?? data.text ?? ''
          if (delta) {
            setLive((prev) => ({
              ...prev,
              phase: 'streaming',
              reasoning: prev.reasoning + delta,
            }))
          }
          break
        }

        case 'status': {
          const text = data.text || data.message || null
          setLive((prev) => ({
            ...prev,
            statusText: text || prev.statusText,
          }))
          break
        }

        case 'session_info':
          if (data.model) {
            setLive((prev) => ({ ...prev, model: data.model }))
          }
          break

        case 'title':
          if (data.title && onTitleUpdate) {
            onTitleUpdate(data.title)
          }
          break

        case 'tool_call':
          setLive((prev) => ({
            ...prev,
            phase: 'streaming',
            tools: upsertTool(prev.tools, data),
          }))
          break

        case 'tool_result':
          setLive((prev) => ({
            ...prev,
            tools: completeTool(prev.tools, data),
          }))
          break

        case 'approval_requested':
          setLive((prev) => ({ ...prev, phase: 'waiting_approval' }))
          setPendingApproval(approvalFromEvent(data))
          break

        case 'approval_resolved':
        case 'approval_cancelled':
          setPendingApproval(null)
          setLive((prev) => ({
            ...prev,
            phase: 'streaming',
          }))
          break

        case 'run_stopping':
          setIsStopping(true)
          setLive((prev) => ({
            ...prev,
            phase: 'stopping',
            statusText: 'Interrompendo execução...',
          }))
          break

        case 'run_completed':
        case 'run_failed':
        case 'run_cancelled': {
          runActiveRef.current = false
          const isError = type === 'run_failed'
          setLive((prev) => ({
            ...prev,
            phase: isError ? 'error' : 'done',
            error: isError ? data.error || 'Falha na execução' : null,
            statusText: isError ? 'Falhou' : 'Concluído',
          }))
          const completedRunId = activeRunIdRef.current
          closeStream()
          if (completedRunId && onRunFinished) {
            onRunFinished(completedRunId)
          }
          break
        }

        case 'error':
          setLive((prev) => ({
            ...prev,
            phase: 'error',
            error: data.message || data.error || 'Erro no stream',
          }))
          break

        default:
          break
      }
    },
    [closeStream, onRunFinished, onTitleUpdate]
  )

  const attachToRun = useCallback(
    (runId: string, initialSeq = 0) => {
      closeStream()
      activeRunIdRef.current = runId
      lastSeqRef.current = initialSeq
      runActiveRef.current = true
      reconnectAttemptRef.current = 0

      setLive((prev) => ({
        ...prev,
        runId,
        phase: 'connecting',
        startedAt: prev.startedAt || Date.now(),
        error: null,
      }))
      setConnection('connecting')

      const connect = () => {
        if (!activeRunIdRef.current || activeRunIdRef.current !== runId) return

        try {
          const es = api.createEventSource(runId, lastSeqRef.current)
          esRef.current = es

          es.onopen = () => {
            setConnection('live')
            reconnectAttemptRef.current = 0
          }

          es.onerror = async () => {
            // Check if run terminated in backend before reconnecting
            try {
              const runData = await api.getRun(runId)
              if (TERMINAL_STATUSES.includes(runData.status)) {
                runActiveRef.current = false
                closeStream()
                if (onRunFinished) onRunFinished(runId)
                return
              }
            } catch {
              // ignore
            }

            if (!runActiveRef.current) {
              closeStream()
              return
            }

            setConnection('reconnecting')
            es.close()
            esRef.current = null

            const attempt = reconnectAttemptRef.current
            const backoff = Math.min(1000 * Math.pow(1.5, attempt), 10000)
            reconnectAttemptRef.current += 1

            reconnectTimerRef.current = window.setTimeout(() => {
              if (activeRunIdRef.current === runId) {
                connect()
              }
            }, backoff)
          }

          for (const evType of RUN_EVENT_TYPES) {
            es.addEventListener(evType, (event: MessageEvent) => {
              try {
                const data = JSON.parse(event.data)
                handleRunEvent({
                  type: evType,
                  data,
                  timestamp: new Date().toISOString(),
                  seq: typeof data.seq === 'number' ? data.seq : undefined,
                })
              } catch (err) {
                console.warn(`Failed to parse event ${evType}:`, event.data, err)
              }
            })
          }
        } catch (err) {
          console.error('Failed to initialize EventSource:', err)
          setConnection('idle')
        }
      }

      connect()
    },
    [closeStream, handleRunEvent, onRunFinished]
  )

  const stopActiveRun = useCallback(async () => {
    const id = activeRunIdRef.current
    if (!id) return
    setIsStopping(true)
    try {
      await api.stopRun(id)
      setLive((prev) => ({
        ...prev,
        phase: 'stopping',
        statusText: 'Interrompendo...',
      }))
    } catch (err) {
      console.error('Failed to stop run:', err)
    } finally {
      setIsStopping(false)
    }
  }, [])

  const resolveApproval = useCallback(
    async (approvalId: string, choice?: string) => {
      try {
        if (choice === 'deny') {
          await api.deny(approvalId, choice)
        } else {
          await api.approve(approvalId, choice)
        }
        setPendingApproval(null)
      } catch (err) {
        console.error('Failed to resolve approval:', err)
        throw err
      }
    },
    []
  )

  const resetLive = useCallback(() => {
    closeStream()
    activeRunIdRef.current = null
    lastSeqRef.current = 0
    runActiveRef.current = false
    setLive(emptyLive())
    setPendingApproval(null)
    setIsStopping(false)
  }, [closeStream])

  useEffect(() => {
    return () => {
      closeStream()
    }
  }, [closeStream])

  return {
    live,
    connection,
    pendingApproval,
    isStopping,
    attachToRun,
    stopActiveRun,
    resolveApproval,
    resetLive,
    setLive,
  }
}
