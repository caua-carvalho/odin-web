/**
 * Based on React Bits - DecryptedText (https://reactbits.dev)
 * Licensed under MIT + Commons Clause License.
 * Adapted for ODIN Neural Command Interface.
 */
import { useEffect, useState, useRef } from 'react'

interface DecryptedTextProps {
  text: string
  speed?: number
  maxIterations?: number
  characters?: string
  className?: string
  encryptedClassName?: string
  parentClassName?: string
  animateOnMount?: boolean
}

export function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#@&%*<>~',
  className = '',
  encryptedClassName = 'text-odin-orange-400/80 font-mono',
  parentClassName = 'inline-block',
  animateOnMount = true,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isHovering, setIsHovering] = useState(false)
  const isScramblingRef = useRef(false)

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayText(text)
      return
    }

    if (!animateOnMount) {
      setDisplayText(text)
      return
    }

    let iteration = 0
    let interval: NodeJS.Timeout | null = null
    isScramblingRef.current = true

    interval = setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < iteration / (maxIterations / text.length)) {
              return text[index]
            }
            return characters[Math.floor(Math.random() * characters.length)]
          })
          .join('')
      })

      iteration += 1

      if (iteration >= maxIterations * 1.5) {
        if (interval) clearInterval(interval)
        setDisplayText(text)
        isScramblingRef.current = false
      }
    }, speed)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [text, speed, maxIterations, characters, animateOnMount])

  // Trigger on hover for interactive elements
  const handleMouseEnter = () => {
    if (isScramblingRef.current) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setIsHovering(true)
    let iteration = 0
    const interval = setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < iteration / (maxIterations / text.length)) {
              return text[index]
            }
            return characters[Math.floor(Math.random() * characters.length)]
          })
          .join('')
      })

      iteration += 1

      if (iteration >= maxIterations * 1.5) {
        clearInterval(interval)
        setDisplayText(text)
        setIsHovering(false)
      }
    }, speed)
  }

  return (
    <span
      className={parentClassName}
      onMouseEnter={handleMouseEnter}
    >
      <span className={isHovering ? encryptedClassName : className}>
        {displayText}
      </span>
    </span>
  )
}
