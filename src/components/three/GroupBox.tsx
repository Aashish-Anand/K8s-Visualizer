import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { K8sGroup } from '@/types'
import { useAppStore } from '@/stores/useAppStore'

interface GroupBoxProps {
  group: K8sGroup
}

/** Semi-transparent bounding box around a group of K8s components */
export default function GroupBox({ group }: GroupBoxProps) {
  const exploded = useAppStore(s => s.explodedView)
  const showLabels = useAppStore(s => s.showLabels)

  const factor = exploded ? 1.4 : 1
  const position: [number, number, number] = [
    group.position[0] * factor,
    group.position[1] * factor,
    group.position[2] * factor,
  ]

  const size: [number, number, number] = [
    group.size[0] * (exploded ? 1.3 : 1),
    group.size[1] * (exploded ? 1.3 : 1),
    group.size[2] * (exploded ? 1.3 : 1),
  ]

  const color = useMemo(() => new THREE.Color(group.color), [group.color])

  return (
    <group position={position}>
      {/* Transparent box */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.04}
          roughness={0.8}
          metalness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Edge wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={color} transparent opacity={0.2} />
      </lineSegments>

      {/* Group label */}
      {showLabels && (
        <Html
          position={[0, size[1] / 2 + 0.15, 0]}
          center
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: `${group.color}20`,
              border: `1px solid ${group.color}50`,
              borderRadius: '8px',
              padding: '4px 12px',
              color: group.color,
              fontSize: '12px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              whiteSpace: 'nowrap',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {group.name}
          </div>
        </Html>
      )}
    </group>
  )
}
