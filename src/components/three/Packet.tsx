import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { K8sComponent, PacketAnimation as PacketAnimationType, TrailType } from '@/types'

const TRAIL_COUNT = 24
const TRAIL_SPREAD = 0.02

interface PacketProps {
  packet: PacketAnimationType
  nodes: K8sComponent[]
  connectionFrom: string
  connectionTo: string
  isPlaying: boolean
  speed?: number
  connectionType?: string
}

/** Infer trail visual style from connection type if not explicitly set */
function inferTrailType(connectionType?: string): TrailType {
  switch (connectionType) {
    case 'control': return 'pulse'
    case 'data': return 'stream'
    case 'network': return 'wave'
    case 'external': return 'spark'
    default: return 'stream'
  }
}

/** Easing: fast start, slow end */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** GPU-instanced particle trail that flows along a connection curve */
export default function Packet({
  packet,
  nodes,
  connectionFrom,
  connectionTo,
  isPlaying,
  speed = 1,
  connectionType,
}: PacketProps) {
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const burstRef = useRef<THREE.Mesh>(null)
  const progress = useRef(0)
  const delayTimer = useRef(0)
  const started = useRef(false)
  const burstProgress = useRef(-1) // -1 = inactive
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const fromNode = nodes.find(n => n.id === connectionFrom)
  const toNode = nodes.find(n => n.id === connectionTo)

  const trailType = packet.trailType || inferTrailType(connectionType)

  const curve = useMemo(() => {
    if (!fromNode || !toNode) return null
    const from = new THREE.Vector3(...fromNode.position)
    const to = new THREE.Vector3(...toNode.position)
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
    mid.y += from.distanceTo(to) * 0.22

    if (packet.reverse) {
      return new THREE.CatmullRomCurve3([to, mid, from])
    }
    return new THREE.CatmullRomCurve3([from, mid, to])
  }, [fromNode, toNode, packet.reverse])

  /* Destination position for burst effect */
  const destPos = useMemo(() => {
    if (!fromNode || !toNode) return new THREE.Vector3()
    return packet.reverse
      ? new THREE.Vector3(...fromNode.position)
      : new THREE.Vector3(...toNode.position)
  }, [fromNode, toNode, packet.reverse])

  /* Per-particle random offsets for organic feel */
  const particleSeeds = useMemo(() => {
    return Array.from({ length: TRAIL_COUNT }, () => ({
      offsetX: (Math.random() - 0.5) * TRAIL_SPREAD * 2,
      offsetY: (Math.random() - 0.5) * TRAIL_SPREAD * 2,
      offsetZ: (Math.random() - 0.5) * TRAIL_SPREAD * 2,
      sizeVariance: 0.6 + Math.random() * 0.8,
    }))
  }, [])

  /* Trail spacing depends on type */
  const trailSpacing = useMemo(() => {
    switch (trailType) {
      case 'pulse': return 0.012  // tight cluster
      case 'stream': return 0.018 // fluid spacing
      case 'wave': return 0.025   // wider gaps
      case 'spark': return 0.015
      default: return 0.018
    }
  }, [trailType])

  /* Reset on replay */
  useEffect(() => {
    progress.current = 0
    delayTimer.current = 0
    started.current = false
    burstProgress.current = -1
  }, [isPlaying])

  useFrame((_, delta) => {
    if (!instancedRef.current || !curve || !isPlaying) return

    /* Handle delay */
    if (!started.current) {
      delayTimer.current += delta * 1000
      if (delayTimer.current < (packet.delay || 0)) {
        /* Hide all instances during delay */
        for (let i = 0; i < TRAIL_COUNT; i++) {
          dummy.position.set(0, -100, 0)
          dummy.scale.setScalar(0)
          dummy.updateMatrix()
          instancedRef.current.setMatrixAt(i, dummy.matrix)
        }
        instancedRef.current.instanceMatrix.needsUpdate = true
        return
      }
      started.current = true
    }

    /* Move along curve */
    const baseSpeed = delta * speed * (packet.speed || 1) * 0.35
    progress.current += baseSpeed

    /* Check for arrival — trigger burst */
    if (progress.current >= 1) {
      if (burstProgress.current < 0) {
        burstProgress.current = 0
      }
      progress.current = 0
    }

    const time = Date.now() * 0.001

    /* Position each particle along the trail */
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const trailOffset = i * trailSpacing
      let t = progress.current - trailOffset

      /* Wave effect: add sine displacement to trail spacing */
      if (trailType === 'wave') {
        t += Math.sin(time * 4 + i * 0.5) * 0.008
      }

      /* Clamp to valid range */
      if (t < 0 || t > 1) {
        dummy.position.set(0, -100, 0)
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        instancedRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      const easedT = easeInOutCubic(t)
      const point = curve.getPoint(easedT)
      const seed = particleSeeds[i]

      /* Add organic jitter */
      point.x += seed.offsetX
      point.y += seed.offsetY
      point.z += seed.offsetZ

      /* Spark type: extra jitter */
      if (trailType === 'spark') {
        point.x += Math.sin(time * 12 + i) * 0.03
        point.y += Math.cos(time * 10 + i * 1.3) * 0.03
      }

      dummy.position.copy(point)

      /* Size: lead particle is largest, tail fades */
      const falloff = 1 - (i / TRAIL_COUNT)
      let particleSize: number

      switch (trailType) {
        case 'pulse':
          // Sharp leading edge, quick falloff
          particleSize = Math.pow(falloff, 2) * 0.1 * seed.sizeVariance
          break
        case 'stream':
          // Smooth even distribution
          particleSize = falloff * 0.07 * seed.sizeVariance
          break
        case 'wave':
          // Undulating size
          particleSize = (0.5 + 0.5 * Math.sin(time * 6 + i * 0.8)) * falloff * 0.08 * seed.sizeVariance
          break
        case 'spark':
          // Flickering
          particleSize = (Math.random() * 0.5 + 0.5) * falloff * 0.09 * seed.sizeVariance
          break
        default:
          particleSize = falloff * 0.07 * seed.sizeVariance
      }

      dummy.scale.setScalar(Math.max(particleSize, 0.01))
      dummy.updateMatrix()
      instancedRef.current.setMatrixAt(i, dummy.matrix)
    }

    instancedRef.current.instanceMatrix.needsUpdate = true

    /* Burst effect at destination */
    if (burstRef.current && burstProgress.current >= 0) {
      burstProgress.current += delta * 3
      const bp = burstProgress.current
      const burstScale = bp * 1.5
      burstRef.current.scale.setScalar(burstScale)
      const mat = burstRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 0.6 * (1 - bp))
      burstRef.current.position.copy(destPos)
      burstRef.current.visible = true

      if (bp > 1) {
        burstProgress.current = -1
        burstRef.current.visible = false
      }
    }
  })

  if (!fromNode || !toNode || !curve) return null

  /* Use a single bright color for all flows so they're always visible */
  const color = new THREE.Color('#00ffff')

  return (
    <group>
      {/* Instanced particle trail */}
      <instancedMesh
        ref={instancedRef}
        args={[undefined, undefined, TRAIL_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>



      {/* Arrival burst ring */}
      <mesh ref={burstRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.35, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
