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

/** Animated connection line between two K8s components */
export default function Connection({ connection, nodes, isHighlighted = false }: ConnectionProps) {
  const lineRef = useRef<THREE.Line>(null)
  const dashOffset = useRef(0)

  const selectedId = useAppStore(s => s.selectedComponentId)
  const exploded = useAppStore(s => s.explodedView)

  const fromNode = nodes.find(n => n.id === connection.from)
  const toNode = nodes.find(n => n.id === connection.to)

  if (!fromNode || !toNode) return null

  const factor = exploded ? 1.4 : 1

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

  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({
      color: getLineColor(connection),
      transparent: true,
      opacity: 0.3,
      dashSize: 0.2,
      gapSize: 0.15,
    })
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    return line
  }, [points, connection])

  const isRelated = selectedId === connection.from || selectedId === connection.to
  const opacity = isHighlighted ? 0.9 : isRelated ? 0.7 : selectedId ? 0.12 : 0.3

  /* Animate dash offset */
  useFrame((_, delta) => {
    if (!lineObject) return
    const mat = lineObject.material as THREE.LineDashedMaterial & { dashOffset: number }
    if (connection.animated || isHighlighted) {
      dashOffset.current -= delta * 2
      mat.dashOffset = dashOffset.current
    }
    mat.dashSize = isHighlighted ? 0.15 : 0.2
    mat.gapSize = isHighlighted ? 0.08 : 0.15
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity, delta * 5)
  })

  /* Cleanup */
  useEffect(() => {
    return () => {
      lineObject.geometry.dispose()
      ;(lineObject.material as THREE.Material).dispose()
    }
  }, [lineObject])

  return <primitive object={lineObject} />
}

function getLineColor(connection: K8sConnection): string {
  if (connection.color) return connection.color
  switch (connection.type) {
    case 'control': return '#8b5cf6'
    case 'data': return '#10b981'
    case 'network': return '#06b6d4'
    case 'storage': return '#f59e0b'
    case 'external': return '#ec4899'
    default: return '#64748b'
  }
}
