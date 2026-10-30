import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  Search,
  Grid3X3,
  FolderOpen,
  FileText,
  Package,
  Rocket,
  Code2,
  PenTool,
  BookOpen,
  Film,
  MessageCircle,
  Apple,
  Cpu,
  List,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { cn } from '../lib/utils'

// Types
interface SkillData {
  path: string
  category: string
  name: string
  description: string
  version: string
  author: string
  license: string
  tags: string[]
  related_skills: string[]
  has_script_dir: boolean
  has_reference_dir: boolean
}

interface SkillsResponse {
  skills: SkillData[]
  total: number
  categories: Record<string, number>
  updated_at: string
  source: string
}

// Category configuration
const CATEGORY_ORDER = [
  'research',
  'software-development',
  'productivity',
  'remote-static-web-deploy',
  'creative',
  'note-taking',
  'media',
  'email',
  'social-media',
  'devops',
  'mobile',
  'autonomous-ai-agents',
  'apple',
  'web',
] as const

type Category = typeof CATEGORY_ORDER[number]

interface SkillWithCategory extends SkillData {
  categoryLabel: string
  categoryOrder: number
  allTags: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  research: 'Pesquisa',
  'software-development': 'Desenvolvimento',
  productivity: 'Produtividade',
  'remote-static-web-deploy': 'Deploy',
  creative: 'Criativo',
  'note-taking': 'Notas',
  media: 'Mídia',
  email: 'Email',
  'social-media': 'Redes',
  devops: 'DevOps',
  mobile: 'Mobile',
  'autonomous-ai-agents': 'Agentes',
  apple: 'Apple',
  web: 'Web',
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  research: BookOpen,
  'software-development': Code2,
  productivity: List,
  'remote-static-web-deploy': Rocket,
  creative: PenTool,
  'note-taking': FileText,
  media: Film,
  email: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>,
  'social-media': MessageCircle,
  devops: Cpu,
  mobile: Apple,
  'autonomous-ai-agents': Apple,
  apple: Apple,
  web: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
}

function versionColor(version: string) {
  const n = parseInt(version.split('.')[0], 10)
  if (n >= 3) return 'text-odin-emerald-400'
  if (n >= 2) return 'text-odin-cyan-400'
  return 'text-odin-orange-400'
}

