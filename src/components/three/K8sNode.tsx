import { useRef, useState, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/stores/useAppStore'
import type { K8sComponent, NodeState } from '@/types'

interface K8sNodeProps {
  data: K8sComponent
  isActive?: boolean
  nodeState?: NodeState
  statusBadge?: 'healthy' | 'processing' | 'warning' | 'failed'
}

/* Status badge icons — simple unicode for perf */
const BADGE_CONFIG: Record<string, { icon: string; color: string }> = {
  healthy:    { icon: '✓', color: '#10b981' },
  processing: { icon: '⟳', color: '#3b82f6' },
  warning:    { icon: '⚠', color: '#f59e0b' },
  failed:     { icon: '✗', color: '#ef4444' },
}

/** Spring-based float: decaying oscillation instead of raw Math.sin */
function springFloat(time: number, amplitude: number, frequency: number, damping: number): number {
  const t = (time % 4000) / 4000
  return amplitude * Math.sin(t * Math.PI * 2 * frequency) * Math.exp(-damping * t)
}

/** Generic 3D Kubernetes component renderer with rich state transitions */
export default function K8sNode({ data, isActive = false, nodeState = 'idle', statusBadge }: K8sNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  /* Shake state for error */
  const shakeOffset = useRef(new THREE.Vector3())

  const selectedId = useAppStore(s => s.selectedComponentId)
  const hoveredId = useAppStore(s => s.hoveredComponentId)
  const setSelected = useAppStore(s => s.setSelectedComponent)
  const setHoveredStore = useAppStore(s => s.setHoveredComponent)
  const setFocusTarget = useAppStore(s => s.setFocusTarget)
  const showLabels = useAppStore(s => s.showLabels)
  const wireframe = useAppStore(s => s.wireframeMode)
  const exploded = useAppStore(s => s.explodedView)

  const isSelected = selectedId === data.id
  const isHovered = hoveredId === data.id || hovered

  const scale = data.scale || [1, 1, 1]
  const baseColor = new THREE.Color(data.color)



  /* Exploded view offset */
  const position = useMemo<[number, number, number]>(() => {
    if (!exploded) return data.position
    const factor = 1.4
    return [
      data.position[0] * factor,
      data.position[1] * factor,
      data.position[2] * factor,
    ]
  }, [data.position, exploded])

  /* Derive visual properties from nodeState */
  const stateConfig = useMemo(() => {
    switch (nodeState) {
      case 'active':
        return { emissive: 1.0, opacity: 0.4, showRing: true, floatAmp: 0 }
      case 'receiving':
        return { emissive: 0.7, opacity: 0.4, showRing: false, floatAmp: 0 }
      case 'error':
        return { emissive: 0.6, opacity: 0.85, showRing: false, floatAmp: 0 }
      case 'spawning':
        return { emissive: 0.8, opacity: 0.4, showRing: false, floatAmp: 0 }
      case 'dying':
        return { emissive: 0.3, opacity: 0.3, showRing: false, floatAmp: 0 }
      default: // idle
        return { emissive: 0.05, opacity: 1.0, showRing: false, floatAmp: 0 }
    }
  }, [nodeState])

  /* Animation */
  useFrame((_, delta) => {
    if (!meshRef.current) return
    const time = Date.now()

    /* Hover / active scale bounce with spring */
    const targetScale = isHovered ? 1.12 : (nodeState === 'active' || isActive) ? 1.06 : nodeState === 'dying' ? 0.3 : nodeState === 'spawning' ? 1.08 : 1
    const s = meshRef.current.scale
    s.x = THREE.MathUtils.lerp(s.x, scale[0] * targetScale, delta * 6)
    s.y = THREE.MathUtils.lerp(s.y, scale[1] * targetScale, delta * 6)
    s.z = THREE.MathUtils.lerp(s.z, scale[2] * targetScale, delta * 6)

    /* Lock vertical position to standard coordinate (do not shift/float up/down) */
    meshRef.current.position.y = 0

    /* Error shake */
    if (nodeState === 'error') {
      const shakeIntensity = 0.015
      shakeOffset.current.set(
        Math.sin(time * 0.03) * shakeIntensity,
        Math.cos(time * 0.025) * shakeIntensity * 0.5,
        Math.sin(time * 0.035) * shakeIntensity,
      )
      meshRef.current.position.x = shakeOffset.current.x
      meshRef.current.position.z = shakeOffset.current.z
    } else {
      meshRef.current.position.x = 0
      meshRef.current.position.z = 0
    }


  })

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setSelected(data.id)
  }, [data.id, setSelected])

  const handleDoubleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setFocusTarget(position)
  }, [position, setFocusTarget])

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    setHoveredStore(data.id)
    document.body.style.cursor = 'pointer'
  }, [data.id, setHoveredStore])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    setHoveredStore(null)
    document.body.style.cursor = 'default'
  }, [setHoveredStore])

  /* Geometry based on shape */
  const geometry = useMemo(() => {
    switch (data.shape) {
      case 'sphere':
        return <sphereGeometry args={[0.4, 32, 32]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.35, 0.35, 0.6, 32]} />
      case 'hexagon':
        return <cylinderGeometry args={[0.5, 0.5, 0.4, 6]} />
      case 'diamond':
        return <octahedronGeometry args={[0.4]} />
      case 'octagon':
        return <cylinderGeometry args={[0.45, 0.45, 0.4, 8]} />
      case 'box':
      default:
        return <boxGeometry args={[0.7, 0.5, 0.5]} />
    }
  }, [data.shape])

  const emissiveIntensity = nodeState === 'error'
    ? 0.6
    : nodeState === 'active' || isActive
    ? stateConfig.emissive
    : isSelected
    ? 0.5
    : isHovered
    ? 0.3
    : stateConfig.emissive

  const materialColor = nodeState === 'error' ? new THREE.Color('#ef4444') : baseColor
  const materialOpacity = wireframe ? 0.8 : stateConfig.opacity

  return (
    <group position={position}>
      {/* Main mesh */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        {geometry}
        <meshStandardMaterial
          color={materialColor}
          emissive={materialColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.6}
          wireframe={wireframe}
          transparent
          opacity={materialOpacity}
        />
      </mesh>



      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Floating label + status badge */}
      {showLabels && (
        <Html
          position={[0, data.shape === 'sphere' ? 0.6 : 0.5, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            {/* Status badge */}
            {statusBadge && (
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: `${BADGE_CONFIG[statusBadge].color}25`,
                  border: `1.5px solid ${BADGE_CONFIG[statusBadge].color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: BADGE_CONFIG[statusBadge].color,
                  fontWeight: 700,
                  animation: statusBadge === 'processing' ? 'spin 1.5s linear infinite' : undefined,
                }}
              >
                {BADGE_CONFIG[statusBadge].icon}
              </div>
            )}

            {/* Name label */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${isSelected ? '#3b82f6' : nodeState === 'active' || isActive ? data.color : nodeState === 'error' ? '#ef4444' : 'rgba(148,163,184,0.2)'}`,
                borderRadius: '6px',
                padding: '3px 8px',
                color: nodeState === 'error' ? '#ef4444' : (nodeState === 'active' || isActive) ? data.color : '#e2e8f0',
                fontSize: '11px',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: (nodeState === 'active' || isActive) ? 600 : 400,
                whiteSpace: 'nowrap',
                boxShadow: (nodeState === 'active' || isActive)
                  ? `0 0 12px ${data.color}40`
                  : nodeState === 'error'
                  ? '0 0 12px rgba(239, 68, 68, 0.3)'
                  : 'none',
                transition: 'all 0.3s ease',
                opacity: nodeState === 'dying' ? 0.4 : 1,
              }}
            >
              {data.shortName || data.name}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
