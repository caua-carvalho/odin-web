/**
 * Based on React Bits - Particles background (https://reactbits.dev)
 * Licensed under MIT + Commons Clause License.
 * Adapted for ODIN Neural Command Interface (React 18 + Canvas, zero external dependencies).
 */
import { useEffect, useRef } from 'react'

interface BackgroundParticlesProps {
  particleCount?: number
  particleColor?: string
  accentColor?: string
  className?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  baseAlpha: number
  color: string
}

export function BackgroundParticles({
  particleCount = 40,
  particleColor = '#FF6A00',
  accentColor = '#67DFFF',
  className = '',
}: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = mediaQuery.matches

    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches
    }
    mediaQuery.addEventListener('change', onMotionChange)

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Generate lightweight particle array
    const particles: Particle[] = []
    const count = Math.min(particleCount, 60)

    for (let i = 0; i < count; i++) {
      const isAccent = Math.random() < 0.15
      const baseAlpha = 0.05 + Math.random() * 0.15
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.5,
        alpha: baseAlpha,
        baseAlpha,
        color: isAccent ? accentColor : particleColor,
      })
    }

    let lastTime = performance.now()

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      ctx.clearRect(0, 0, width, height)

      // Only advance position if not reduced motion
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (!reducedMotion) {
          p.x += p.vx * dt * 60
          p.y += p.vy * dt * 60

          if (p.x < 0) p.x = width
          if (p.x > width) p.x = 0
          if (p.y < 0) p.y = height
          if (p.y > height) p.y = 0
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      }

      ctx.globalAlpha = 1.0

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    // Initial render
    render(performance.now())

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      mediaQuery.removeEventListener('change', onMotionChange)
    }
  }, [particleCount, particleColor, accentColor])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden="true"
    />
  )
}