// API client
async function fetchSkills(): Promise<SkillsResponse> {
  const res = await fetch('/api/skills', {
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

// Polling helper
function usePolling<T>(fn: () => Promise<T>, intervalMs: number, enabled: boolean) {
  const [data, setData] = useState<T | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await fn()
      setData(result)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }, [fn])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const load = async () => {
      try {
        const result = await fn()
        if (!cancelled) {
          setData(result)
          setLastUpdate(new Date())
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido')
        }
      }
    }

    load()
    const id = setInterval(load, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [fn, intervalMs, enabled])

  return { data, lastUpdate, error, refresh }
}

export function SkillVisionPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'version'>('name')
  const [refreshing, setRefreshing] = useState(false)
  const [liveEnabled, setLiveEnabled] = useState(true)

  // Fetch skills from backend with polling
  const { data: skillsResponse, lastUpdate, error, refresh } = usePolling(
    fetchSkills,
    15000, // 15 seconds
    liveEnabled
  )

  // Build the full skills list with category metadata
  const allSkills = useMemo(() => {
    if (!skillsResponse) return []
    return skillsResponse.skills.map((s): SkillWithCategory => ({
      ...s,
      categoryLabel: CATEGORY_LABELS[s.category] || s.category,
      categoryOrder: CATEGORY_ORDER.indexOf(s.category as Category),
      allTags: [...(s.tags || []), ...(s.related_skills || [])],
    }))
  }, [skillsResponse])

  const filteredSkills = useMemo(() => {
    let list = [...allSkills]

    if (activeCategory !== 'all') {
      list = list.filter((s) => s.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        (s.related_skills || []).some((t) => t.toLowerCase().includes(q))
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'category') return a.categoryOrder - b.categoryOrder || a.name.localeCompare(b.name)
      return b.version.localeCompare(a.version)
    })

    return list
  }, [allSkills, searchQuery, activeCategory, sortBy])

  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    for (const s of allSkills) {
      cats.set(s.category, (cats.get(s.category) || 0) + 1)
    }
    return Array.from(cats.entries()).map(([cat, count]) => ({
      value: cat,
      label: CATEGORY_LABELS[cat] || cat,
      count,
      icon: CATEGORY_ICONS[cat] || FolderOpen,
    }))
  }, [allSkills])

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    refresh().finally(() => setRefreshing(false))
  }, [refresh])

  // Build the header display
  const total = skillsResponse?.total ?? 0

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-odin-graphite-800/80 pb-6">
        <div>
          <span className="font-mono text-xs font-semibold text-odin-orange-400 tracking-wider uppercase">
            <span className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              SKILLS VISION
            </span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-odin-graphite-50 tracking-tight mt-1 flex items-center gap-3">
            <Package className="w-7 h-7 text-odin-orange-400" />
            <span>Catálogo de Skills</span>
            <span className="font-mono text-[10px] text-odin-graphite-500 tracking-wider uppercase bg-odin-surface-elevated px-2 py-0.5 rounded border border-odin-graphite-800">
              {total} total
            </span>
          </h1>
          <p className="font-mono text-xs text-odin-graphite-400 mt-1 max-w-2xl">
            Visualização interativa de todos os skills disponíveis em{' '}
            <code className="font-mono text-[11px] text-odin-graphite-300 bg-odin-surface-elevated px-1.5 py-0.5 rounded border border-odin-graphite-800">
              ~/.hermes/skills
            </code>
            , atualizado em tempo real via API backend.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-odin-graphite-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar skills por nome, tag ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-odin-surface-elevated border border-odin-graphite-800 text-odin-graphite-100 placeholder-odin-graphite-500 font-mono text-sm focus:border-odin-orange-500/50 focus:outline-none focus:ring-1 focus:ring-odin-orange-500/30 transition-all sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-mono text-xs text-odin-graphite-400 hidden sm:inline">Ordenar:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 rounded-lg bg-odin-surface-elevated border border-odin-graphite-800 text-odin-graphite-100 font-mono text-sm focus:border-odin-orange-500/50 focus:outline-none focus:ring-1 focus:ring-odin-orange-500/30 transition-all"
            >
              <option value="name">Nome</option>
              <option value="category">Categoria</option>
              <option value="version">Versão</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2.5 rounded-lg bg-odin-surface-elevated border border-odin-graphite-800 text-odin-graphite-400 hover:text-odin-graphite-100 hover:bg-odin-surface hover:border-odin-graphite-700 transition-all flex-shrink-0"
              title="Atualizar agora"
            >
              <RefreshCw
                className={cn('w-4 h-4', refreshing && 'animate-spin text-odin-orange-400')}
              />
            </button>
            {/* Live toggle */}
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-odin-surface-elevated border border-odin-graphite-800 cursor-pointer text-odin-graphite-400 hover:text-odin-graphite-100 hover:bg-odin-surface hover:border-odin-graphite-700 transition-all text-xs">
              <input
                type="checkbox"
                checked={liveEnabled}
                onChange={(e) => setLiveEnabled(e.target.checked)}
                className="sr-only"
              />
              <span className={cn('w-2 h-2 rounded-full', liveEnabled ? 'bg-odin-emerald-400' : 'bg-odin-graphite-600')} />
              <span className="font-mono">{liveEnabled ? 'AO VIVO' : 'BLOQUEADO'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Live status bar */}
      {lastUpdate && (
        <div className="flex items-center gap-4 text-[10px] font-mono text-odin-graphite-500">
          <span className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', liveEnabled ? 'bg-odin-emerald-400 animate-pulse' : 'bg-odin-graphite-600')} />
            {liveEnabled ? 'Atualizando em tempo real' : 'Atualização manual'}
          </span>
          <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-odin-crimson-400 bg-odin-crimson-500/10 border border-odin-crimson-500/30 rounded-lg px-3 py-2">
          <Cpu className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="flex gap-8 h-full">
          {/* Category Sidebar */}
          <div className="w-56 flex-shrink-0 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-sm transition-all border',
                activeCategory === 'all'
                  ? 'bg-odin-orange-500/15 border-odin-orange-500/40 text-odin-orange-400'
                  : 'border-transparent text-odin-graphite-400 hover:text-odin-graphite-100 hover:bg-odin-surface-elevated'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              Todos ({total})
            </button>
            {categories.map(({ value, label, count, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setActiveCategory(value)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-sm transition-all border',
                  activeCategory === value
                    ? 'bg-odin-orange-500/15 border-odin-orange-500/40 text-odin-orange-400'
                    : 'border-transparent text-odin-graphite-400 hover:text-odin-graphite-100 hover:bg-odin-surface-elevated'
                )}
              >
                <Icon className="w-4 h-4 text-odin-graphite-500" />
                <span className="flex-1 text-left">{label}</span>
                <span className="font-mono text-[10px] text-odin-graphite-500 bg-odin-surface-elevated px-1.5 py-0.5 rounded border border-odin-graphite-800">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Skill Cards */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-odin-graphite-500">
                <Search className="w-10 h-10 mb-4 opacity-30 text-odin-graphite-400" />
                <p className="font-mono text-sm">Nenhum skill encontrado</p>
                <p className="font-mono text-xs text-odin-graphite-400 mt-1">
                  Tente ajustar a busca ou filtrar por categoria
                </p>
              </div>
            ) : (
              filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.path}
                  skill={skill}
                  isExpanded={expandedSkill === skill.path}
                  onToggle={() => setExpandedSkill(expandedSkill === skill.path ? null : skill.path)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillCard({ skill, isExpanded, onToggle }: {
  skill: SkillWithCategory
  isExpanded: boolean
  onToggle: () => void
}) {
  const Icon = CATEGORY_ICONS[skill.category] || FolderOpen

  return (
    <div
      className={cn(
        'border rounded-xl bg-odin-surface/90 backdrop-blur-sm transition-all overflow-hidden',
        isExpanded
          ? 'border-odin-orange-500/40 shadow-lg shadow-odin-orange-500/5'
          : 'border-odin-graphite-800 hover:border-odin-graphite-700 hover:shadow-hud-panel'
      )}
    >
      <div className="p-4 space-y-3">
        <button
          onClick={onToggle}
          className="w-full flex items-start gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-odin-orange-500/10 border border-odin-orange-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5 text-odin-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="font-mono text-sm font-bold text-odin-graphite-100 leading-snug">
                {skill.name}
              </h3>
              <span className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded border', versionColor(skill.version))}>
                v{skill.version}
              </span>
            </div>
            <p className="text-xs text-odin-graphite-400 mt-1.5 leading-relaxed line-clamp-2">
              {skill.description}
            </p>
          </div>
          <ChevronRight
            className={cn('w-4 h-4 text-odin-graphite-500 flex-shrink-0 mt-1 transition-transform duration-200', isExpanded && 'rotate-90 text-odin-orange-400')}
          />
        </button>

        {skill.tags && skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(skill.tags || []).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-odin-surface-elevated border border-odin-graphite-800 text-[10px] font-mono text-odin-graphite-400"
            >
              {tag}
            </span>
          ))}
          {(skill.related_skills || []).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-odin-cyan-500/10 border border-odin-cyan-500/30 text-[10px] font-mono text-odin-cyan-400"
            >
              ← {tag}
            </span>
          ))}
        </div>
        )}

        <div className="flex items-center gap-3 text-[10px] font-mono text-odin-graphite-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-odin-graphite-600" />
            {skill.author || 'Hermes Agent'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-odin-graphite-600" />
            {skill.license || 'MIT'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 animate-slide-down">
          <div className="p-3 bg-odin-surface-elevated rounded-lg border border-odin-graphite-800/60">
            <span className="text-[10px] uppercase tracking-wider text-odin-graphite-500 font-mono block mb-1">
              Índice do Skill
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-odin-black/40 rounded border border-odin-graphite-800/60">
                <span className="text-[9px] text-odin-graphite-500 block">Caminho</span>
                <span className="font-mono text-[10px] text-odin-graphite-300 truncate">{skill.path}</span>
              </div>
              <div className="p-2 bg-odin-black/40 rounded border border-odin-graphite-800/60">
                <span className="text-[9px] text-odin-graphite-500 block">Scripts</span>
                <span className="font-mono text-[10px] text-odin-graphite-300">
                  {skill.has_script_dir ? '✓' : '—'}
                </span>
              </div>
              <div className="p-2 bg-odin-black/40 rounded border border-odin-graphite-800/60">
                <span className="text-[9px] text-odin-graphite-500 block">Referências</span>
                <span className="font-mono text-[10px] text-odin-graphite-300">
                  {skill.has_reference_dir ? '✓' : '—'}
                </span>
              </div>
              <div className="p-2 bg-odin-black/40 rounded border border-odin-graphite-800/60">
                <span className="text-[9px] text-odin-graphite-500 block">Versão</span>
                <span className="font-mono text-[10px] text-odin-graphite-300">v{skill.version}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-mono text-odin-graphite-500 uppercase">Tags:</span>
            {(skill.allTags || []).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-odin-emerald-500/10 border border-odin-emerald-500/30 text-[10px] font-mono text-odin-emerald-400"
              >
                #{tag}
              </span>
            ))}
          </div>

          <p className="text-xs text-odin-graphite-300 leading-relaxed border-t border-odin-graphite-800/60 pt-2">
            {skill.description}
          </p>
        </div>
      )}
    </div>
  )
}
