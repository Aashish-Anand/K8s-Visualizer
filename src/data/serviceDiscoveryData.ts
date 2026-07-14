import type { K8sComponent, K8sConnection, K8sGroup, AnimationStep } from '@/types'

export const serviceDiscoveryNodes: K8sComponent[] = [
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
    id: 'endpoints-ctrl',
    name: 'Endpoints Controller',
    shortName: 'Endpoints Ctrl',
    category: 'control-plane',
    shape: 'box',
    color: '#a855f7',
    position: [3, 4, -4],
    description: 'Manages Endpoints objects',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'coredns',
    name: 'CoreDNS',
    shortName: 'DNS',
    category: 'networking',
    shape: 'hexagon',
    color: '#06b6d4',
    position: [-2, 2, -2],
    description: 'Cluster DNS server',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'kube-proxy',
    name: 'kube-proxy',
    shortName: 'kube-proxy',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [2, 1, 0],
    description: 'Network routing agent',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'service',
    name: 'ClusterIP Service',
    shortName: 'service',
    category: 'networking',
    shape: 'hexagon',
    color: '#06b6d4',
    position: [2, 1, 2],
    description: 'Virtual IP for load balancing',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'client-pod',
    name: 'Frontend Pod',
    shortName: 'client-pod',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [-2, 1, 2],
    description: 'Client requesting service',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  },
  {
    id: 'backend-pod-1',
    name: 'Backend Pod 1',
    shortName: 'backend-1',
    category: 'workload',
    shape: 'sphere',
    color: '#3b82f6',
    position: [4, 1, 4],
    description: 'Backend replica',
    responsibilities: [],
    ports: [],
    relatedObjects: [],
  }
]

export const serviceDiscoveryConnections: K8sConnection[] = [
  { id: 'c1', from: 'api-server', to: 'endpoints-ctrl', type: 'control' },
  { id: 'c2', from: 'api-server', to: 'coredns', type: 'control' },
  { id: 'c3', from: 'api-server', to: 'kube-proxy', type: 'control' },
  { id: 'c4', from: 'client-pod', to: 'coredns', type: 'network' },
  { id: 'c5', from: 'client-pod', to: 'service', type: 'network' },
  { id: 'c6', from: 'service', to: 'backend-pod-1', type: 'network' }
]

export const serviceDiscoveryGroups: K8sGroup[] = [
  {
    id: 'control-plane',
    name: 'CONTROL PLANE',
    category: 'control-plane',
    color: '#8b5cf6',
    position: [1.5, 4, -4],
    size: [8, 3, 3],
    children: [],
  }
]

export const serviceDiscoverySteps: AnimationStep[] = [
  {
    id: 'step-1',
    title: 'Pod Ready',
    description: 'Backend Pod becomes Ready. Endpoints Controller updates the Endpoints object via API Server.',
    duration: 3000,
    activeNodes: ['api-server', 'endpoints-ctrl', 'backend-pod-1'],
    highlightConnections: ['c1'],
    packets: [
      { id: 'p1', connectionId: 'c1', color: '#10b981', speed: 1.5, reverse: true }
    ],
    cameraTarget: [1.5, 4, -4],
    cameraPosition: [4, 6, 0]
  },
  {
    id: 'step-2',
    title: 'DNS Update',
    description: 'CoreDNS watches the API Server and updates its internal DNS records with the Service IP.',
    duration: 3000,
    activeNodes: ['api-server', 'coredns'],
    highlightConnections: ['c2'],
    packets: [
      { id: 'p2', connectionId: 'c2', color: '#8b5cf6', speed: 1.5 }
    ],
    cameraTarget: [-1, 3, -3],
    cameraPosition: [-4, 6, 2]
  },
  {
    id: 'step-3',
    title: 'kube-proxy Update',
    description: 'kube-proxy watches the API Server and updates iptables/IPVS rules on the node.',
    duration: 3000,
    activeNodes: ['api-server', 'kube-proxy', 'service'],
    highlightConnections: ['c3'],
    packets: [
      { id: 'p3', connectionId: 'c3', color: '#8b5cf6', speed: 1.5 }
    ],
    cameraTarget: [1, 2, -1],
    cameraPosition: [4, 6, 4]
  },
  {
    id: 'step-4',
    title: 'DNS Resolution',
    description: 'Frontend Pod wants to talk to backend. It queries CoreDNS with the hostname "backend-svc".',
    duration: 3000,
    activeNodes: ['client-pod', 'coredns'],
    highlightConnections: ['c4'],
    packets: [
      { id: 'p4', connectionId: 'c4', color: '#06b6d4', speed: 1 },
      { id: 'p5', connectionId: 'c4', color: '#10b981', speed: 1, reverse: true, delay: 1500 }
    ],
    cameraTarget: [-2, 1, 0],
    cameraPosition: [-6, 4, 6]
  },
  {
    id: 'step-5',
    title: 'Virtual IP Routing',
    description: 'Frontend Pod sends traffic to the Virtual IP. iptables intercepts and routes to the real Pod IP.',
    duration: 3000,
    activeNodes: ['client-pod', 'service', 'backend-pod-1'],
    highlightConnections: ['c5', 'c6'],
    packets: [
      { id: 'p6', connectionId: 'c5', color: '#3b82f6', speed: 1.5 },
      { id: 'p7', connectionId: 'c6', color: '#3b82f6', speed: 1.5, delay: 2000 }
    ],
    cameraTarget: [1, 1, 3],
    cameraPosition: [2, 4, 8]
  }
]
