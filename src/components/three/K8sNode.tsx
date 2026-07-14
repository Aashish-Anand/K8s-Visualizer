import { useRef, useState, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/stores/useAppStore'
import type { K8sComponent } from '@/types'

interface K8sNodeProps {
  data: K8sComponent
  isActive?: boolean
}

/** Generic 3D Kubernetes component renderer */
export default function K8sNode({ data, isActive = false }: K8sNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

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

  /* Animation */
  useFrame((_, delta) => {
    if (!meshRef.current) return

    /* Hover scale bounce */
    const targetScale = isHovered ? 1.12 : isActive ? 1.06 : 1
    const s = meshRef.current.scale
    s.x = THREE.MathUtils.lerp(s.x, scale[0] * targetScale, delta * 8)
    s.y = THREE.MathUtils.lerp(s.y, scale[1] * targetScale, delta * 8)
    s.z = THREE.MathUtils.lerp(s.z, scale[2] * targetScale, delta * 8)

    /* Active floating */
    if (isActive) {
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003) * 0.06
    }

    /* Glow pulse */
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial
      if (isActive || isSelected) {
        glowMat.opacity = 0.15 + Math.sin(Date.now() * 0.004) * 0.1
        glowRef.current.visible = true
      } else {
        glowRef.current.visible = false
      }
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

  const emissiveIntensity = isActive ? 0.8 : isSelected ? 0.5 : isHovered ? 0.3 : 0.05

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
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.6}
          wireframe={wireframe}
          transparent
          opacity={wireframe ? 0.8 : 0.92}
        />
      </mesh>

      {/* Selection / active glow */}
      <mesh ref={glowRef} scale={[1.6, 1.6, 1.6]} visible={false}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Floating label */}
      {showLabels && (
        <Html
          position={[0, data.shape === 'sphere' ? 0.6 : 0.5, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${isSelected ? '#3b82f6' : isActive ? data.color : 'rgba(148,163,184,0.2)'}`,
              borderRadius: '6px',
              padding: '3px 8px',
              color: isActive ? data.color : '#e2e8f0',
              fontSize: '11px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: isActive ? 600 : 400,
              whiteSpace: 'nowrap',
              boxShadow: isActive ? `0 0 12px ${data.color}40` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {data.shortName || data.name}
          </div>
        </Html>
      )}
    </group>
  )
}
