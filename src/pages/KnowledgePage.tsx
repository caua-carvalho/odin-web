import { useState, useEffect, useCallback } from 'react'
import { api, type KnowledgeItem } from '../lib/api'
import { cn, formatRelativeTime, truncate } from '../lib/utils'
import { LoadingScreen } from '../components/LoadingScreen'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { DecryptedText } from '../components/react-bits/DecryptedText'
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  FileText,
  Link,
  Scissors,
  User,
  Tag,
  Loader2,
  ChevronDown,
  Database,
  ExternalLink,
} from 'lucide-react'

const KNOWLEDGE_TYPES = [
  { value: 'note', label: 'Nota', icon: FileText },
  { value: 'link', label: 'Link', icon: Link },
  { value: 'snippet', label: 'Trecho', icon: Scissors },
  { value: 'personal', label: 'Pessoal', icon: User },
] as const

export function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [formData, setFormData] = useState({
    type: 'note',
    title: '',
    content: '',
    url: '',
    tags: '' as string,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.listKnowledge({
        page,
        page_size: pageSize,
        q: search || undefined,
        type: typeFilter || undefined,
        tags: tagFilter || undefined,
      })
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (err: unknown) {
      console.error('Falha ao carregar itens da base de conhecimento:', err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, typeFilter, tagFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const errors: Record<string, string> = {}
    if (!formData.title.trim()) errors.title = 'Título é obrigatório'
    if (!formData.content.trim()) errors.content = 'Conteúdo é obrigatório'
    if (formData.type === 'link' && formData.url && !isValidUrl(formData.url)) {
      errors.url = 'URL inválida'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const data = {
        type: formData.type,
        title: formData.title.trim(),
        content: formData.content.trim(),
        url: formData.type === 'link' && formData.url.trim() ? formData.url.trim() : undefined,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }

      if (editingItem) {
        await api.updateKnowledge(editingItem.id, data)
      } else {
        await api.createKnowledge(data)
      }

      resetForm()
      loadItems()
    } catch (err: any) {
      setFormErrors({ submit: err.response?.data?.detail || 'Erro ao registrar item' })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ type: 'note', title: '', content: '', url: '', tags: '' })
    setFormErrors({})
    setEditingItem(null)
    setShowCreate(false)
  }

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      title: item.title,
      content: item.content,
      url: item.url || '',
      tags: item.tags.join(', '),
    })
    setShowCreate(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Confirmar exclusão deste registro?')) return
    try {
      await api.deleteKnowledge(id)
      loadItems()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao excluir item')
    }
  }

  if (loading && items.length === 0) {
    return <LoadingScreen />
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-odin-graphite-800/80 pb-6">
        <div>
          <span className="font-mono text-xs font-semibold text-odin-orange-400 tracking-wider uppercase">
            <DecryptedText text="INDEXAÇÃO LOCAL" speed={30} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-odin-graphite-50 tracking-tight mt-1 flex items-center gap-3">
            <Database className="w-6 h-6 text-odin-orange-400" />
            Base de Conhecimento
          </h1>
          <p className="font-mono text-xs text-odin-graphite-400 mt-1">
            Repositório de notas, snippets, credenciais de contexto e links estruturados do ODIN.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm()
            setShowCreate(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>NOVO REGISTRO</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-odin-graphite-500" />
          <input
            type="text"
            placeholder="Filtrar por título ou conteúdo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="input pl-9 font-mono text-xs"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="input w-36 font-mono text-xs"
          >
            <option value="">Todos os tipos</option>
            {KNOWLEDGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filtrar tag..."
            value={tagFilter}
            onChange={(e) => {
              setTagFilter(e.target.value)
              setPage(1)
            }}
            className="input w-36 font-mono text-xs"
          />
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto space-y-3">
        {items.length === 0 ? (
          <SpotlightCard className="p-12 text-center text-odin-graphite-500 font-mono">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-odin-orange-400" />
            <h3 className="text-sm font-semibold text-odin-graphite-300">
              NENHUM REGISTRO LOCALIZADO
            </h3>
            <p className="text-xs text-odin-graphite-500 mt-1">
              Crie uma nova nota ou altere os parâmetros de busca.
            </p>
          </SpotlightCard>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <KnowledgeItemRow
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-center gap-3 pt-6 font-mono text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-ghost btn-sm disabled:opacity-30"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              <span>ANTERIOR</span>
            </button>
            <span className="text-odin-graphite-400 px-3">
              PÁGINA {page} DE {Math.ceil(total / pageSize)} ({total} ITENS)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="btn btn-ghost btn-sm disabled:opacity-30"
            >
              <span>PRÓXIMO</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showCreate || editingItem) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => resetForm()}
        >
          <div
            className="bg-odin-surface border border-odin-orange-500/40 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-hud-glow-orange"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-odin-graphite-800 font-mono">
              <h2 className="text-sm font-bold text-odin-graphite-100 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-odin-orange-400" />
                {editingItem ? 'Editar Registro' : 'Novo Registro de Conhecimento'}
              </h2>
              <button
                onClick={resetForm}
                className="p-1 rounded text-odin-graphite-400 hover:text-odin-graphite-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Tipo de Conhecimento</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  className="input font-mono text-xs"
                  disabled={Boolean(editingItem)}
                >
                  {KNOWLEDGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="title" className="label">
                  Título <span className="text-odin-crimson-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className={cn('input font-mono text-xs', formErrors.title && 'border-odin-crimson-500')}
                  placeholder="Ex: Credenciais de API / Instruções de Deploy"
                />
                {formErrors.title && <p className="text-odin-crimson-400 text-xs font-mono mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label htmlFor="content" className="label">
                  Conteúdo <span className="text-odin-crimson-400">*</span>
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className={cn('textarea font-mono text-xs', formErrors.content && 'border-odin-crimson-500')}
                  placeholder="Insira detalhes técnicos, dados estruturados ou notas..."
                  rows={6}
                />
                {formErrors.content && <p className="text-odin-crimson-400 text-xs font-mono mt-1">{formErrors.content}</p>}
              </div>

              {formData.type === 'link' && (
                <div>
                  <label htmlFor="url" className="label">
                    Endereço URL
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    className={cn('input font-mono text-xs', formErrors.url && 'border-odin-crimson-500')}
                    placeholder="https://exemplo.com"
                  />
                  {formErrors.url && <p className="text-odin-crimson-400 text-xs font-mono mt-1">{formErrors.url}</p>}
                </div>
              )}

              <div>
                <label htmlFor="tags" className="label">
                  Tags de Classificação (separadas por vírgula)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-odin-graphite-500" />
                  <input
                    id="tags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    className="input pl-9 font-mono text-xs"
                    placeholder="infra, docker, chaves, projeto"
                  />
                </div>
              </div>

              {formErrors.submit && (
                <div className="p-2.5 rounded bg-odin-crimson-500/15 border border-odin-crimson-500/30 text-odin-crimson-400 font-mono text-xs">
                  {formErrors.submit}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-odin-graphite-800">
                <button type="button" onClick={resetForm} className="btn btn-ghost font-mono">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary font-mono" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gravando...
                    </span>
                  ) : editingItem ? (
                    'Atualizar Registro'
                  ) : (
                    'Gravar no Sistema'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function KnowledgeItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: KnowledgeItem
  onEdit: (item: KnowledgeItem) => void
  onDelete: (id: string) => void
}) {
  const typeInfo = KNOWLEDGE_TYPES.find((t) => t.value === item.type) || KNOWLEDGE_TYPES[0]
  const Icon = typeInfo.icon

  return (
    <div className="p-4 rounded-xl bg-odin-surface/90 border border-odin-graphite-800 hover:border-odin-orange-500/40 transition-all group flex items-start gap-4 shadow-hud-panel">
      <div className="p-2 rounded-lg bg-odin-surface-elevated border border-odin-graphite-800 text-odin-orange-400 flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] uppercase font-bold text-odin-orange-400/90 tracking-wider">
            {typeInfo.label}
          </span>
          <span className="text-odin-graphite-600">·</span>
          <span className="font-mono text-[10px] text-odin-graphite-500">
            {formatRelativeTime(item.updated_at || item.created_at)}
          </span>
        </div>

        <h3 className="font-mono font-bold text-sm text-odin-graphite-100 truncate mb-1">
          {item.title}
        </h3>

        <p className="text-xs text-odin-graphite-300 font-sans line-clamp-2 mb-2.5 leading-relaxed">
          {item.content}
        </p>

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-odin-cyan-300 hover:underline mb-2.5"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{truncate(item.url, 45)}</span>
          </a>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-odin-surface-elevated border border-odin-graphite-800 text-odin-graphite-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-odin-graphite-400 hover:text-odin-orange-400 hover:bg-odin-surface-elevated transition-colors"
          title="Editar registro"
          aria-label="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg text-odin-graphite-400 hover:text-odin-crimson-400 hover:bg-odin-crimson-500/10 transition-colors"
          title="Excluir registro"
          aria-label="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}