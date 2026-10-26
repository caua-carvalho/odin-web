import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react'
import { type CoreVisualizerProps, CORE_STATE_CONFIGS } from './core.types'
import { CoreScene } from './CoreScene'
import { CoreFallback } from './CoreFallback'
import { DecryptedText } from '../react-bits/DecryptedText'
import { ShinyText } from '../react-bits/ShinyText'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('R3F WebGL Render Error caught by boundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return Boolean(gl && gl instanceof WebGLRenderingContext)
  } catch {
    return false
  }
}

const SIZE_CLASSES = {
  sm: 'w-24 h-24 max-w-[96px]',
  md: 'w-48 h-48 max-w-[192px]',
  lg: 'w-72 h-72 sm:w-80 sm:h-80 max-w-[320px]',
  xl: 'w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px]',
}

export function CoreVisualizer({
  state = 'idle',
  statusText,
  className = '',
  size = 'lg',
  showStatusBadge = true,
}: CoreVisualizerProps) {
  const [hasWebGL, setHasWebGL] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setHasWebGL(checkWebGLSupport())

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(media.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const config = CORE_STATE_CONFIGS[state] || CORE_STATE_CONFIGS.idle
  const use3D = hasWebGL && !prefersReducedMotion

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Visualizer Frame */}
      <div className={`relative flex items-center justify-center ${SIZE_CLASSES[size]}`}>
        {use3D ? (
          <WebGLErrorBoundary fallback={<CoreFallback state={state} />}>
            <CoreScene state={state} />
          </WebGLErrorBoundary>
        ) : (
          <CoreFallback state={state} />
        )}

        {/* Ambient Radial Backlight Glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-3xl opacity-20 transition-colors duration-500"
          style={{ background: config.color }}
          aria-hidden="true"
        />
      </div>

      {/* State & Telemetry Badge */}
      {showStatusBadge && (
        <div className="mt-4 flex flex-col items-center text-center select-none pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-odin-surface/80 border border-odin-graphite-800 shadow-hud-panel backdrop-blur-md">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: config.color }}
              aria-hidden="true"
            />
            <span
              className="w-2 h-2 -ml-4 rounded-full"
              style={{ backgroundColor: config.color }}
              aria-hidden="true"
            />
            <span className="font-mono text-xs font-semibold tracking-wider text-odin-graphite-100">
              <DecryptedText text={config.label} speed={30} maxIterations={8} />
            </span>
          </div>

          <p className="mt-1.5 text-xs text-odin-graphite-400 font-mono max-w-xs truncate">
            {statusText ? (
              <ShinyText text={statusText} className="text-xs" />
            ) : (
              config.description
            )}
          </p>
        </div>
      )}
    </div>
  )
}
