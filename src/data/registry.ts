import type { DiagramConfig } from '@/types'
import { clusterNodes, clusterConnections, clusterGroups } from '@/data/clusterData'
import { deploymentNodes, deploymentConnections, deploymentGroups, deploymentSteps } from '@/data/deploymentData'
import { requestFlowNodes, requestFlowConnections, requestFlowGroups, requestFlowSteps } from '@/data/requestFlowData'
import { podSchedulingNodes, podSchedulingConnections, podSchedulingGroups, podSchedulingSteps } from '@/data/podSchedulingData'
import { rollingUpdatesNodes, rollingUpdatesConnections, rollingUpdatesGroups, rollingUpdatesSteps } from '@/data/rollingUpdatesData'
import { nodeFailureNodes, nodeFailureConnections, nodeFailureGroups, nodeFailureSteps } from '@/data/nodeFailureData'
import { hpaNodes, hpaConnections, hpaGroups, hpaSteps } from '@/data/hpaData'
import { clusterAutoscalerNodes, clusterAutoscalerConnections, clusterAutoscalerGroups, clusterAutoscalerSteps } from '@/data/clusterAutoscalerData'
import { serviceDiscoveryNodes, serviceDiscoveryConnections, serviceDiscoveryGroups, serviceDiscoverySteps } from '@/data/serviceDiscoveryData'
import { statefulSetsNodes, statefulSetsConnections, statefulSetsGroups, statefulSetsSteps } from '@/data/statefulSetsData'

export const diagramRegistry: DiagramConfig[] = [
  {
    id: 'cluster-architecture',
    name: 'Cluster Architecture',
    description: 'Complete Kubernetes cluster with all major components and their relationships',
    icon: 'Server',
    category: 'Architecture',
    nodes: clusterNodes,
    connections: clusterConnections,
    groups: clusterGroups,
    defaultCamera: {
      position: [12, 8, 12],
      target: [0, 0, 0],
    },
  },
  {
    id: 'deployment-lifecycle',
    name: 'Deployment Lifecycle',
    description: 'Animated flow: kubectl apply → running containers',
    icon: 'Rocket',
    category: 'Workflows',
    nodes: deploymentNodes,
    connections: deploymentConnections,
    groups: deploymentGroups,
    steps: deploymentSteps,
    defaultCamera: {
      position: [10, 7, 10],
      target: [0, 1, 0],
    },
  },
  {
    id: 'request-flow',
    name: 'Runtime Request Flow',
    description: 'How HTTP requests travel through K8s to reach your application',
    icon: 'Globe',
    category: 'Workflows',
    nodes: requestFlowNodes,
    connections: requestFlowConnections,
    groups: requestFlowGroups,
    steps: requestFlowSteps,
    defaultCamera: {
      position: [10, 8, 12],
      target: [0, 1, 2],
    },
  },
  {
    id: 'pod-scheduling',
    name: 'Pod Scheduling',
    description: 'Node evaluation with scores, affinity, and binding',
    icon: 'Server',
    category: 'Workflows',
    nodes: podSchedulingNodes,
    connections: podSchedulingConnections,
    groups: podSchedulingGroups,
    steps: podSchedulingSteps,
    defaultCamera: {
      position: [0, 8, 12],
      target: [0, 1, 0],
    },
  },
  {
    id: 'rolling-updates',
    name: 'Rolling Updates',
    description: 'ReplicaSets transitioning with readiness checks',
    icon: 'Rocket',
    category: 'Workflows',
    nodes: rollingUpdatesNodes,
    connections: rollingUpdatesConnections,
    groups: rollingUpdatesGroups,
    steps: rollingUpdatesSteps,
    defaultCamera: {
      position: [0, 8, 12],
      target: [0, 1, 0],
    },
  },
  {
    id: 'node-failure',
    name: 'Node Failure',
    description: 'Heartbeat loss, pod eviction, and rescheduling',
    icon: 'Globe',
    category: 'Workflows',
    nodes: nodeFailureNodes,
    connections: nodeFailureConnections,
    groups: nodeFailureGroups,
    steps: nodeFailureSteps,
    defaultCamera: {
      position: [0, 8, 12],
      target: [0, 1, 0],
    },
  },
  {
    id: 'hpa',
    name: 'HPA',
    description: 'Horizontal Pod Autoscaler scaling out based on metrics',
    icon: 'Server',
    category: 'Workflows',
    nodes: hpaNodes,
    connections: hpaConnections,
    groups: hpaGroups,
    steps: hpaSteps,
    defaultCamera: {
      position: [0, 8, 12],
      target: [0, 1, 0],
    },
  },
  {
    id: 'cluster-autoscaler',
    name: 'Cluster Autoscaler',
    description: 'Provisioning new nodes for pending pods via Cloud API',
    icon: 'Rocket',
    category: 'Workflows',
    nodes: clusterAutoscalerNodes,
    connections: clusterAutoscalerConnections,
    groups: clusterAutoscalerGroups,
    steps: clusterAutoscalerSteps,
    defaultCamera: {
      position: [0, 8, 12],
      target: [0, 1, 0],
    },
  },
  {
    id: 'service-discovery',
    name: 'Service Discovery',
    description: 'DNS resolution, CoreDNS lookup, ClusterIP routing',
    icon: 'Globe',
    category: 'Workflows',
    nodes: serviceDiscoveryNodes,
    connections: serviceDiscoveryConnections,
    groups: serviceDiscoveryGroups,
    steps: serviceDiscoverySteps,
    defaultCamera: {
      position: [0, 8, 12],
      target: [0, 1, 0],
    },
  },
  {
    id: 'stateful-sets',
    name: 'StatefulSets',
    description: 'Numbered pods with persistent volume attachments',
    icon: 'Server',
    category: 'Workflows',
    nodes: statefulSetsNodes,
    connections: statefulSetsConnections,
    groups: statefulSetsGroups,
    steps: statefulSetsSteps,
    defaultCamera: {
      position: [0, 8, 12],
      target: [0, 1, 0],
    },
  },
]

export function getDiagramById(id: string): DiagramConfig | undefined {
  return diagramRegistry.find(d => d.id === id)
}
