import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import CameraController from './CameraController'
import GridFloor from './GridFloor'
import K8sNode from './K8sNode'
import Connection from './Connection'
import Packet from './Packet'
import GroupBox from './GroupBox'
import { useAppStore } from '@/stores/useAppStore'
import { getDiagramById } from '@/data/registry'

/** Main 3D scene that renders the active diagram */
export default function Scene() {
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const isPlaying = useAppStore(s => s.isPlaying)
  const currentStepIndex = useAppStore(s => s.currentStepIndex)
  const playbackSpeed = useAppStore(s => s.playbackSpeed)

  const diagram = getDiagramById(activeDiagramId)

  const currentStep = useMemo(() => {
    if (!diagram?.steps || diagram.steps.length === 0) return null
    return diagram.steps[currentStepIndex] || null
  }, [diagram, currentStepIndex])

  const activeNodeIds = useMemo(() => {
    return new Set(currentStep?.activeNodes || [])
  }, [currentStep])

  const highlightedConnectionIds = useMemo(() => {
    return new Set(currentStep?.highlightConnections || [])
  }, [currentStep])

  if (!diagram) return null

  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{
        position: diagram.defaultCamera?.position || [12, 8, 12],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      style={{ background: '#060a14' }}
      onPointerMissed={() => useAppStore.getState().setSelectedComponent(null)}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.3} color="#8b5cf6" />
        <pointLight position={[5, 3, 5]} intensity={0.2} color="#06b6d4" />

        <Environment preset="night" />

        {/* Camera */}
        <CameraController
          defaultPosition={diagram.defaultCamera?.position}
          defaultTarget={diagram.defaultCamera?.target}
        />

        {/* Grid floor */}
        <GridFloor />

        {/* Group bounding boxes */}
        {diagram.groups.map(group => (
          <GroupBox key={group.id} group={group} />
        ))}

        {/* Connections */}
        {diagram.connections.map(conn => (
          <Connection
            key={conn.id}
            connection={conn}
            nodes={diagram.nodes}
            isHighlighted={highlightedConnectionIds.has(conn.id)}
          />
        ))}

        {/* Nodes */}
        {diagram.nodes.map(node => (
          <K8sNode
            key={node.id}
            data={node}
            isActive={activeNodeIds.has(node.id)}
          />
        ))}

        {/* Animated packets for current step */}
        {isPlaying && currentStep?.packets?.map(packet => {
          const conn = diagram.connections.find(c => c.id === packet.connectionId)
          if (!conn) return null
          return (
            <Packet
              key={packet.id}
              packet={packet}
              nodes={diagram.nodes}
              connectionFrom={conn.from}
              connectionTo={conn.to}
              isPlaying={isPlaying}
              speed={playbackSpeed}
            />
          )
        })}

        {/* Postprocessing */}
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.6} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
