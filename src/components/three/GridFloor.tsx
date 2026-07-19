import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* Radial fade shader for floor — fades grid into darkness at edges */
const radialFadeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const radialFadeFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;

    /* Radial fade */
    float fade = 1.0 - smoothstep(0.3, 1.0, dist);

    /* Subtle scanning line */
    float scanAngle = uTime * 0.3;
    float angle = atan(center.y, center.x);
    float scanLine = smoothstep(0.04, 0.0, abs(mod(angle - scanAngle, 6.283) - 3.14159));
    scanLine *= (1.0 - dist) * 0.15;

    float alpha = fade * 0.35 + scanLine;
    gl_FragColor = vec4(uColor, alpha);
  }
`

/** Atmospheric reference grid floor with radial fade and scanning lines */
export default function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null)
  const shaderRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color('#0a0e1a') },
    uTime: { value: 0 },
  }), [])

  useFrame((_, delta) => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material
      if (Array.isArray(mat)) {
        mat.forEach(m => {
          if ('opacity' in m) m.opacity = 0.07
        })
      } else if ('opacity' in mat) {
        mat.opacity = 0.07
      }
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <group position={[0, -4, 0]}>
      <gridHelper
        ref={gridRef as never}
        args={[40, 40, '#1e40af', '#1e293b']}
      />

      {/* Radial-fading floor plane with scan line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 40]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={radialFadeVertexShader}
          fragmentShader={radialFadeFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
