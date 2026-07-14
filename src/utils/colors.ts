/** K8s category color mapping */
export const CATEGORY_COLORS: Record<string, string> = {
  'control-plane': '#8b5cf6',
  'worker-node': '#3b82f6',
  'networking': '#06b6d4',
  'storage': '#f59e0b',
  'workload': '#10b981',
  'external': '#ec4899',
  'security': '#f97316',
}

/** Packet colors */
export const PACKET_COLORS = {
  request: '#3b82f6',
  success: '#10b981',
  retry: '#f59e0b',
  failure: '#ef4444',
  control: '#8b5cf6',
  data: '#06b6d4',
} as const

/** Material colors */
export const MATERIAL_COLORS = {
  grid: '#1e293b',
  gridLine: '#334155',
  groupBorder: 'rgba(148, 163, 184, 0.15)',
  selectedOutline: '#3b82f6',
  hoveredOutline: '#06b6d4',
  activeGlow: '#8b5cf6',
} as const

export const CATEGORY_LABELS: Record<string, string> = {
  'control-plane': 'Control Plane',
  'worker-node': 'Worker Node',
  'networking': 'Networking',
  'storage': 'Storage',
  'workload': 'Workloads',
  'external': 'External',
  'security': 'Security',
}
