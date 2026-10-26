import { useState } from 'react'
import { type Conversation } from '../../lib/api'
import { formatRelativeTime } from '../../lib/utils'
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
} from 'lucide-react'

interface ChatSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  loading?: boolean
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading = false,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true
    return (c.title || 'Sessão').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="w-full h-full flex flex-col font-mono text-xs">
      {/* Action Header */}
      <div className="p-3 border-b border-odin-graphite-800/80 space-y-2">
        <button
          onClick={onNew}
          className="w-full btn btn-sm bg-odin-orange-500/15 text-odin-orange-400 border border-odin-orange-500/40 hover:bg-odin-orange-500/25 justify-center tracking-wider font-semibold py-2"
        >
          <Plus className="w-4 h-4" />
          <span>NOVA SESSÃO</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-odin-graphite-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar histórico..."
            className="w-full bg-odin-surface border border-odin-graphite-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-odin-graphite-100 placeholder-odin-graphite-500 focus:outline-none focus:border-odin-orange-500/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && conversations.length === 0 ? (
          <div className="p-4 text-center text-odin-graphite-500">
            Carregando sessões...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-odin-graphite-500">
            Nenhuma sessão encontrada.
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeId

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-odin-orange-500/15 border-odin-orange-500/40 text-odin-orange-400 font-semibold shadow-hud-panel'
                    : 'bg-transparent border-transparent text-odin-graphite-300 hover:bg-odin-surface-elevated/60 hover:text-odin-graphite-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-odin-orange-400' : 'text-odin-graphite-500'}`} />
                  <div className="truncate min-w-0">
                    <p className="truncate text-xs">
                      {conv.title || 'Sessão sem título'}
                    </p>
                    <span className="text-[10px] text-odin-graphite-500 block">
                      {conv.updated_at ? formatRelativeTime(conv.updated_at) : 'recente'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(conv.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-odin-graphite-500 hover:text-odin-crimson-400 hover:bg-odin-crimson-500/10 transition-opacity"
                  title="Excluir sessão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Footer telemetry */}
      <div className="p-2.5 border-t border-odin-graphite-800/80 text-[10px] text-odin-graphite-500 flex justify-between">
        <span>TOTAL SESSÕES:</span>
        <span className="text-odin-graphite-300">{conversations.length}</span>
      </div>
    </div>
  )
}
