import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Subtle reference grid floor for the 3D scene */
export default function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null)

  useFrame(() => {
    if (gridRef.current) {
      gridRef.current.material.opacity = 0.08
    }
  })

  return (
    <group position={[0, -4, 0]}>
      <gridHelper
        ref={gridRef as never}
        args={[40, 40, '#1e40af', '#1e293b']}
      />
      {/* Soft ambient floor glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial
          color="#0a0e1a"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
