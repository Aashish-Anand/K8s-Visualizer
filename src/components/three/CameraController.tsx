import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/stores/useAppStore'
import { getDiagramById } from '@/data/registry'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CameraControllerProps {
  defaultPosition?: [number, number, number]
  defaultTarget?: [number, number, number]
}

/** Cubic-bezier easing for cinematic feel */
function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

/** Orbit controls with cinematic camera choreography during animation playback */
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
  const cinematicMode = useAppStore(s => s.cinematicMode)
  const currentStepIndex = useAppStore(s => s.currentStepIndex)
  const activeDiagramId = useAppStore(s => s.activeDiagramId)

  const targetPos = useRef(new THREE.Vector3(...defaultPosition))
  const targetLookAt = useRef(new THREE.Vector3(...defaultTarget))
  const isAnimating = useRef(false)

  /* Cinematic transition state */
  const transitionStart = useRef(new THREE.Vector3())
  const transitionEnd = useRef(new THREE.Vector3())
  const lookAtStart = useRef(new THREE.Vector3())
  const lookAtEnd = useRef(new THREE.Vector3())
  const transitionProgress = useRef(1) // 1 = complete
  const transitionDuration = 1.5 // seconds

  /* Reset camera */
  useEffect(() => {
    if (shouldReset > 0) {
      targetPos.current.set(...defaultPosition)
      targetLookAt.current.set(...defaultTarget)
      isAnimating.current = true
      transitionProgress.current = 1 // skip cinematic, use simple lerp
    }
  }, [shouldReset, defaultPosition, defaultTarget])

  /* Focus on component */
  useEffect(() => {
    if (focusTarget) {
      const [x, y, z] = focusTarget
      targetLookAt.current.set(x, y, z)
      targetPos.current.set(x + 4, y + 3, z + 5)
      isAnimating.current = true
      transitionProgress.current = 1 // use simple lerp for manual focus
      setFocusTarget(null)
    }
  }, [focusTarget, setFocusTarget])

  /* Camera choreography: react to step changes */
  useEffect(() => {
    if (!cinematicMode) return

    const diagram = getDiagramById(activeDiagramId)
    if (!diagram?.steps) return

    const step = diagram.steps[currentStepIndex]
    if (!step) return

    const hasCameraInfo = step.cameraPosition || step.cameraTarget

    if (hasCameraInfo) {
      /* Start cinematic transition */
      transitionStart.current.copy(camera.position)
      if (controlsRef.current) {
        lookAtStart.current.copy(controlsRef.current.target)
      }

      if (step.cameraTarget) {
        lookAtEnd.current.set(...step.cameraTarget)
      } else if (controlsRef.current) {
        lookAtEnd.current.copy(controlsRef.current.target)
      }

      if (step.cameraPosition) {
        const camPos = new THREE.Vector3(...step.cameraPosition)
        /* Scale camera position outward from target to prevent too-close zoom */
        const target = lookAtEnd.current.clone()
        const direction = camPos.clone().sub(target).normalize()
        const dist = camPos.distanceTo(target)
        const minDist = 10 // minimum comfortable distance
        const scaledDist = Math.max(dist * 1.8, minDist)
        transitionEnd.current.copy(target).add(direction.multiplyScalar(scaledDist))
      } else {
        transitionEnd.current.copy(camera.position)
      }

      transitionProgress.current = 0
      isAnimating.current = true
    }
  }, [currentStepIndex, cinematicMode, activeDiagramId])

  /* Smooth camera animation */
  useFrame((_, delta) => {
    if (!controlsRef.current) return

    /* Cinematic transition (eased interpolation) */
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta / transitionDuration)
      const t = easeInOutQuart(transitionProgress.current)

      camera.position.lerpVectors(transitionStart.current, transitionEnd.current, t)
      controlsRef.current.target.lerpVectors(lookAtStart.current, lookAtEnd.current, t)
      controlsRef.current.update()

      if (transitionProgress.current >= 1) {
        isAnimating.current = false
      }
      return
    }

    /* Simple lerp for manual interactions (reset, focus) */
    if (!isAnimating.current) return

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
