import { type Approval, type Run } from '../../lib/api'

export type ToolActivity = {
  call_id: string
  tool: string
  args?: unknown
  context?: string | null
  result?: string
  is_error?: boolean
  error?: string | null
  duration_s?: number | null
  status: 'running' | 'done'
}

export type ApprovalCard = {
  approval_id: string
  request_id?: string
  operation: string
  command?: string
  description?: string
  choices: string[]
  details?: Record<string, any>
}

export type LiveState = {
  runId: string | null
  text: string
  reasoning: string
  tools: ToolActivity[]
  statusText: string | null
  error: string | null
  phase: 'idle' | 'connecting' | 'streaming' | 'waiting_approval' | 'stopping' | 'queued' | 'done' | 'error'
  startedAt: number | null
  model?: string
  usage?: Record<string, any> | null
}

export type ConnectionState = 'idle' | 'connecting' | 'live' | 'reconnecting'

export function emptyLive(): LiveState {
  return {
    runId: null,
    text: '',
    reasoning: '',
    tools: [],
    statusText: null,
    error: null,
    phase: 'idle',
    startedAt: null,
  }
}

export const RUN_EVENT_TYPES = [
  'run_queued',
  'run_started',
  'session_started',
  'message_start',
  'token',
  'reasoning',
  'status',
  'session_info',
  'title',
  'tool_call',
  'tool_result',
  'approval_requested',
  'approval_resolved',
  'approval_cancelled',
  'run_stopping',
  'run_completed',
  'run_failed',
  'run_cancelled',
  'run_snapshot',
  'error',
]

export const TERMINAL_STATUSES: Run['status'][] = ['completed', 'failed', 'cancelled', 'interrupted']

export function isActiveStatus(status: Run['status'] | string | null | undefined): boolean {
  return status === 'queued' || status === 'running' || status === 'waiting_approval'
}

export function pretty(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function clampText(value: unknown, limit = 4000): string {
  const s = pretty(value)
  if (s.length <= limit) return s
  return s.slice(0, limit) + `\n… [truncado, total ${s.length} caracteres]`
}

export function approvalFromEvent(data: Record<string, any>): ApprovalCard {
  return {
    approval_id: String(data.approval_id || data.request_id || ''),
    request_id: data.request_id ? String(data.request_id) : undefined,
    operation: String(data.operation || 'Operação'),
    command: data.command ? String(data.command) : undefined,
    description: data.description ? String(data.description) : undefined,
    choices: Array.isArray(data.choices) && data.choices.length > 0
      ? data.choices.map((c: any) => String(c))
      : ['allow_once', 'allow_always', 'deny'],
    details: data.details || undefined,
  }
}

export function approvalFromRecord(record: Approval): ApprovalCard {
  const details = record.details || {}
  const choices = Array.isArray(details.choices) && details.choices.length > 0
    ? details.choices.map((c: any) => String(c))
    : ['allow_once', 'allow_always', 'deny']
  return {
    approval_id: record.id,
    request_id: record.hermes_approval_id || undefined,
    operation: record.operation || 'Operação',
    command: details.command ? String(details.command) : undefined,
    description: details.description ? String(details.description) : undefined,
    choices,
    details,
  }
}

export function choiceLabel(choice: string): string {
  switch (choice) {
    case 'allow_once':
      return 'Permitir uma vez'
    case 'allow_always':
      return 'Permitir sempre'
    case 'deny':
      return 'Negar'
    case 'approve':
      return 'Aprovar'
    default:
      return choice.replace(/_/g, ' ')
  }
}

export function upsertTool(tools: ToolActivity[], data: Record<string, any>): ToolActivity[] {
  const callId = String(data.call_id || data.id || `call_${tools.length + 1}`)
  const existingIdx = tools.findIndex((t) => t.call_id === callId)
  const item: ToolActivity = {
    call_id: callId,
    tool: String(data.tool || data.name || 'ferramenta'),
    args: data.args ?? data.arguments,
    context: data.context ?? null,
    status: 'running',
  }
  if (existingIdx >= 0) {
    const copy = [...tools]
    copy[existingIdx] = { ...copy[existingIdx], ...item }
    return copy
  }
  return [...tools, item]
}

export function completeTool(tools: ToolActivity[], data: Record<string, any>): ToolActivity[] {
  const callId = data.call_id ? String(data.call_id) : undefined
  const toolName = data.tool ? String(data.tool) : undefined

  let targetIdx = -1
  if (callId) {
    targetIdx = tools.findIndex((t) => t.call_id === callId)
  }
  if (targetIdx < 0 && toolName) {
    for (let i = tools.length - 1; i >= 0; i--) {
      if (tools[i].tool === toolName && tools[i].status === 'running') {
        targetIdx = i
        break
      }
    }
  }

  const resultStr = data.result !== undefined ? pretty(data.result) : undefined
  const isError = Boolean(data.is_error || data.error)
  const duration = typeof data.duration_s === 'number' ? data.duration_s : null

  if (targetIdx >= 0) {
    const copy = [...tools]
    copy[targetIdx] = {
      ...copy[targetIdx],
      status: 'done',
      result: resultStr ?? copy[targetIdx].result,
      is_error: isError,
      error: data.error ? String(data.error) : null,
      duration_s: duration ?? copy[targetIdx].duration_s,
    }
    return copy
  }

  return [
    ...tools,
    {
      call_id: callId || `call_${tools.length + 1}`,
      tool: toolName || 'ferramenta',
      status: 'done',
      result: resultStr,
      is_error: isError,
      error: data.error ? String(data.error) : null,
      duration_s: duration,
    },
  ]
}

export function mergePersistedTools(calls?: any[] | null, results?: any[] | null): ToolActivity[] {
  if (!calls || !Array.isArray(calls) || calls.length === 0) return []
  const resultsByCallId = new Map<string, any>()
  if (Array.isArray(results)) {
    for (const r of results) {
      if (r && r.call_id) resultsByCallId.set(String(r.call_id), r)
    }
  }
  return calls.map((c, idx) => {
    const callId = String(c.id || c.call_id || `call_${idx + 1}`)
    const r = resultsByCallId.get(callId)
    return {
      call_id: callId,
      tool: String(c.name || c.tool || 'ferramenta'),
      args: c.args ?? c.arguments,
      context: c.context ?? null,
      result: r ? pretty(r.result ?? r.content) : undefined,
      is_error: r ? Boolean(r.is_error || r.error) : false,
      error: r?.error ? String(r.error) : null,
      duration_s: typeof r?.duration_s === 'number' ? r.duration_s : null,
      status: 'done',
    }
  })
}

export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m === 0) return `${rem}s`
  return `${m}m ${rem}s`
}
