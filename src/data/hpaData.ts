import type { K8sComponent, K8sConnection, K8sGroup, AnimationStep } from '@/types'

export const hpaNodes: K8sComponent[] = [
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
    id: 'hpa-ctrl',
    name: 'HPA Controller',
    shortName: 'HPA Ctrl',
    category: 'control-plane',
    shape: 'box',
    color: '#a855f7',
    position: [3, 3, -4],
    description: 'Monitors metrics and scales resources',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'metrics-server',
    name: 'Metrics Server',
    shortName: 'metrics',
    category: 'networking',
    shape: 'hexagon',
    color: '#06b6d4',
    position: [-3, 3, -4],
    description: 'Aggregates resource usage data',
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
    position: [0, 0, 3],
    description: 'Worker Node',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-1',
    name: 'Pod (High CPU)',
    shortName: 'pod-1',
    category: 'workload',
    shape: 'sphere',
    color: '#ef4444',
    position: [-2, 1, 3],
    description: 'Pod consuming 90% CPU',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-2',
    name: 'Pod (New)',
    shortName: 'pod-2',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [0, 1, 3],
    description: 'Scaled out Pod',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'pod-3',
    name: 'Pod (New)',
    shortName: 'pod-3',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [2, 1, 3],
    description: 'Scaled out Pod',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  }
]

export const hpaConnections: K8sConnection[] = [
  { id: 'c1', from: 'api-server', to: 'hpa-ctrl', type: 'control' },
  { id: 'c2', from: 'api-server', to: 'metrics-server', type: 'control' },
  { id: 'c3', from: 'metrics-server', to: 'node-1', type: 'data' },
  { id: 'c4', from: 'api-server', to: 'node-1', type: 'control' }
]

export const hpaGroups: K8sGroup[] = [
  {
    id: 'control-plane',
    name: 'CONTROL PLANE',
    category: 'control-plane',
    color: '#8b5cf6',
    position: [0, 3, -4],
    size: [10, 4, 3],
    children: [],
  }
]

export const hpaSteps: AnimationStep[] = [
  {
    id: 'step-1',
    title: 'Traffic Spike',
    description: 'Pod 1 is receiving heavy traffic and its CPU usage spikes to 90%.',
    duration: 3000,
    activeNodes: ['api-server', 'hpa-ctrl', 'metrics-server', 'node-1', 'pod-1'],
    highlightConnections: [],
    packets: [],
    cameraTarget: [-2, 1, 3],
    cameraPosition: [-4, 4, 8]
  },
  {
    id: 'step-2',
    title: 'Metrics Collection',
    description: 'Metrics Server polls the kubelet on Node 1 and collects the high CPU usage data.',
    duration: 3000,
    activeNodes: ['metrics-server', 'node-1', 'pod-1'],
    highlightConnections: ['c3'],
    packets: [
      { id: 'p1', connectionId: 'c3', color: '#06b6d4', speed: 1, reverse: true }
    ],
    cameraTarget: [-1, 2, -1],
    cameraPosition: [-6, 6, 4]
  },
  {
    id: 'step-3',
    title: 'HPA Evaluation',
    description: 'HPA Controller periodically queries the API Server for metrics. It sees CPU is above the 50% target.',
    duration: 3000,
    activeNodes: ['api-server', 'hpa-ctrl', 'metrics-server'],
    highlightConnections: ['c1', 'c2'],
    packets: [
      { id: 'p2', connectionId: 'c2', color: '#06b6d4', speed: 1.5, reverse: true },
      { id: 'p3', connectionId: 'c1', color: '#8b5cf6', speed: 1.5 }
    ],
    cameraTarget: [0, 3, -4],
    cameraPosition: [0, 6, 2]
  },
  {
    id: 'step-4',
    title: 'Scaling Out',
    description: 'HPA calculates desired replicas (3) and updates the Deployment via the API Server.',
    duration: 3000,
    activeNodes: ['api-server', 'hpa-ctrl'],
    highlightConnections: ['c1'],
    packets: [
      { id: 'p4', connectionId: 'c1', color: '#a855f7', speed: 1.5, reverse: true }
    ],
    cameraTarget: [0, 3, -4],
    cameraPosition: [0, 6, 2]
  },
  {
    id: 'step-5',
    title: 'New Pods Provisioned',
    description: 'The Deployment Controller (via API Server) schedules 2 new Pods on the Node.',
    duration: 3000,
    activeNodes: ['api-server', 'node-1', 'pod-1', 'pod-2', 'pod-3'],
    highlightConnections: ['c4'],
    packets: [
      { id: 'p5', connectionId: 'c4', color: '#10b981', speed: 1 }
    ],
    cameraTarget: [0, 1, 3],
    cameraPosition: [0, 6, 10]
  },
  {
    id: 'step-6',
    title: 'Load Distributed',
    description: 'Traffic is now distributed across 3 Pods. CPU usage returns to normal.',
    duration: 3000,
    activeNodes: ['api-server', 'hpa-ctrl', 'metrics-server', 'node-1', 'pod-1', 'pod-2', 'pod-3'],
    highlightConnections: [],
    packets: [],
    cameraTarget: [0, 1, 0],
    cameraPosition: [0, 8, 12]
  }
]
