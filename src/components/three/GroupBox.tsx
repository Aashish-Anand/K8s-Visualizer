import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { K8sGroup } from '@/types'
import { useAppStore } from '@/stores/useAppStore'

interface GroupBoxProps {
  group: K8sGroup
  /** IDs of nodes currently active in the animation step */
  activeNodeIds?: Set<string>
}

/** Corner accent length as fraction of edge */
const CORNER_FRAC = 0.15

/** Build corner accent line segments for a box */
function buildCornerLines(w: number, h: number, d: number): THREE.Vector3[] {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const cw = w * CORNER_FRAC, ch = h * CORNER_FRAC, cd = d * CORNER_FRAC

  const corners: [number, number, number][] = [
    [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
    [-hw, -hh,  hd], [hw, -hh,  hd], [hw, hh,  hd], [-hw, hh,  hd],
  ]

  // Each corner emits 3 short lines along each axis
  const pts: THREE.Vector3[] = []
  for (const [cx, cy, cz] of corners) {
    const sx = cx > 0 ? -1 : 1
    const sy = cy > 0 ? -1 : 1
    const sz = cz > 0 ? -1 : 1

    // X-axis accent
    pts.push(new THREE.Vector3(cx, cy, cz))
    pts.push(new THREE.Vector3(cx + sx * cw, cy, cz))
    // Y-axis accent
    pts.push(new THREE.Vector3(cx, cy, cz))
    pts.push(new THREE.Vector3(cx, cy + sy * ch, cz))
    // Z-axis accent
    pts.push(new THREE.Vector3(cx, cy, cz))
    pts.push(new THREE.Vector3(cx, cy, cz + sz * cd))
  }
  return pts
}

/** Atmospheric group bounding box with corner accents and ground glow */
export default function GroupBox({ group, activeNodeIds }: GroupBoxProps) {
  const edgeRef = useRef<THREE.LineSegments>(null)
  const cornerRef = useRef<THREE.LineSegments>(null)
  const glowDiscRef = useRef<THREE.Mesh>(null)

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

  /* Check if any child nodes are active */
  const isGroupActive = useMemo(() => {
    if (!activeNodeIds || activeNodeIds.size === 0) return false
    return group.children.some(childId => activeNodeIds.has(childId))
  }, [activeNodeIds, group.children])

  /* Corner accent geometry */
  const cornerGeometry = useMemo(() => {
    const pts = buildCornerLines(size[0], size[1], size[2])
    const geometry = new THREE.BufferGeometry().setFromPoints(pts)
    return geometry
  }, [size])

  /* Ground glow disc radius */
  const glowRadius = Math.max(size[0], size[2]) * 0.55

  /* Animate edge brightness based on active state */
  useFrame((_, delta) => {
    const targetOpacity = isGroupActive ? 0.45 : 0.15
    const cornerTargetOpacity = isGroupActive ? 0.7 : 0.3

    if (edgeRef.current) {
      const mat = edgeRef.current.material as THREE.LineBasicMaterial
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 4)
    }

    if (cornerRef.current) {
      const mat = cornerRef.current.material as THREE.LineBasicMaterial
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, cornerTargetOpacity, delta * 4)
      if (isGroupActive) {
        mat.opacity += Math.sin(Date.now() * 0.003) * 0.1
      }
    }

    if (glowDiscRef.current) {
      const mat = glowDiscRef.current.material as THREE.MeshBasicMaterial
      const glowTarget = isGroupActive ? 0.08 : 0.03
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, glowTarget, delta * 3)
    }
  })

  return (
    <group position={position}>
      {/* Subtle transparent box — barely visible, just for depth */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.02}
          roughness={0.8}
          metalness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Edge wireframe — subtle */}
      <lineSegments ref={edgeRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={color} transparent opacity={0.15} />
      </lineSegments>

      {/* Corner accents — brighter, thicker feel */}
      <lineSegments ref={cornerRef} geometry={cornerGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </lineSegments>

      {/* Ground glow disc */}
      <mesh
        ref={glowDiscRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -size[1] / 2 + 0.01, 0]}
      >
        <circleGeometry args={[glowRadius, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

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
              background: `${group.color}18`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${group.color}40`,
              borderRadius: '20px',
              padding: '4px 14px',
              color: group.color,
              fontSize: '12px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: isGroupActive ? `0 0 16px ${group.color}30` : 'none',
              transition: 'box-shadow 0.5s ease',
            }}
          >
            {group.name}
          </div>
        </Html>
      )}
    </group>
  )
}
