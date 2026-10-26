import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CoreState } from './core.types'
import { EnergyCore } from './EnergyCore'
import { OrbitalRings } from './OrbitalRings'
import { CoreEffects } from './CoreEffects'

interface CoreSceneProps {
  state: CoreState
}

export function CoreScene({ state }: CoreSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'default',
        stencil: false,
        depth: true,
      }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#FF9A3D" />
      <pointLight position={[-5, -5, -5]} intensity={0.8} color="#67DFFF" />

      <Suspense fallback={null}>
        <group position={[0, 0, 0]}>
          <EnergyCore state={state} />
          <OrbitalRings state={state} />
          <CoreEffects state={state} />
        </group>
      </Suspense>
    </Canvas>
  )
}
