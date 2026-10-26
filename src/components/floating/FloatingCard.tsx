import { useRef, useState, ReactNode } from 'react'
import { WindowId, WindowPosition, WindowSize } from './floating.types'
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
} from 'lucide-react'

interface FloatingCardProps {
  id: WindowId
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: ReactNode
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: WindowPosition
  size: WindowSize
  onFocus: () => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
  onMove: (pos: WindowPosition) => void
  onResize?: (size: WindowSize) => void
  children: ReactNode
}

export function FloatingCard({
  id: _id,
  title,
  subtitle,
  icon,
  badge,
  isOpen,
  isMinimized,
  isMaximized,
  zIndex,
  position,
  size,
  onFocus,
  onMinimize,
  onMaximize,
  onClose,
  onMove,
  onResize,
  children,
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const [isFocused, setIsFocused] = useState(false)

  // Dragging handler
  const handlePointerDownHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return
    // Ignore clicks on header action buttons
    if ((e.target as HTMLElement).closest('button')) return

    onFocus()
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    posStartRef.current = { ...position }

    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
  }

  const handlePointerMoveHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isMaximized) return

    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    // Bounds checking
    const maxX = Math.max(0, window.innerWidth - size.width)
    const maxY = Math.max(60, window.innerHeight - 80)

    const nextX = Math.min(Math.max(0, posStartRef.current.x + dx), maxX)
    const nextY = Math.min(Math.max(60, posStartRef.current.y + dy), maxY)

    onMove({ x: nextX, y: nextY })
  }

  const handlePointerUpHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      try {
        const target = e.currentTarget
        target.releasePointerCapture(e.pointerId)
      } catch {
        // noop
      }
    }
  }

  // Resizing handler
  const handlePointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return
    e.stopPropagation()
    onFocus()
    isResizingRef.current = true
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    }
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
  }

  const handlePointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current || isMaximized || !onResize) return

    const dw = e.clientX - resizeStartRef.current.x
    const dh = e.clientY - resizeStartRef.current.y

    const nextWidth = Math.max(340, Math.min(window.innerWidth - position.x - 20, resizeStartRef.current.width + dw))
    const nextHeight = Math.max(260, Math.min(window.innerHeight - position.y - 80, resizeStartRef.current.height + dh))

    onResize({ width: nextWidth, height: nextHeight })
  }

  const handlePointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isResizingRef.current) {
      isResizingRef.current = false
      try {
        const target = e.currentTarget
        target.releasePointerCapture(e.pointerId)
      } catch {
        // noop
      }
    }
  }

  if (!isOpen || isMinimized) {
    return null
  }

  const style: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        top: '64px',
        left: '16px',
        right: '16px',
        bottom: '84px',
        width: 'auto',
        height: 'auto',
        zIndex,
      }
    : {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex,
      }

  return (
    <div
      ref={cardRef}
      style={style}
      onPointerDown={() => onFocus()}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`flex flex-col rounded-xl bg-odin-surface/92 backdrop-blur-xl border transition-shadow duration-200 shadow-hud-panel select-none overflow-hidden ${
        isFocused
          ? 'border-odin-orange-500/50 shadow-hud-glow-orange ring-1 ring-odin-orange-500/20'
          : 'border-odin-graphite-800/90'
      }`}
    >
      {/* Draggable HUD Window Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        className={`h-11 px-3.5 flex items-center justify-between border-b border-odin-graphite-800/80 bg-odin-surface-elevated/70 select-none ${
          isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-odin-orange-400 flex items-center justify-center">
            {icon}
          </div>

          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-xs font-bold text-odin-graphite-100 uppercase tracking-wider truncate">
              {title}
            </span>
            {subtitle && (
              <span className="hidden sm:inline font-mono text-[10px] text-odin-graphite-500 truncate">
                ({subtitle})
              </span>
            )}
          </div>

          {badge && <div className="ml-1">{badge}</div>}
        </div>

        {/* Window Actions */}
        <div className="flex items-center gap-1">
          <GripHorizontal className="w-3.5 h-3.5 text-odin-graphite-600 mr-1 hidden sm:block" />

          {/* Minimize */}
          <button
            type="button"
            onClick={onMinimize}
            className="p-1.5 rounded hover:bg-odin-graphite-800 text-odin-graphite-400 hover:text-odin-graphite-100 transition-colors"
            title="Minimizar janela"
            aria-label="Minimizar janela"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore */}
          <button
            type="button"
            onClick={onMaximize}
            className="p-1.5 rounded hover:bg-odin-graphite-800 text-odin-graphite-400 hover:text-odin-orange-400 transition-colors"
            title={isMaximized ? 'Restaurar janela' : 'Maximizar janela'}
            aria-label={isMaximized ? 'Restaurar janela' : 'Maximizar janela'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-odin-crimson-500/20 text-odin-graphite-400 hover:text-odin-crimson-400 transition-colors"
            title="Fechar painel"
            aria-label="Fechar painel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body Container */}
      <div className="flex-1 overflow-auto relative select-text">
        {children}
      </div>

      {/* Resize Grip (bottom-right) */}
      {!isMaximized && (
        <div
          onPointerDown={handlePointerDownResize}
          onPointerMove={handlePointerMoveResize}
          onPointerUp={handlePointerUpResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 flex items-center justify-center opacity-60 hover:opacity-100"
          title="Redimensionar janela"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-odin-orange-400/80 mr-0.5 mb-0.5" />
        </div>
      )}
    </div>
  )
}
