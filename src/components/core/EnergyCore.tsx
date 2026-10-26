import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CoreState, CORE_STATE_CONFIGS } from './core.types'

interface EnergyCoreProps {
  state: CoreState
}

export function EnergyCore({ state }: EnergyCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const innerSphereRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.LineSegments>(null)

  const config = CORE_STATE_CONFIGS[state] || CORE_STATE_CONFIGS.idle

  // Target color for smooth transitions
  const targetColor = useMemo(() => new THREE.Color(config.color), [config.color])
  const targetSecondary = useMemo(() => new THREE.Color(config.secondaryColor), [config.secondaryColor])

  // Geometries created once
  const icosahedronGeo = useMemo(() => new THREE.IcosahedronGeometry(1.0, 1), [])
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.55, 24, 24), [])
  const wireframeGeo = useMemo(() => new THREE.WireframeGeometry(icosahedronGeo), [icosahedronGeo])

  // Materials created once
  const outerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: targetColor,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      }),
    [targetColor]
  )

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: targetColor,
        transparent: true,
        opacity: 0.85,
      }),
    [targetColor]
  )

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: targetSecondary,
        transparent: true,
        opacity: 0.6,
      }),
    [targetSecondary]
  )

  useFrame((_, delta) => {
    // Lerp colors smoothly
    outerMaterial.color.lerp(targetColor, 0.08)
    innerMaterial.color.lerp(targetColor, 0.08)
    lineMaterial.color.lerp(targetSecondary, 0.08)

    const rotStep = delta * config.rotationSpeed

    if (meshRef.current) {
      meshRef.current.rotation.x += rotStep * 0.7
      meshRef.current.rotation.y += rotStep * 1.0

      // Pulse breathing
      const time = performance.now() * 0.001 * config.pulseSpeed
      const pulseScale = 1.0 + Math.sin(time) * 0.08
      meshRef.current.scale.set(pulseScale, pulseScale, pulseScale)
    }

    if (innerSphereRef.current) {
      const time = performance.now() * 0.001 * config.pulseSpeed * 1.5
      const innerScale = 1.0 + Math.cos(time) * 0.12
      innerSphereRef.current.scale.set(innerScale, innerScale, innerScale)
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.x -= rotStep * 0.5
      wireframeRef.current.rotation.z += rotStep * 0.8
    }
  })

  return (
    <group>
      {/* Central Solid Glow Core */}
      <mesh ref={innerSphereRef} geometry={sphereGeo} material={innerMaterial} />

      {/* Primary Geometric Cage */}
      <mesh ref={meshRef} geometry={icosahedronGeo} material={outerMaterial} />

      {/* Technical Wireframe Accents */}
      <lineSegments ref={wireframeRef} geometry={wireframeGeo} material={lineMaterial} />
    </group>
  )
}
