import type * as THREE from 'three'

/* ===== K8s Component Types ===== */
export type K8sCategory =
  | 'control-plane'
  | 'worker-node'
  | 'networking'
  | 'storage'
  | 'workload'
  | 'external'
  | 'security'

export type K8sShape = 'box' | 'cylinder' | 'sphere' | 'hexagon' | 'octagon' | 'diamond'

export interface K8sComponent {
  id: string
  name: string
  shortName?: string
  category: K8sCategory
  shape: K8sShape
  color: string
  position: [number, number, number]
  scale?: [number, number, number]
  description: string
  responsibilities: string[]
  ports?: string[]
  apis?: string[]
  relatedObjects?: string[]
  parentId?: string
  yamlExample?: string
  kubectlCommands?: { command: string; description: string }[]
  interviewQuestions?: { question: string; answer: string }[]
  debuggingTips?: string[]
  failureScenarios?: string[]
}

export interface K8sConnection {
  id: string
  from: string
  to: string
  label?: string
  type: 'control' | 'data' | 'network' | 'storage' | 'external'
  animated?: boolean
  bidirectional?: boolean
  color?: string
}

export interface K8sGroup {
  id: string
  name: string
  category: K8sCategory
  color: string
  position: [number, number, number]
  size: [number, number, number]
  children: string[]
}

/* ===== Animation Types ===== */
export interface PacketAnimation {
  id: string
  connectionId: string
  color: string
  speed?: number
  delay?: number
  reverse?: boolean
}

export interface AnimationStep {
  id: string
  title: string
  description: string
  duration: number
  activeNodes: string[]
  highlightConnections?: string[]
  packets?: PacketAnimation[]
  cameraTarget?: [number, number, number]
  cameraPosition?: [number, number, number]
  highlights?: string[]
}

/* ===== Diagram Types ===== */
export interface DiagramConfig {
  id: string
  name: string
  description: string
  icon: string
  category: string
  nodes: K8sComponent[]
  connections: K8sConnection[]
  groups: K8sGroup[]
  steps?: AnimationStep[]
  defaultCamera?: {
    position: [number, number, number]
    target: [number, number, number]
  }
}

/* ===== UI State Types ===== */
export interface ViewState {
  showLabels: boolean
  explodedView: boolean
  wireframeMode: boolean
  autoRotate: boolean
}

/* ===== Camera Types ===== */
export interface CameraState {
  position: THREE.Vector3
  target: THREE.Vector3
}
