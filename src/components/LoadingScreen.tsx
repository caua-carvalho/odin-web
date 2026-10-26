import { cn } from '../lib/utils'
import { AgentOrb } from './common/AgentOrb'

export function LoadingScreen({ className }: { className?: string }) {
  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center bg-odin-black/95 backdrop-blur-md', className)}
      role="status"
      aria-label="Carregando telemetria"
    >
      <div className="flex flex-col items-center gap-4">
        <AgentOrb state="thinking" size={32} />
        <div className="flex flex-col items-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-odin-orange-400">
            SINCRONIZANDO
          </p>
          <span className="font-mono text-[10px] text-odin-graphite-400 mt-1">
            Estabelecendo canais neurais...
          </span>
        </div>
      </div>
    </div>
  )
}

export function InlineLoading({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(sizes[size], 'border-odin-graphite-800 border-t-odin-orange-500 rounded-full animate-spin')} />
    </div>
  )
}

export function Skeleton({ className, width, height }: { className?: string; width?: string; height?: string }) {
  return (
    <div
      className={cn('animate-pulse bg-odin-surface-elevated/70 border border-odin-graphite-800/40 rounded-lg', className)}
      style={{ width, height }}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-odin-surface-elevated/70 rounded animate-pulse" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-odin-surface/60 rounded-xl border border-odin-graphite-800 p-4 animate-pulse space-y-3', className)}>
      <div className="h-5 bg-odin-surface-elevated rounded w-3/4" />
      <div className="h-3.5 bg-odin-surface-elevated rounded w-full" />
      <div className="h-3.5 bg-odin-surface-elevated rounded w-5/6" />
      <div className="h-3.5 bg-odin-surface-elevated rounded w-1/2" />
    </div>
  )
}