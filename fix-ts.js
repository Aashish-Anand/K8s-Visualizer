import fs from 'fs';
import path from 'path';

const files = [
  'clusterAutoscalerData.ts',
  'hpaData.ts',
  'nodeFailureData.ts',
  'podSchedulingData.ts',
  'rollingUpdatesData.ts',
  'serviceDiscoveryData.ts',
  'statefulSetsData.ts'
];

files.forEach(file => {
  const filePath = path.join('/Users/aashish/Desktop/My Projects/K8sVisualizer/src/data', file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace category: 'workloads' with category: 'workload'
  content = content.replace(/category: 'workloads'/g, "category: 'workload'");
  
  // Replace K8sGroup definitions to include missing fields
  // Control Plane groups
  content = content.replace(/name: 'CONTROL PLANE',\s+color: '#8b5cf6',/g, 
    "name: 'CONTROL PLANE',\n    category: 'control-plane',\n    color: '#8b5cf6',");
  
  // Worker Node groups
  content = content.replace(/name: 'WORKER NODES',\s+color: '#3b82f6',/g, 
    "name: 'WORKER NODES',\n    category: 'worker-node',\n    color: '#3b82f6',");
    
  // Add children: [] right before size:
  content = content.replace(/position: \[(.*?)\],\s+size: \[(.*?)\]/g, 
    "position: [$1],\n    size: [$2],\n    children: []");
    
  fs.writeFileSync(filePath, content, 'utf-8');
});
console.log('Fixed TypeScript errors in data files.');
