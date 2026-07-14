import type { K8sComponent, K8sConnection, K8sGroup, AnimationStep } from '@/types'

export const nodeFailureNodes: K8sComponent[] = [
  {
    id: 'api-server',
    name: 'API Server',
    shortName: 'kube-apiserver',
    category: 'control-plane',
    shape: 'hexagon',
    color: '#6366f1',
    position: [0, 3, -4],
    description: 'Central management entity',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'node-ctrl',
    name: 'Node Controller',
    shortName: 'Node Ctrl',
    category: 'control-plane',
    shape: 'box',
    color: '#a855f7',
    position: [3, 3, -4],
    description: 'Monitors node health',
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
    color: '#ef4444', // Failing node
    position: [-3, 0, 2],
    description: 'Failing Node',
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
    color: '#3b82f6', // Healthy node
    position: [3, 0, 2],
    description: 'Healthy Node',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'kubelet-1',
    name: 'Kubelet (Unreachable)',
    shortName: 'kubelet',
    category: 'control-plane',
    shape: 'box',
    color: '#ef4444',
    position: [-3, 1.5, 2],
    description: 'Node agent (failed)',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'kubelet-2',
    name: 'Kubelet',
    shortName: 'kubelet',
    category: 'control-plane',
    shape: 'box',
    color: '#3b82f6',
    position: [3, 1.5, 2],
    description: 'Node agent (healthy)',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-a',
    name: 'Pod A (Lost)',
    shortName: 'pod-a',
    category: 'workload',
    shape: 'sphere',
    color: '#ef4444',
    position: [-3, 3, 2],
    description: 'Running on failed node',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-b',
    name: 'Pod B (Healthy)',
    shortName: 'pod-b',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [3, 3, 2],
    description: 'Running on healthy node',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-a-new',
    name: 'Pod A (Rescheduled)',
    shortName: 'pod-a-new',
    category: 'workload',
    shape: 'sphere',
    color: '#f59e0b',
    position: [4, 3, 2],
    description: 'Rescheduled Pod',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  }
]

export const nodeFailureConnections: K8sConnection[] = [
  { id: 'c1', from: 'api-server', to: 'node-ctrl', type: 'control' },
  { id: 'c2', from: 'api-server', to: 'kubelet-1', type: 'control' },
  { id: 'c3', from: 'api-server', to: 'kubelet-2', type: 'control' },
  { id: 'c4', from: 'kubelet-1', to: 'pod-a', type: 'data' },
  { id: 'c5', from: 'kubelet-2', to: 'pod-b', type: 'data' },
  { id: 'c6', from: 'kubelet-2', to: 'pod-a-new', type: 'data' },
]

export const nodeFailureGroups: K8sGroup[] = [
  {
    id: 'control-plane',
    name: 'CONTROL PLANE',
    category: 'control-plane',
    color: '#8b5cf6',
    position: [1.5, 3, -4],
    size: [8, 4, 3],
    children: [],
  }
]

export const nodeFailureSteps: AnimationStep[] = [
  {
    id: 'step-1',
    title: 'Healthy State',
    description: 'Both nodes are sending regular heartbeats to the API Server.',
    duration: 3000,
    activeNodes: ['api-server', 'node-ctrl', 'node-1', 'kubelet-1', 'pod-a', 'node-2', 'kubelet-2', 'pod-b'],
    highlightConnections: ['c2', 'c3'],
    packets: [
      { id: 'p1', connectionId: 'c2', color: '#10b981', speed: 1.5, reverse: true },
      { id: 'p2', connectionId: 'c3', color: '#10b981', speed: 1.5, reverse: true }
    ],
    cameraTarget: [0, 1, 0],
    cameraPosition: [0, 8, 12]
  },
  {
    id: 'step-2',
    title: 'Node Failure',
    description: 'Node 1 crashes. The kubelet stops sending heartbeats.',
    duration: 3000,
    activeNodes: ['api-server', 'node-ctrl', 'node-2', 'kubelet-2', 'pod-b'],
    highlightConnections: ['c3'],
    packets: [
      { id: 'p3', connectionId: 'c3', color: '#10b981', speed: 1.5, reverse: true }
    ],
    cameraTarget: [-2, 1, 0],
    cameraPosition: [-4, 6, 8]
  },
  {
    id: 'step-3',
    title: 'Node Controller Detects Timeout',
    description: 'After the timeout period (default 5m), Node Controller marks Node 1 as NotReady.',
    duration: 3000,
    activeNodes: ['api-server', 'node-ctrl'],
    highlightConnections: ['c1'],
    packets: [
      { id: 'p4', connectionId: 'c1', color: '#ef4444', speed: 1 }
    ],
    cameraTarget: [1.5, 3, -4],
    cameraPosition: [4, 6, 0]
  },
  {
    id: 'step-4',
    title: 'Pod Eviction',
    description: 'Node Controller evicts Pods on Node 1 by deleting them from the API Server.',
    duration: 3000,
    activeNodes: ['api-server', 'node-ctrl'],
    highlightConnections: ['c1'],
    packets: [
      { id: 'p5', connectionId: 'c1', color: '#8b5cf6', speed: 1.5, reverse: true }
    ],
    cameraTarget: [1.5, 3, -4],
    cameraPosition: [4, 6, 0]
  },
  {
    id: 'step-5',
    title: 'ReplicaSet Creates Replacement',
    description: 'The ReplicaSet controller notices a missing Pod and creates a replacement, which is scheduled to Node 2.',
    duration: 3000,
    activeNodes: ['api-server', 'node-2', 'kubelet-2', 'pod-b', 'pod-a-new'],
    highlightConnections: ['c3', 'c6'],
    packets: [
      { id: 'p6', connectionId: 'c3', color: '#8b5cf6', speed: 1.5 }
    ],
    cameraTarget: [3, 1, 2],
    cameraPosition: [6, 6, 8]
  },
  {
    id: 'step-6',
    title: 'Recovery Complete',
    description: 'Pod A is now running on Node 2. The cluster is healthy again.',
    duration: 3000,
    activeNodes: ['api-server', 'node-2', 'kubelet-2', 'pod-b', 'pod-a-new'],
    highlightConnections: ['c3', 'c5', 'c6'],
    packets: [
      { id: 'p7', connectionId: 'c3', color: '#10b981', speed: 1.5, reverse: true }
    ],
    cameraTarget: [0, 1, 0],
    cameraPosition: [0, 8, 12]
  }
]
