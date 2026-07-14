import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { K8sComponent, PacketAnimation as PacketAnimationType } from '@/types'

interface PacketProps {
  packet: PacketAnimationType
  nodes: K8sComponent[]
  connectionFrom: string
  connectionTo: string
  isPlaying: boolean
  speed?: number
}

/** Glowing animated packet that travels along a connection path */
export default function Packet({ packet, nodes, connectionFrom, connectionTo, isPlaying, speed = 1 }: PacketProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Mesh>(null)
  const progress = useRef(0)
  const delayTimer = useRef(0)
  const started = useRef(false)

  const fromNode = nodes.find(n => n.id === connectionFrom)
  const toNode = nodes.find(n => n.id === connectionTo)

  const curve = useMemo(() => {
    if (!fromNode || !toNode) return null
    const from = new THREE.Vector3(...fromNode.position)
    const to = new THREE.Vector3(...toNode.position)
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
    mid.y += from.distanceTo(to) * 0.2

    if (packet.reverse) {
      return new THREE.CatmullRomCurve3([to, mid, from])
    }
    return new THREE.CatmullRomCurve3([from, mid, to])
  }, [fromNode, toNode, packet.reverse])

  useFrame((_, delta) => {
    if (!meshRef.current || !curve || !isPlaying) return

    /* Handle delay */
    if (!started.current) {
      delayTimer.current += delta * 1000
      if (delayTimer.current < (packet.delay || 0)) return
      started.current = true
    }

    /* Move along curve */
    progress.current += delta * speed * (packet.speed || 1) * 0.4
    if (progress.current > 1) {
      progress.current = 0
    }

    const point = curve.getPoint(progress.current)
    meshRef.current.position.copy(point)

    /* Trail follows slightly behind */
    if (trailRef.current) {
      const trailPoint = curve.getPoint(Math.max(0, progress.current - 0.05))
      trailRef.current.position.copy(trailPoint)
    }
  })

  if (!fromNode || !toNode || !curve) return null

  const color = new THREE.Color(packet.color)

  return (
    <group>
      {/* Main packet */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>

      {/* Glow */}
      <mesh ref={meshRef} scale={[2.5, 2.5, 2.5]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Trail */}
      <mesh ref={trailRef}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
