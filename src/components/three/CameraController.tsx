import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/stores/useAppStore'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CameraControllerProps {
  defaultPosition?: [number, number, number]
  defaultTarget?: [number, number, number]
}

/** Orbit controls with smooth camera transitions and focus-on-component support */
export default function CameraController({
  defaultPosition = [12, 8, 12],
  defaultTarget = [0, 0, 0],
}: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()

  const autoRotate = useAppStore(s => s.autoRotate)
  const shouldReset = useAppStore(s => s.shouldResetCamera)
  const focusTarget = useAppStore(s => s.focusTarget)
  const setFocusTarget = useAppStore(s => s.setFocusTarget)

  const targetPos = useRef(new THREE.Vector3(...defaultPosition))
  const targetLookAt = useRef(new THREE.Vector3(...defaultTarget))
  const isAnimating = useRef(false)

  /* Reset camera */
  useEffect(() => {
    if (shouldReset > 0) {
      targetPos.current.set(...defaultPosition)
      targetLookAt.current.set(...defaultTarget)
      isAnimating.current = true
    }
  }, [shouldReset, defaultPosition, defaultTarget])

  /* Focus on component */
  useEffect(() => {
    if (focusTarget) {
      const [x, y, z] = focusTarget
      targetLookAt.current.set(x, y, z)
      /* Position camera at an offset from the target */
      targetPos.current.set(x + 4, y + 3, z + 5)
      isAnimating.current = true
      setFocusTarget(null)
    }
  }, [focusTarget, setFocusTarget])

  /* Smooth camera animation */
  useFrame(() => {
    if (!controlsRef.current || !isAnimating.current) return

    const speed = 0.04
    camera.position.lerp(targetPos.current, speed)
    controlsRef.current.target.lerp(targetLookAt.current, speed)
    controlsRef.current.update()

    const dist = camera.position.distanceTo(targetPos.current)
    if (dist < 0.05) {
      isAnimating.current = false
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={30}
      maxPolarAngle={Math.PI * 0.85}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      makeDefault
    />
  )
}
