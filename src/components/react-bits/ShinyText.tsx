/**
 * Based on React Bits - ShinyText (https://reactbits.dev)
 * Licensed under MIT + Commons Clause License.
 * Adapted for ODIN Neural Command Interface.
 */
interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

export function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = '',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${
        disabled
          ? 'text-odin-graphite-100'
          : 'bg-gradient-to-r from-odin-graphite-300 via-odin-orange-400 to-odin-graphite-300 bg-[200%_auto] animate-[shine_5s_linear_infinite]'
      } ${className}`}
      style={{
        animationDuration,
        backgroundImage: disabled
          ? 'none'
          : 'linear-gradient(120deg, rgba(241, 244, 247, 0.7) 0%, rgba(255, 154, 61, 1) 50%, rgba(241, 244, 247, 0.7) 100%)',
        backgroundSize: '200% 100%',
      }}
    >
      {text}
    </span>
  )
}
