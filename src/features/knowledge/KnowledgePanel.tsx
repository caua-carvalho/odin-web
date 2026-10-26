import { useState, useEffect, useCallback } from 'react'
import { api, type KnowledgeItem } from '../../lib/api'
import { cn, formatRelativeTime, truncate } from '../../lib/utils'
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
  ExternalLink,
} from 'lucide-react'

const KNOWLEDGE_TYPES = [
  { value: 'note', label: 'Nota', icon: FileText },
  { value: 'link', label: 'Link', icon: Link },
  { value: 'snippet', label: 'Trecho', icon: Scissors },
  { value: 'personal', label: 'Pessoal', icon: User },
] as const

export function KnowledgePanel() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
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
        page: 1,
        page_size: 50,
        q: search || undefined,
        type: typeFilter || undefined,
      })
      setItems(data.items || [])
    } catch (err) {
      console.error('Falha ao carregar itens:', err)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const errors: Record<string, string> = {}
    if (!formData.title.trim()) errors.title = 'Título é obrigatório'
    if (!formData.content.trim()) errors.content = 'Conteúdo é obrigatório'

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
      setFormErrors({ submit: err.response?.data?.detail || 'Erro ao registrar' })
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
    if (!confirm('Excluir este item?')) return
    try {
      await api.deleteKnowledge(id)
      loadItems()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao excluir')
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-3 font-mono text-xs space-y-3 relative overflow-hidden">
      {/* Search & Actions Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-odin-graphite-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar registros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 py-1.5 text-xs font-mono"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-28 py-1.5 text-xs font-mono"
        >
          <option value="">Todos</option>
          {KNOWLEDGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            resetForm()
            setShowCreate(true)
          }}
          className="btn btn-primary py-1.5 px-3 text-xs flex items-center gap-1 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="py-8 text-center text-odin-graphite-500">
            Consultando repositório...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-odin-graphite-500">
            Nenhum registro encontrado.
          </div>
        ) : (
          items.map((item) => {
            const typeInfo = KNOWLEDGE_TYPES.find((t) => t.value === item.type) || KNOWLEDGE_TYPES[0]
            const Icon = typeInfo.icon

            return (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-odin-surface border border-odin-graphite-800 hover:border-odin-orange-500/40 transition-colors group flex items-start gap-2.5"
              >
                <div className="p-1.5 rounded bg-odin-surface-elevated text-odin-orange-400 flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-odin-graphite-100 truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-odin-graphite-500 flex-shrink-0">
                      {formatRelativeTime(item.updated_at || item.created_at)}
                    </span>
                  </div>

                  <p className="text-[11px] text-odin-graphite-300 font-sans line-clamp-2 mt-1 leading-relaxed">
                    {item.content}
                  </p>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-odin-cyan-300 hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{truncate(item.url, 35)}</span>
                    </a>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 rounded bg-odin-surface-elevated text-[9px] text-odin-graphite-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1 rounded text-odin-graphite-400 hover:text-odin-orange-400"
                    title="Editar"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded text-odin-graphite-400 hover:text-odin-crimson-400"
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal inside Card */}
      {(showCreate || editingItem) && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in flex flex-col justify-center">
          <div className="bg-odin-surface border border-odin-orange-500/40 rounded-xl p-4 shadow-hud-glow-orange space-y-3">
            <div className="flex items-center justify-between border-b border-odin-graphite-800 pb-2">
              <span className="font-bold text-xs text-odin-graphite-100 uppercase">
                {editingItem ? 'Editar Registro' : 'Novo Registro'}
              </span>
              <button onClick={resetForm} className="text-odin-graphite-400 hover:text-odin-graphite-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  className="input py-1 text-xs"
                >
                  {KNOWLEDGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className={cn('input py-1 text-xs', formErrors.title && 'border-odin-crimson-500')}
                  placeholder="Título do registro"
                />
              </div>

              <div>
                <label className="label">Conteúdo</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className={cn('textarea py-1 text-xs min-h-[70px]', formErrors.content && 'border-odin-crimson-500')}
                  placeholder="Informações, notas ou snippets..."
                  rows={3}
                />
              </div>

              {formData.type === 'link' && (
                <div>
                  <label className="label">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    className="input py-1 text-xs"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div>
                <label className="label">Tags (separadas por vírgula)</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-odin-graphite-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    className="input pl-8 py-1 text-xs"
                    placeholder="tag1, tag2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-odin-graphite-800">
                <button type="button" onClick={resetForm} className="btn btn-ghost py-1 px-3 text-xs">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary py-1 px-3 text-xs" disabled={submitting}>
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
