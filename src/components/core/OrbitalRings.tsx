import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CoreState, CORE_STATE_CONFIGS } from './core.types'

interface OrbitalRingsProps {
  state: CoreState
}

export function OrbitalRings({ state }: OrbitalRingsProps) {
  const ring1Ref = useRef<THREE.Group>(null)
  const ring2Ref = useRef<THREE.Group>(null)
  const ring3Ref = useRef<THREE.Group>(null)

  const config = CORE_STATE_CONFIGS[state] || CORE_STATE_CONFIGS.idle

  const primaryColor = useMemo(() => new THREE.Color(config.color), [config.color])
  const secondaryColor = useMemo(() => new THREE.Color(config.secondaryColor), [config.secondaryColor])

  // Geometries
  const torusGeo1 = useMemo(() => new THREE.TorusGeometry(1.4, 0.015, 8, 64), [])
  const torusGeo2 = useMemo(() => new THREE.TorusGeometry(1.8, 0.012, 8, 64), [])
  const torusGeo3 = useMemo(() => new THREE.TorusGeometry(2.2, 0.01, 8, 64), [])

  // Materials
  const mat1 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.8,
      }),
    [primaryColor]
  )

  const mat2 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: secondaryColor,
        transparent: true,
        opacity: 0.6,
      }),
    [secondaryColor]
  )

  const mat3 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.4,
      }),
    [primaryColor]
  )

  useFrame((_, delta) => {
    mat1.color.lerp(primaryColor, 0.08)
    mat2.color.lerp(secondaryColor, 0.08)
    mat3.color.lerp(primaryColor, 0.08)

    const speed = delta * config.rotationSpeed

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += speed * 0.9
      ring1Ref.current.rotation.y += speed * 0.4
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= speed * 1.1
      ring2Ref.current.rotation.z += speed * 0.7
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += speed * 0.5
      ring3Ref.current.rotation.z -= speed * 1.3
    }
  })

  return (
    <group>
      {/* Inner Gimbal Ring */}
      <group ref={ring1Ref} rotation={[0.4, 0.2, 0]}>
        <mesh geometry={torusGeo1} material={mat1} />
      </group>

      {/* Mid Gimbal Ring */}
      <group ref={ring2Ref} rotation={[-0.5, 0.6, 0.3]}>
        <mesh geometry={torusGeo2} material={mat2} />
      </group>

      {/* Outer Telemetry Ring */}
      <group ref={ring3Ref} rotation={[0.8, -0.4, 0.2]}>
        <mesh geometry={torusGeo3} material={mat3} />
      </group>
    </group>
  )
}
