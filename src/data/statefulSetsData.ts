import type { K8sComponent, K8sConnection, K8sGroup, AnimationStep } from '@/types'

export const statefulSetsNodes: K8sComponent[] = [
  {
    id: 'api-server',
    name: 'API Server',
    shortName: 'kube-apiserver',
    category: 'control-plane',
    shape: 'hexagon',
    color: '#6366f1',
    position: [0, 4, -4],
    description: 'Central management entity',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'sts-ctrl',
    name: 'StatefulSet Controller',
    shortName: 'Sts Ctrl',
    category: 'control-plane',
    shape: 'box',
    color: '#a855f7',
    position: [3, 4, -4],
    description: 'Manages stateful applications',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pv-ctrl',
    name: 'Volume Controller',
    shortName: 'PV Ctrl',
    category: 'control-plane',
    shape: 'box',
    color: '#a855f7',
    position: [6, 4, -4],
    description: 'Binds and provisions volumes',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-0',
    name: 'web-0 (Primary)',
    shortName: 'web-0',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [-2, 1, 2],
    description: 'First Stateful Pod',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pvc-0',
    name: 'PVC-0',
    shortName: 'pvc-0',
    category: 'storage',
    shape: 'cylinder',
    color: '#f59e0b',
    position: [-2, -1, 2],
    description: 'Persistent Volume Claim 0',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-1',
    name: 'web-1 (Replica)',
    shortName: 'web-1',
    category: 'workload',
    shape: 'sphere',
    color: '#3b82f6',
    position: [2, 1, 2],
    description: 'Second Stateful Pod',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pvc-1',
    name: 'PVC-1',
    shortName: 'pvc-1',
    category: 'storage',
    shape: 'cylinder',
    color: '#f59e0b',
    position: [2, -1, 2],
    description: 'Persistent Volume Claim 1',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  }
]

export const statefulSetsConnections: K8sConnection[] = [
  { id: 'c1', from: 'api-server', to: 'sts-ctrl', type: 'control' },
  { id: 'c2', from: 'api-server', to: 'pv-ctrl', type: 'control' },
  { id: 'c3', from: 'sts-ctrl', to: 'pod-0', type: 'control' },
  { id: 'c4', from: 'sts-ctrl', to: 'pod-1', type: 'control' },
  { id: 'c5', from: 'pod-0', to: 'pvc-0', type: 'storage' },
  { id: 'c6', from: 'pod-1', to: 'pvc-1', type: 'storage' }
]

export const statefulSetsGroups: K8sGroup[] = [
  {
    id: 'control-plane',
    name: 'CONTROL PLANE',
    category: 'control-plane',
    color: '#8b5cf6',
    position: [3, 4, -4],
    size: [10, 3, 3],
    children: [],
  }
]

export const statefulSetsSteps: AnimationStep[] = [
  {
    id: 'step-1',
    title: 'Provision web-0',
    description: 'StatefulSet creates Pod-0. It requires PVC-0 which the Volume Controller provisions.',
    duration: 4000,
    activeNodes: ['api-server', 'sts-ctrl', 'pv-ctrl', 'pod-0', 'pvc-0'],
    highlightConnections: ['c1', 'c2', 'c3', 'c5'],
    packets: [
      { id: 'p1', connectionId: 'c1', color: '#10b981', speed: 1.5, reverse: true },
      { id: 'p2', connectionId: 'c3', color: '#10b981', speed: 1.5, delay: 1000 },
      { id: 'p3', connectionId: 'c2', color: '#f59e0b', speed: 1.5, delay: 2000 },
      { id: 'p4', connectionId: 'c5', color: '#f59e0b', speed: 1.5, delay: 3000 }
    ],
    cameraTarget: [0, 1, -1],
    cameraPosition: [-4, 6, 6]
  },
  {
    id: 'step-2',
    title: 'Wait for web-0 Ready',
    description: 'StatefulSet strictly waits for web-0 to be Running and Ready before continuing.',
    duration: 3000,
    activeNodes: ['sts-ctrl', 'pod-0'],
    highlightConnections: ['c3'],
    packets: [
      { id: 'p5', connectionId: 'c3', color: '#10b981', speed: 1, reverse: true }
    ],
    cameraTarget: [-2, 1, 2],
    cameraPosition: [-4, 4, 8]
  },
  {
    id: 'step-3',
    title: 'Provision web-1',
    description: 'Now that web-0 is Ready, StatefulSet creates web-1 and its dedicated PVC-1.',
    duration: 4000,
    activeNodes: ['api-server', 'sts-ctrl', 'pv-ctrl', 'pod-1', 'pvc-1'],
    highlightConnections: ['c1', 'c2', 'c4', 'c6'],
    packets: [
      { id: 'p6', connectionId: 'c1', color: '#3b82f6', speed: 1.5, reverse: true },
      { id: 'p7', connectionId: 'c4', color: '#3b82f6', speed: 1.5, delay: 1000 },
      { id: 'p8', connectionId: 'c2', color: '#f59e0b', speed: 1.5, delay: 2000 },
      { id: 'p9', connectionId: 'c6', color: '#f59e0b', speed: 1.5, delay: 3000 }
    ],
    cameraTarget: [1, 1, -1],
    cameraPosition: [4, 6, 6]
  },
  {
    id: 'step-4',
    title: 'Update Triggered',
    description: 'StatefulSet is updated. It begins rolling updates in reverse order (web-1 first).',
    duration: 3000,
    activeNodes: ['sts-ctrl', 'pod-1'],
    highlightConnections: ['c4'],
    packets: [
      { id: 'p10', connectionId: 'c4', color: '#ef4444', speed: 1.5 }
    ],
    cameraTarget: [2, 1, 2],
    cameraPosition: [4, 4, 8]
  },
  {
    id: 'step-5',
    title: 'web-1 Recreated',
    description: 'web-1 is recreated and automatically re-attaches to its exact same PVC-1 (data retained).',
    duration: 3000,
    activeNodes: ['sts-ctrl', 'pod-1', 'pvc-1'],
    highlightConnections: ['c4', 'c6'],
    packets: [
      { id: 'p11', connectionId: 'c4', color: '#10b981', speed: 1.5 },
      { id: 'p12', connectionId: 'c6', color: '#f59e0b', speed: 1.5, delay: 1500 }
    ],
    cameraTarget: [2, 1, 2],
    cameraPosition: [4, 4, 8]
  }
]
