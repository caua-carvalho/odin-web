import { Orb, type OrbLook } from '@yogesharc/thinking-orbs'
import type { CoreState } from '../core/core.types'

export interface AgentOrbProps {
  state?: CoreState
  size?: number
  className?: string
  label?: string
  /** Controls the number of dots: count = size * 4 * density (see orb-core `mountOrb`).\nDefault 1 keeps the previous count; lower it to reduce dots.\nEg. 0.7 ~30% fewer dots, 0.5 ~50%.\nThere is a lower bound of 8 dots (`Math.max(8, ...)`). */
  density?: number
}

type OrbLookMapping = OrbLook & {
  colorClass: string
}

const STATE_MAPPINGS: Record<CoreState, OrbLookMapping> = {
  idle: {
    state: 'idle',
    variant: 'default',
    colorClass: 'text-odin-orange-500/80',
  },
  connecting: {
    state: 'working',
    variant: 'gyro',
    colorClass: 'text-odin-cyan-300',
  },
  thinking: {
    state: 'reasoning',
    variant: 'default',
    colorClass: 'text-odin-orange-400',
  },
  searching: {
    state: 'searching',
    variant: 'lighthouse',
    colorClass: 'text-odin-cyan-300',
  },
  working: {
    state: 'working',
    variant: 'default',
    colorClass: 'text-odin-orange-500',
  },
  queued: {
    state: 'waiting',
    variant: 'default',
    colorClass: 'text-odin-graphite-400',
  },
  waiting_approval: {
    state: 'waiting',
    variant: 'default',
    colorClass: 'text-odin-amber-400',
  },
  stopping: {
    state: 'compacting',
    variant: 'squeeze',
    colorClass: 'text-odin-amber-500',
  },
  completed: {
    state: 'idle',
    variant: 'blink',
    colorClass: 'text-odin-emerald-400',
  },
  error: {
    state: 'retrying',
    variant: 'surge',
    colorClass: 'text-odin-crimson-400',
  },
}

export function AgentOrb({
  state = 'idle',
  size = 20,
  density = 1,
  className = '',
  label,
}: AgentOrbProps) {
  const mapping = STATE_MAPPINGS[state] || STATE_MAPPINGS.idle

  return (
    <div
      className={`inline-flex items-center justify-center ${mapping.colorClass} ${className}`}
      title={label || state}
    >
      <Orb
        {...(mapping as any)}
        size={size}
        density={density}
        label={label || `Agent status: ${state}`}
      />
    </div>
  )
}
