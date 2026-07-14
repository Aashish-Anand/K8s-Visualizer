import * as THREE from 'three'

/** Create a curved path between two 3D points with a natural arc */
export function createCurvedPath(
  from: [number, number, number],
  to: [number, number, number],
  arcHeight = 0.5
): THREE.CatmullRomCurve3 {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  mid.y += arcHeight

  return new THREE.CatmullRomCurve3([start, mid, end])
}

/** Create a hexagonal prism geometry */
export function createHexagonGeometry(radius = 0.5, height = 0.4): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, height, 6)
}

/** Lerp between two Vector3 values */
export function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

/** Calculate the distance between two 3D points */
export function distance3D(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  )
}

/** Get exploded view offset for a position relative to center */
export function getExplodedOffset(
  position: [number, number, number],
  center: [number, number, number] = [0, 0, 0],
  factor = 1.5
): [number, number, number] {
  const dir = [
    position[0] - center[0],
    position[1] - center[1],
    position[2] - center[2],
  ] as [number, number, number]

  return [
    position[0] + dir[0] * (factor - 1),
    position[1] + dir[1] * (factor - 1),
    position[2] + dir[2] * (factor - 1),
  ]
}
