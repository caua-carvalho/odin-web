import { CoreState, CORE_STATE_CONFIGS } from './core.types'

interface CoreFallbackProps {
  state: CoreState
}

export function CoreFallback({ state }: CoreFallbackProps) {
  const config = CORE_STATE_CONFIGS[state] || CORE_STATE_CONFIGS.idle

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      <svg
        className="w-full h-full max-w-[340px] max-h-[340px] animate-spin-slow"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer segmented ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke={config.color}
          strokeWidth="1.5"
          strokeDasharray="8 12 24 12"
          strokeOpacity="0.4"
        />

        {/* Middle gimbal ring */}
        <circle
          cx="100"
          cy="100"
          r="68"
          stroke={config.secondaryColor}
          strokeWidth="1"
          strokeDasharray="16 16"
          strokeOpacity="0.6"
          className="origin-center animate-reverse-spin"
        />

        {/* Inner geometric ring */}
        <circle
          cx="100"
          cy="100"
          r="48"
          stroke={config.color}
          strokeWidth="2"
          strokeDasharray="4 8"
          strokeOpacity="0.8"
        />

        {/* Crosshair telemetry lines */}
        <line x1="100" y1="5" x2="100" y2="25" stroke={config.color} strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="100" y1="175" x2="100" y2="195" stroke={config.color} strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="5" y1="100" x2="25" y2="100" stroke={config.color} strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="175" y1="100" x2="195" y2="100" stroke={config.color} strokeWidth="1.5" strokeOpacity="0.6" />

        {/* Central glowing core circle */}
        <circle
          cx="100"
          cy="100"
          r="26"
          fill={config.color}
          fillOpacity="0.25"
          stroke={config.color}
          strokeWidth="2"
          className="animate-pulse-glow origin-center"
        />
        <circle cx="100" cy="100" r="12" fill={config.color} fillOpacity="0.85" />
      </svg>
    </div>
  )
}
