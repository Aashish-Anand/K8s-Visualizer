import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { K8sConnection, K8sComponent } from '@/types'
import { useAppStore } from '@/stores/useAppStore'

interface ConnectionProps {
  connection: K8sConnection
  nodes: K8sComponent[]
  isHighlighted?: boolean
}

/* Type-specific visual config */
const TYPE_CONFIG: Record<string, { color: string; dashSize: number; gapSize: number; lineWidth: number }> = {
  control: { color: '#8b5cf6', dashSize: 0.12, gapSize: 0.06, lineWidth: 1.5 },
  data:    { color: '#10b981', dashSize: 0.25, gapSize: 0.12, lineWidth: 1 },
  network: { color: '#06b6d4', dashSize: 0.18, gapSize: 0.10, lineWidth: 1 },
  storage: { color: '#f59e0b', dashSize: 0.3,  gapSize: 0.2,  lineWidth: 1.5 },
  external:{ color: '#ec4899', dashSize: 0.15, gapSize: 0.08, lineWidth: 1 },
}

/** Animated connection line between two K8s components with type differentiation */
export default function Connection({ connection, nodes, isHighlighted = false }: ConnectionProps) {
  const lineRef = useRef<THREE.Line>(null)
  const glowTubeRef = useRef<THREE.Mesh>(null)
  const arrowRef = useRef<THREE.Mesh>(null)
  const dashOffset = useRef(0)

  const selectedId = useAppStore(s => s.selectedComponentId)
  const exploded = useAppStore(s => s.explodedView)

  const fromNode = nodes.find(n => n.id === connection.from)
  const toNode = nodes.find(n => n.id === connection.to)

  if (!fromNode || !toNode) return null

  const factor = exploded ? 1.4 : 1
  const typeConfig = TYPE_CONFIG[connection.type] || TYPE_CONFIG.data

  const fromPos = useMemo(() =>
    new THREE.Vector3(
      fromNode.position[0] * factor,
      fromNode.position[1] * factor,
      fromNode.position[2] * factor
    ), [fromNode.position, factor])

  const toPos = useMemo(() =>
    new THREE.Vector3(
      toNode.position[0] * factor,
      toNode.position[1] * factor,
      toNode.position[2] * factor
    ), [toNode.position, factor])

  /* Curved path via midpoint arc */
  const curve = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5)
    const dist = fromPos.distanceTo(toPos)
    mid.y += dist * 0.15

    return new THREE.CatmullRomCurve3([fromPos, mid, toPos])
  }, [fromPos, toPos])

  const points = useMemo(() => curve.getPoints(48), [curve])

  /* Glow tube geometry for highlighted connections */
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.035, 8, false)
  }, [curve])

  /* Arrow direction at the endpoint */
  const arrowData = useMemo(() => {
    const endPoint = curve.getPoint(0.92)
    const tipPoint = curve.getPoint(0.98)
    const direction = new THREE.Vector3().subVectors(tipPoint, endPoint).normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    )
    return { position: tipPoint, quaternion }
  }, [curve])

  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const color = connection.color || typeConfig.color
    const material = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      dashSize: typeConfig.dashSize,
      gapSize: typeConfig.gapSize,
    })
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    return line
  }, [points, connection, typeConfig])

  const isRelated = selectedId === connection.from || selectedId === connection.to
  const targetOpacity = isHighlighted ? 0.95 : isRelated ? 0.7 : selectedId ? 0.08 : 0.25

  /* Animate dash offset + glow tube */
  useFrame((_, delta) => {
    if (!lineObject) return
    const mat = lineObject.material as THREE.LineDashedMaterial & { dashOffset: number }

    if (connection.animated || isHighlighted) {
      dashOffset.current -= delta * (isHighlighted ? 3 : 2)
      mat.dashOffset = dashOffset.current
    }

    /* Smooth opacity transition */
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 5)

    /* Glow tube visibility */
    if (glowTubeRef.current) {
      const tubeMat = glowTubeRef.current.material as THREE.MeshBasicMaterial
      if (isHighlighted) {
        glowTubeRef.current.visible = true
        tubeMat.opacity = 0.12 + Math.sin(Date.now() * 0.004) * 0.06
      } else {
        glowTubeRef.current.visible = false
      }
    }

    /* Arrow visibility */
    if (arrowRef.current) {
      const arrowMat = arrowRef.current.material as THREE.MeshBasicMaterial
      arrowMat.opacity = THREE.MathUtils.lerp(arrowMat.opacity, isHighlighted ? 0.9 : isRelated ? 0.5 : 0.15, delta * 5)
    }
  })

  /* Cleanup */
  useEffect(() => {
    return () => {
      lineObject.geometry.dispose()
      ;(lineObject.material as THREE.Material).dispose()
      tubeGeometry.dispose()
    }
  }, [lineObject, tubeGeometry])

  const lineColor = connection.color || typeConfig.color

  return (
    <group>
      {/* Main dashed line */}
      <primitive object={lineObject} />

      {/* Glow tube — only visible when highlighted */}
      <mesh ref={glowTubeRef} geometry={tubeGeometry} visible={false}>
        <meshBasicMaterial
          color={lineColor}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Directional arrow at endpoint */}
      <mesh
        ref={arrowRef}
        position={arrowData.position}
        quaternion={arrowData.quaternion}
      >
        <coneGeometry args={[0.06, 0.18, 6]} />
        <meshBasicMaterial
          color={lineColor}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
