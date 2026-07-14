import type { K8sComponent, K8sConnection, K8sGroup, AnimationStep } from '@/types'

export const podSchedulingNodes: K8sComponent[] = [
  {
    id: 'api-server',
    name: 'API Server',
    shortName: 'kube-apiserver',
    category: 'control-plane',
    shape: 'hexagon',
    color: '#6366f1',
    position: [0, 2, -2],
    description: 'Central management entity',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    shortName: 'kube-scheduler',
    category: 'control-plane',
    shape: 'box',
    color: '#a855f7',
    position: [4, 2, -2],
    description: 'Assigns pods to nodes',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'node-1',
    name: 'Worker Node 1',
    shortName: 'node-1',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [-4, 0, 4],
    description: 'High CPU Node',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'node-2',
    name: 'Worker Node 2',
    shortName: 'node-2',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [0, 0, 4],
    description: 'Low Memory Node',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'node-3',
    name: 'Worker Node 3',
    shortName: 'node-3',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [4, 0, 4],
    description: 'GPU Node',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'new-pod',
    name: 'New Pod (Pending)',
    shortName: 'pod',
    category: 'workload',
    shape: 'sphere',
    color: '#f59e0b',
    position: [4, 4, -2],
    description: 'Unassigned Pod',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  }
]

export const podSchedulingConnections: K8sConnection[] = [
  { id: 'c1', from: 'api-server', to: 'scheduler', type: 'control' },
  { id: 'c2', from: 'scheduler', to: 'node-1', type: 'control' },
  { id: 'c3', from: 'scheduler', to: 'node-2', type: 'control' },
  { id: 'c4', from: 'scheduler', to: 'node-3', type: 'control' },
  { id: 'c5', from: 'api-server', to: 'node-3', type: 'control' }
]

export const podSchedulingGroups: K8sGroup[] = [
  {
    id: 'control-plane',
    name: 'CONTROL PLANE',
    category: 'control-plane',
    color: '#8b5cf6',
    position: [2, 2, -2],
    size: [10, 4, 4],
    children: [],
  },
  {
    id: 'nodes',
    name: 'WORKER NODES',
    category: 'worker-node',
    color: '#3b82f6',
    position: [0, 0, 4],
    size: [14, 3, 4],
    children: [],
  }
]

export const podSchedulingSteps: AnimationStep[] = [
  {
    id: 'step-1',
    title: 'Pod Creation',
    description: 'A new Pod is created via API server and its status is marked as Pending.',
    duration: 3000,
    activeNodes: ['api-server', 'new-pod'],
    highlightConnections: [],
    packets: [],
    cameraTarget: [0, 2, -2],
    cameraPosition: [0, 8, 8]
  },
  {
    id: 'step-2',
    title: 'Scheduler Notification',
    description: 'The Scheduler watches for unassigned Pods and notices the new Pending Pod.',
    duration: 3000,
    activeNodes: ['api-server', 'scheduler', 'new-pod'],
    highlightConnections: ['c1'],
    packets: [{ id: 'p1', connectionId: 'c1', color: '#8b5cf6', speed: 1.5 }],
    cameraTarget: [2, 2, -2],
    cameraPosition: [4, 6, 8]
  },
  {
    id: 'step-3',
    title: 'Filtering (Predicates)',
    description: 'Scheduler filters out nodes that do not meet resource requirements (e.g. Node 2 is full).',
    duration: 4000,
    activeNodes: ['scheduler', 'node-1', 'node-2', 'node-3'],
    highlightConnections: ['c2', 'c3', 'c4'],
    packets: [
      { id: 'p2', connectionId: 'c2', color: '#10b981', speed: 1 },
      { id: 'p3', connectionId: 'c3', color: '#ef4444', speed: 1 },
      { id: 'p4', connectionId: 'c4', color: '#10b981', speed: 1 }
    ],
    cameraTarget: [0, 1, 1],
    cameraPosition: [6, 5, 8]
  },
  {
    id: 'step-4',
    title: 'Scoring (Priorities)',
    description: 'Scheduler scores remaining nodes. Node 3 scores highest based on affinity rules.',
    duration: 4000,
    activeNodes: ['scheduler', 'node-3'],
    highlightConnections: ['c4'],
    packets: [{ id: 'p5', connectionId: 'c4', color: '#3b82f6', speed: 1.5, reverse: true }],
    cameraTarget: [4, 1, 1],
    cameraPosition: [8, 4, 8]
  },
  {
    id: 'step-5',
    title: 'Binding',
    description: 'Scheduler tells API server to bind the Pod to Node 3.',
    duration: 3000,
    activeNodes: ['scheduler', 'api-server', 'new-pod'],
    highlightConnections: ['c1'],
    packets: [{ id: 'p6', connectionId: 'c1', color: '#8b5cf6', speed: 2, reverse: true }],
    cameraTarget: [2, 2, -2],
    cameraPosition: [4, 6, 8]
  },
  {
    id: 'step-6',
    title: 'Kubelet Execution',
    description: 'The Kubelet on Node 3 sees the bound Pod and starts the containers.',
    duration: 3000,
    activeNodes: ['api-server', 'node-3'],
    highlightConnections: ['c5'],
    packets: [{ id: 'p7', connectionId: 'c5', color: '#10b981', speed: 1.5 }],
    cameraTarget: [0, 1, 1],
    cameraPosition: [0, 8, 12]
  }
]
