import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CoreState, CORE_STATE_CONFIGS } from './core.types'

interface CoreEffectsProps {
  state: CoreState
}

export function CoreEffects({ state }: CoreEffectsProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const config = CORE_STATE_CONFIGS[state] || CORE_STATE_CONFIGS.idle

  const color = useMemo(() => new THREE.Color(config.color), [config.color])

  // Generate 60 static particle positions in a spherical shell
  const { geometry, material } = useMemo(() => {
    const particleCount = 60
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 1.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      color: color,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [color])

  useFrame((_, delta) => {
    material.color.lerp(color, 0.08)

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.3 * config.rotationSpeed
      pointsRef.current.rotation.x += delta * 0.15 * config.rotationSpeed
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
