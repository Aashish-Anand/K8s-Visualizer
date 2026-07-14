import type { K8sComponent, K8sConnection, K8sGroup } from '@/types'

/* ============================================================
   CLUSTER ARCHITECTURE — COMPLETE NODE DATA
   ============================================================ */
export const clusterNodes: K8sComponent[] = [
  /* ────── External ────── */
  {
    id: 'internet',
    name: 'Internet',
    shortName: 'Internet',
    category: 'external',
    shape: 'sphere',
    color: '#ec4899',
    position: [0, 5, 8],
    scale: [1.2, 1.2, 1.2],
    description: 'External traffic from users and clients entering the Kubernetes cluster.',
    responsibilities: [
      'Source of external HTTP/HTTPS requests',
      'Client-side DNS resolution',
      'TLS handshake initiation',
    ],
    relatedObjects: ['load-balancer'],
  },
  {
    id: 'load-balancer',
    name: 'Cloud Load Balancer',
    shortName: 'LB',
    category: 'external',
    shape: 'diamond',
    color: '#ec4899',
    position: [0, 4.2, 6],
    description: 'Cloud provider load balancer (AWS ALB/NLB, GCP LB, Azure LB) that distributes traffic to the cluster.',
    responsibilities: [
      'Layer 4/7 load balancing',
      'SSL/TLS termination',
      'Health checking backend nodes',
      'Traffic distribution across nodes',
    ],
    ports: ['80/TCP', '443/TCP'],
    relatedObjects: ['ingress-controller'],
    yamlExample: `apiVersion: v1
kind: Service
metadata:
  name: my-loadbalancer
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: my-app`,
    kubectlCommands: [
      { command: 'kubectl get svc -o wide', description: 'List services with external IPs' },
      { command: 'kubectl describe svc my-loadbalancer', description: 'Show LB details and events' },
    ],
    interviewQuestions: [
      {
        question: 'What is the difference between a Service of type LoadBalancer and an Ingress?',
        answer: 'A LoadBalancer Service provisions a cloud provider load balancer for a single service, assigning an external IP. An Ingress is a layer-7 HTTP router that can route traffic to multiple services based on host/path rules using a single load balancer.',
      },
    ],
  },

  /* ────── Ingress ────── */
  {
    id: 'ingress-controller',
    name: 'Ingress Controller',
    shortName: 'Ingress Controller',
    category: 'networking',
    shape: 'hexagon',
    color: '#06b6d4',
    position: [0, 3.4, 4],
    description: 'A pod running an HTTP reverse proxy (e.g., NGINX, Traefik, HAProxy) that implements Ingress rules to route external traffic.',
    responsibilities: [
      'Read Ingress resources from API Server',
      'Configure reverse proxy rules dynamically',
      'TLS termination for HTTPS routes',
      'Path-based and host-based routing',
      'Rate limiting and authentication',
    ],
    ports: ['80/TCP', '443/TCP'],
    relatedObjects: ['ingress-rules', 'service-clusterip'],
    yamlExample: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80`,
    kubectlCommands: [
      { command: 'kubectl get ingress', description: 'List all Ingress resources' },
      { command: 'kubectl describe ingress my-ingress', description: 'Show Ingress rules and backends' },
    ],
    interviewQuestions: [
      {
        question: 'How does an Ingress Controller differ from kube-proxy?',
        answer: 'An Ingress Controller operates at Layer 7 (HTTP), reading Ingress resources to configure reverse proxy rules for external traffic. kube-proxy operates at Layer 3/4, managing iptables/IPVS rules for internal Service routing within the cluster.',
      },
    ],
  },

  /* ────── Control Plane ────── */
  {
    id: 'api-server',
    name: 'API Server',
    shortName: 'kube-apiserver',
    category: 'control-plane',
    shape: 'hexagon',
    color: '#8b5cf6',
    position: [0, 2.5, -2],
    scale: [1.3, 1.3, 1.3],
    description: 'The central management hub of Kubernetes. All communication goes through the API Server — it is the only component that talks to etcd directly.',
    responsibilities: [
      'RESTful API endpoint for all K8s operations',
      'Authentication and Authorization',
      'Admission Control (validation & mutation)',
      'API versioning and resource management',
      'Watch mechanism for change notifications',
      'Sole gateway to etcd',
    ],
    ports: ['6443/TCP'],
    apis: ['/api/v1', '/apis', '/healthz', '/metrics'],
    relatedObjects: ['etcd', 'scheduler', 'controller-manager', 'kubelet-1', 'kubelet-2'],
    yamlExample: `# API Server is typically configured via static pod manifest
# located at /etc/kubernetes/manifests/kube-apiserver.yaml
apiVersion: v1
kind: Pod
metadata:
  name: kube-apiserver
  namespace: kube-system
spec:
  containers:
    - name: kube-apiserver
      image: registry.k8s.io/kube-apiserver:v1.31.0
      command:
        - kube-apiserver
        - --advertise-address=10.0.0.1
        - --etcd-servers=https://127.0.0.1:2379
        - --service-cluster-ip-range=10.96.0.0/12`,
    kubectlCommands: [
      { command: 'kubectl cluster-info', description: 'Show API Server endpoint' },
      { command: 'kubectl get --raw /healthz', description: 'Check API Server health' },
      { command: 'kubectl api-resources', description: 'List all API resources' },
      { command: 'kubectl api-versions', description: 'List all API versions' },
    ],
    interviewQuestions: [
      {
        question: 'Why is the API Server the single point of communication in Kubernetes?',
        answer: 'The API Server is the only component that communicates directly with etcd. All other components (scheduler, controllers, kubelet) interact with the cluster state exclusively through the API Server. This centralizes authentication, authorization, admission control, and auditing in one place.',
      },
      {
        question: 'What happens when the API Server goes down?',
        answer: 'Existing workloads continue running because kubelet manages containers independently. However, no new deployments, scaling, or scheduling can occur. Controllers cannot reconcile state, and kubectl commands will fail. This is why HA setups run multiple API Server replicas.',
      },
    ],
    debuggingTips: [
      'Check API Server logs: kubectl logs -n kube-system kube-apiserver-<node>',
      'Verify connectivity: curl -k https://<api-server>:6443/healthz',
      'Check certificate expiry: kubeadm certs check-expiration',
    ],
    failureScenarios: [
      'Certificate expiry — API Server refuses connections',
      'etcd unreachable — API Server returns 500 errors',
      'OOM kill — API Server process terminated by kernel',
    ],
  },
  {
    id: 'etcd',
    name: 'etcd',
    shortName: 'etcd',
    category: 'control-plane',
    shape: 'cylinder',
    color: '#8b5cf6',
    position: [3.5, 2.5, -3.5],
    description: 'A distributed, consistent key-value store used as the backing store for all Kubernetes cluster data.',
    responsibilities: [
      'Store all cluster state and configuration',
      'Provide strong consistency via Raft consensus',
      'Support watch operations for change notifications',
      'Maintain cluster membership information',
    ],
    ports: ['2379/TCP (client)', '2380/TCP (peer)'],
    relatedObjects: ['api-server'],
    yamlExample: `# etcd is typically run as a static pod
apiVersion: v1
kind: Pod
metadata:
  name: etcd
  namespace: kube-system
spec:
  containers:
    - name: etcd
      image: registry.k8s.io/etcd:3.5.15-0
      command:
        - etcd
        - --data-dir=/var/lib/etcd
        - --listen-client-urls=https://127.0.0.1:2379`,
    kubectlCommands: [
      { command: 'kubectl -n kube-system get pod etcd-*', description: 'Check etcd pod status' },
      { command: 'etcdctl endpoint health', description: 'Check etcd cluster health' },
      { command: 'etcdctl snapshot save backup.db', description: 'Create etcd backup' },
    ],
    interviewQuestions: [
      {
        question: 'Why does Kubernetes use etcd instead of a relational database?',
        answer: 'etcd provides strong consistency through Raft consensus, supports watch operations for real-time change notifications (critical for controllers), has low latency key-value access, and is designed for distributed deployment. Relational databases would add unnecessary complexity and latency for K8s\'s key-value access patterns.',
      },
    ],
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    shortName: 'kube-scheduler',
    category: 'control-plane',
    shape: 'box',
    color: '#8b5cf6',
    position: [-3, 2.5, -2],
    description: 'Watches for newly created Pods with no assigned node and selects the best node for them to run on.',
    responsibilities: [
      'Watch for unscheduled Pods',
      'Filter nodes (predicates): resource availability, taints, affinity',
      'Score nodes (priorities): resource balance, spreading, affinity weight',
      'Bind Pod to selected Node via API Server',
    ],
    relatedObjects: ['api-server', 'worker-node-1', 'worker-node-2'],
    yamlExample: `# Pod with scheduling constraints
apiVersion: v1
kind: Pod
metadata:
  name: scheduled-pod
spec:
  nodeSelector:
    disktype: ssd
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "gpu"
      effect: "NoSchedule"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values: [amd64]`,
    kubectlCommands: [
      { command: 'kubectl get events --field-selector reason=Scheduled', description: 'Show scheduling events' },
      { command: 'kubectl describe pod <pod> | grep -A5 Events', description: 'Check pod scheduling events' },
    ],
    interviewQuestions: [
      {
        question: 'Explain the Kubernetes scheduling algorithm.',
        answer: 'The scheduler uses a two-phase approach: 1) Filtering — eliminates nodes that don\'t meet requirements (insufficient resources, taints, affinity rules). 2) Scoring — ranks remaining nodes using plugins (resource balance, inter-pod affinity, spread constraints). The highest-scored node wins. If no nodes pass filtering, the Pod remains Pending.',
      },
    ],
  },
  {
    id: 'controller-manager',
    name: 'Controller Manager',
    shortName: 'kube-controller-manager',
    category: 'control-plane',
    shape: 'box',
    color: '#8b5cf6',
    position: [-3, 2.5, -4],
    description: 'Runs controller processes that regulate the state of the cluster. Each controller watches the API Server and works to move the current state toward the desired state.',
    responsibilities: [
      'Deployment Controller — manages ReplicaSets',
      'ReplicaSet Controller — maintains Pod count',
      'Node Controller — monitors node health',
      'Endpoints Controller — populates Service endpoints',
      'ServiceAccount Controller — creates default accounts',
      'Job Controller — manages batch jobs',
    ],
    relatedObjects: ['api-server'],
    kubectlCommands: [
      { command: 'kubectl get deploy', description: 'List deployments managed by controllers' },
      { command: 'kubectl get rs', description: 'List ReplicaSets' },
      { command: 'kubectl get endpoints', description: 'List service endpoints' },
    ],
    interviewQuestions: [
      {
        question: 'What is the reconciliation loop in Kubernetes?',
        answer: 'Each controller continuously watches the current state of resources and compares it to the desired state. If they differ, the controller takes action to reconcile — creating, updating, or deleting resources to match the desired state. This watch → diff → act loop is the fundamental pattern driving Kubernetes\' self-healing behavior.',
      },
    ],
  },
  {
    id: 'cloud-controller',
    name: 'Cloud Controller Manager',
    shortName: 'cloud-controller-manager',
    category: 'control-plane',
    shape: 'box',
    color: '#8b5cf6',
    position: [3.5, 2.5, -1],
    description: 'Embeds cloud-specific control logic. Manages cloud provider resources like load balancers, routes, and node lifecycle.',
    responsibilities: [
      'Node Controller — check cloud for node existence',
      'Route Controller — configure cloud routes',
      'Service Controller — manage cloud load balancers',
    ],
    relatedObjects: ['api-server', 'load-balancer'],
  },
  {
    id: 'admission-controllers',
    name: 'Admission Controllers',
    shortName: 'Admission',
    category: 'security',
    shape: 'box',
    color: '#f97316',
    position: [1.5, 1.5, -2],
    scale: [0.7, 0.7, 0.7],
    description: 'Plugins that intercept API requests after authentication/authorization but before the object is persisted. Can validate or mutate the request.',
    responsibilities: [
      'Validate resource specifications',
      'Mutate resources (inject defaults, sidecars)',
      'Enforce security policies (PodSecurity)',
      'Resource quota enforcement',
    ],
    relatedObjects: ['api-server'],
    interviewQuestions: [
      {
        question: 'What is the difference between validating and mutating admission webhooks?',
        answer: 'Mutating webhooks run first and can modify the resource (e.g., injecting sidecar containers, adding labels). Validating webhooks run after and can only accept or reject the request. Both are called after authentication and authorization but before persistence to etcd.',
      },
    ],
  },

  /* ────── Worker Node 1 ────── */
  {
    id: 'kubelet-1',
    name: 'kubelet',
    shortName: 'kubelet',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [-5, 0, 2],
    parentId: 'worker-node-1',
    description: 'The primary node agent that ensures containers are running in Pods on this node.',
    responsibilities: [
      'Register node with API Server',
      'Watch for Pod assignments from API Server',
      'Manage container lifecycle via Container Runtime',
      'Report node and Pod status',
      'Execute liveness and readiness probes',
      'Mount volumes',
    ],
    ports: ['10250/TCP'],
    relatedObjects: ['api-server', 'container-runtime-1'],
    kubectlCommands: [
      { command: 'kubectl get nodes', description: 'List all nodes' },
      { command: 'kubectl describe node <node>', description: 'Show node details and capacity' },
      { command: 'kubectl top node', description: 'Show node resource usage' },
    ],
    interviewQuestions: [
      {
        question: 'What happens if kubelet crashes?',
        answer: 'Running containers continue to run because the container runtime (containerd/CRI-O) manages them independently. However, no new pods can be started on that node, probes stop executing, and the node will eventually be marked NotReady by the node controller after missing heartbeats.',
      },
    ],
  },
  {
    id: 'kube-proxy-1',
    name: 'kube-proxy',
    shortName: 'kube-proxy',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [-3.5, 0, 2],
    parentId: 'worker-node-1',
    description: 'Network proxy that maintains network rules on nodes, implementing the Kubernetes Service concept.',
    responsibilities: [
      'Maintain iptables/IPVS rules for Services',
      'Enable Service ClusterIP routing',
      'Perform connection-level load balancing',
      'Handle NodePort traffic',
    ],
    ports: ['10256/TCP'],
    relatedObjects: ['service-clusterip'],
    interviewQuestions: [
      {
        question: 'What are the modes of kube-proxy?',
        answer: 'kube-proxy supports three modes: 1) iptables (default) — uses iptables rules for routing, random pod selection. 2) IPVS — uses Linux IPVS for better performance and more load-balancing algorithms. 3) userspace (legacy) — proxies in userspace, slowest mode.',
      },
    ],
  },
  {
    id: 'container-runtime-1',
    name: 'Container Runtime',
    shortName: 'containerd',
    category: 'worker-node',
    shape: 'cylinder',
    color: '#3b82f6',
    position: [-5, -0.8, 3],
    scale: [0.7, 0.7, 0.7],
    parentId: 'worker-node-1',
    description: 'The software responsible for running containers (containerd, CRI-O). Implements the Container Runtime Interface (CRI).',
    responsibilities: [
      'Pull container images from registries',
      'Create and start containers',
      'Manage container lifecycle',
      'Implement CRI gRPC interface',
    ],
    relatedObjects: ['kubelet-1', 'pod-1a', 'pod-1b'],
  },
  {
    id: 'pod-1a',
    name: 'Pod (app-frontend)',
    shortName: 'Pod',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [-5.5, -1.6, 2],
    scale: [0.6, 0.6, 0.6],
    parentId: 'worker-node-1',
    description: 'The smallest deployable unit in Kubernetes. A Pod hosts one or more containers sharing network and storage.',
    responsibilities: [
      'Run application containers',
      'Share network namespace (localhost)',
      'Share storage volumes',
      'Expose ports for services',
    ],
    relatedObjects: ['service-clusterip', 'kubelet-1'],
    yamlExample: `apiVersion: v1
kind: Pod
metadata:
  name: app-frontend
  labels:
    app: frontend
    tier: web
spec:
  containers:
    - name: nginx
      image: nginx:1.27
      ports:
        - containerPort: 80
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "256Mi"
      readinessProbe:
        httpGet:
          path: /healthz
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 10`,
    kubectlCommands: [
      { command: 'kubectl get pods -o wide', description: 'List pods with node info' },
      { command: 'kubectl describe pod <pod>', description: 'Show pod details' },
      { command: 'kubectl logs <pod> -c <container>', description: 'View container logs' },
      { command: 'kubectl exec -it <pod> -- /bin/sh', description: 'Exec into container' },
    ],
    interviewQuestions: [
      {
        question: 'Why would you run multiple containers in a single Pod?',
        answer: 'Multi-container Pods are used for sidecar patterns: log collectors, service mesh proxies (Envoy), config reloaders, or init containers for setup tasks. Containers in a Pod share the same network namespace (can communicate via localhost) and can share volumes.',
      },
    ],
  },
  {
    id: 'pod-1b',
    name: 'Pod (app-backend)',
    shortName: 'Pod',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [-3.5, -1.6, 3],
    scale: [0.6, 0.6, 0.6],
    parentId: 'worker-node-1',
    description: 'Backend application pod running the business logic.',
    responsibilities: [
      'Process API requests',
      'Business logic execution',
      'Database communication',
    ],
    relatedObjects: ['service-clusterip', 'kubelet-1'],
  },

  /* ────── Worker Node 2 ────── */
  {
    id: 'kubelet-2',
    name: 'kubelet',
    shortName: 'kubelet',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [5, 0, 2],
    parentId: 'worker-node-2',
    description: 'The primary node agent on Worker Node 2.',
    responsibilities: [
      'Register node with API Server',
      'Watch for Pod assignments',
      'Manage container lifecycle',
      'Report node status',
    ],
    ports: ['10250/TCP'],
    relatedObjects: ['api-server', 'container-runtime-2'],
  },
  {
    id: 'kube-proxy-2',
    name: 'kube-proxy',
    shortName: 'kube-proxy',
    category: 'worker-node',
    shape: 'box',
    color: '#3b82f6',
    position: [3.5, 0, 2],
    parentId: 'worker-node-2',
    description: 'Network proxy on Worker Node 2 maintaining iptables/IPVS rules.',
    responsibilities: [
      'Maintain iptables/IPVS rules',
      'Service ClusterIP routing',
      'Load balancing',
    ],
    relatedObjects: ['service-clusterip'],
  },
  {
    id: 'container-runtime-2',
    name: 'Container Runtime',
    shortName: 'containerd',
    category: 'worker-node',
    shape: 'cylinder',
    color: '#3b82f6',
    position: [5, -0.8, 3],
    scale: [0.7, 0.7, 0.7],
    parentId: 'worker-node-2',
    description: 'Container runtime (containerd) on Worker Node 2.',
    responsibilities: [
      'Pull images',
      'Create containers',
      'Manage container lifecycle',
    ],
    relatedObjects: ['kubelet-2', 'pod-2a', 'pod-2b'],
  },
  {
    id: 'pod-2a',
    name: 'Pod (app-frontend)',
    shortName: 'Pod',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [4, -1.6, 2],
    scale: [0.6, 0.6, 0.6],
    parentId: 'worker-node-2',
    description: 'Frontend application pod replica on Worker Node 2.',
    responsibilities: ['Serve web content', 'Handle HTTP requests'],
    relatedObjects: ['service-clusterip'],
  },
  {
    id: 'pod-2b',
    name: 'Pod (app-backend)',
    shortName: 'Pod',
    category: 'workload',
    shape: 'sphere',
    color: '#10b981',
    position: [5.5, -1.6, 3],
    scale: [0.6, 0.6, 0.6],
    parentId: 'worker-node-2',
    description: 'Backend application pod replica on Worker Node 2.',
    responsibilities: ['Process API requests', 'Business logic'],
    relatedObjects: ['service-clusterip'],
  },

  /* ────── Services ────── */
  {
    id: 'service-clusterip',
    name: 'Service (ClusterIP)',
    shortName: 'ClusterIP Service',
    category: 'networking',
    shape: 'diamond',
    color: '#06b6d4',
    position: [0, 0.5, 2.5],
    description: 'An internal virtual IP that load-balances traffic across a set of Pods matched by label selectors.',
    responsibilities: [
      'Stable virtual IP (ClusterIP)',
      'DNS-based service discovery',
      'Load balance across healthy Pods',
      'Port mapping (service port → target port)',
    ],
    ports: ['ClusterIP:80 → Pod:8080'],
    relatedObjects: ['pod-1a', 'pod-1b', 'pod-2a', 'pod-2b', 'kube-proxy-1', 'kube-proxy-2'],
    yamlExample: `apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP`,
    kubectlCommands: [
      { command: 'kubectl get svc', description: 'List all services' },
      { command: 'kubectl describe svc frontend-service', description: 'Show service details and endpoints' },
      { command: 'kubectl get endpoints frontend-service', description: 'Show service endpoints (pod IPs)' },
    ],
    interviewQuestions: [
      {
        question: 'What are the different Service types in Kubernetes?',
        answer: 'ClusterIP (default) — internal-only virtual IP. NodePort — exposes on each node\'s IP at a static port. LoadBalancer — provisions cloud LB + NodePort + ClusterIP. ExternalName — maps to an external DNS name (CNAME). Headless (ClusterIP: None) — returns Pod IPs directly instead of a VIP.',
      },
    ],
  },

  /* ────── Networking ────── */
  {
    id: 'coredns',
    name: 'CoreDNS',
    shortName: 'CoreDNS',
    category: 'networking',
    shape: 'hexagon',
    color: '#06b6d4',
    position: [0, 1.5, 0],
    scale: [0.8, 0.8, 0.8],
    description: 'The cluster DNS server. Resolves Service names to ClusterIPs and Pod names to Pod IPs.',
    responsibilities: [
      'DNS resolution for Services (<svc>.<ns>.svc.cluster.local)',
      'DNS resolution for Pods',
      'DNS-based service discovery',
      'Configurable via Corefile',
    ],
    ports: ['53/UDP', '53/TCP'],
    relatedObjects: ['api-server', 'service-clusterip'],
    interviewQuestions: [
      {
        question: 'How does DNS-based service discovery work in Kubernetes?',
        answer: 'CoreDNS watches the API Server for Service creation. When a Service is created, CoreDNS adds a DNS record: <service-name>.<namespace>.svc.cluster.local → ClusterIP. Pods are configured with CoreDNS as their DNS resolver. When a Pod resolves a service name, CoreDNS returns the ClusterIP.',
      },
    ],
  },
  {
    id: 'cni',
    name: 'CNI Plugin',
    shortName: 'CNI',
    category: 'networking',
    shape: 'box',
    color: '#06b6d4',
    position: [0, -0.5, 0],
    scale: [0.7, 0.7, 0.7],
    description: 'Container Network Interface plugin (Calico, Flannel, Cilium, Weave) that provides Pod-to-Pod networking.',
    responsibilities: [
      'Assign IP addresses to Pods',
      'Enable Pod-to-Pod communication across nodes',
      'Network policy enforcement',
      'VXLAN/BGP overlay networking',
    ],
    relatedObjects: ['pod-1a', 'pod-1b', 'pod-2a', 'pod-2b'],
    interviewQuestions: [
      {
        question: 'What is the Kubernetes networking model?',
        answer: 'K8s requires: 1) Every Pod gets its own IP. 2) Pods on any node can communicate with Pods on any other node without NAT. 3) Agents on a node can communicate with all Pods on that node. The CNI plugin implements this flat network model.',
      },
    ],
  },

  /* ────── Storage ────── */
  {
    id: 'pv',
    name: 'Persistent Volume',
    shortName: 'PV',
    category: 'storage',
    shape: 'cylinder',
    color: '#f59e0b',
    position: [-2, -2.5, 0],
    scale: [0.7, 0.7, 0.7],
    description: 'A piece of storage provisioned by an administrator or dynamically by a StorageClass. Lifecycle independent of any Pod.',
    responsibilities: [
      'Represent physical/cloud storage',
      'Define capacity, access modes, reclaim policy',
      'Bound to PersistentVolumeClaims',
    ],
    relatedObjects: ['pvc', 'storage-class', 'csi-driver'],
    yamlExample: `apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: fast-ssd
  csi:
    driver: ebs.csi.aws.com
    volumeHandle: vol-0123456789abcdef0`,
    kubectlCommands: [
      { command: 'kubectl get pv', description: 'List persistent volumes' },
      { command: 'kubectl describe pv my-pv', description: 'Show PV details' },
    ],
  },
  {
    id: 'pvc',
    name: 'Persistent Volume Claim',
    shortName: 'PVC',
    category: 'storage',
    shape: 'box',
    color: '#f59e0b',
    position: [0, -2.5, 0],
    scale: [0.6, 0.6, 0.6],
    description: 'A request for storage by a user/Pod. Binds to a matching PersistentVolume.',
    responsibilities: [
      'Request specific storage size and access mode',
      'Bind to matching PV',
      'Referenced by Pod volumes',
    ],
    relatedObjects: ['pv', 'pod-1a'],
    yamlExample: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-ssd`,
  },
  {
    id: 'storage-class',
    name: 'Storage Class',
    shortName: 'StorageClass',
    category: 'storage',
    shape: 'box',
    color: '#f59e0b',
    position: [2, -2.5, 0],
    scale: [0.6, 0.6, 0.6],
    description: 'Defines a class of storage (e.g., SSD, HDD) and enables dynamic provisioning of PersistentVolumes.',
    responsibilities: [
      'Define storage tiers (fast, standard)',
      'Enable dynamic PV provisioning',
      'Specify CSI driver and parameters',
    ],
    relatedObjects: ['pv', 'csi-driver'],
    yamlExample: `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iopsPerGB: "10"
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer`,
  },
  {
    id: 'csi-driver',
    name: 'CSI Driver',
    shortName: 'CSI',
    category: 'storage',
    shape: 'box',
    color: '#f59e0b',
    position: [0, -3.2, 1],
    scale: [0.5, 0.5, 0.5],
    description: 'Container Storage Interface driver that enables K8s to interface with external storage systems (AWS EBS, GCP PD, etc.).',
    responsibilities: [
      'Provision volumes dynamically',
      'Attach/detach volumes to nodes',
      'Mount volumes into containers',
      'Snapshot and restore',
    ],
    relatedObjects: ['storage-class', 'pv'],
  },
]

/* ============================================================
   CONNECTIONS
   ============================================================ */
export const clusterConnections: K8sConnection[] = [
  /* External → Ingress path */
  { id: 'c-internet-lb', from: 'internet', to: 'load-balancer', label: 'HTTPS Traffic', type: 'external', animated: true },
  { id: 'c-lb-ingress', from: 'load-balancer', to: 'ingress-controller', label: 'Forward', type: 'external', animated: true },
  { id: 'c-ingress-svc', from: 'ingress-controller', to: 'service-clusterip', label: 'Route', type: 'network', animated: true },

  /* Control plane internals */
  { id: 'c-api-etcd', from: 'api-server', to: 'etcd', label: 'Read/Write State', type: 'control', bidirectional: true },
  { id: 'c-api-scheduler', from: 'api-server', to: 'scheduler', label: 'Watch/Bind', type: 'control', bidirectional: true },
  { id: 'c-api-cm', from: 'api-server', to: 'controller-manager', label: 'Watch/Update', type: 'control', bidirectional: true },
  { id: 'c-api-ccm', from: 'api-server', to: 'cloud-controller', label: 'Cloud Ops', type: 'control', bidirectional: true },
  { id: 'c-api-admission', from: 'api-server', to: 'admission-controllers', label: 'Validate/Mutate', type: 'control' },

  /* Control plane → Worker nodes */
  { id: 'c-api-kubelet1', from: 'api-server', to: 'kubelet-1', label: 'Pod Specs', type: 'control', bidirectional: true },
  { id: 'c-api-kubelet2', from: 'api-server', to: 'kubelet-2', label: 'Pod Specs', type: 'control', bidirectional: true },

  /* kubelet → runtime → pods */
  { id: 'c-kubelet1-runtime1', from: 'kubelet-1', to: 'container-runtime-1', label: 'CRI', type: 'control' },
  { id: 'c-runtime1-pod1a', from: 'container-runtime-1', to: 'pod-1a', label: 'Create', type: 'control' },
  { id: 'c-runtime1-pod1b', from: 'container-runtime-1', to: 'pod-1b', label: 'Create', type: 'control' },
  { id: 'c-kubelet2-runtime2', from: 'kubelet-2', to: 'container-runtime-2', label: 'CRI', type: 'control' },
  { id: 'c-runtime2-pod2a', from: 'container-runtime-2', to: 'pod-2a', label: 'Create', type: 'control' },
  { id: 'c-runtime2-pod2b', from: 'container-runtime-2', to: 'pod-2b', label: 'Create', type: 'control' },

  /* Service → Pods via kube-proxy */
  { id: 'c-svc-proxy1', from: 'service-clusterip', to: 'kube-proxy-1', label: 'iptables', type: 'network' },
  { id: 'c-svc-proxy2', from: 'service-clusterip', to: 'kube-proxy-2', label: 'iptables', type: 'network' },
  { id: 'c-proxy1-pod1a', from: 'kube-proxy-1', to: 'pod-1a', label: 'Forward', type: 'network' },
  { id: 'c-proxy1-pod1b', from: 'kube-proxy-1', to: 'pod-1b', label: 'Forward', type: 'network' },
  { id: 'c-proxy2-pod2a', from: 'kube-proxy-2', to: 'pod-2a', label: 'Forward', type: 'network' },
  { id: 'c-proxy2-pod2b', from: 'kube-proxy-2', to: 'pod-2b', label: 'Forward', type: 'network' },

  /* CoreDNS */
  { id: 'c-api-coredns', from: 'api-server', to: 'coredns', label: 'Watch Services', type: 'control' },
  { id: 'c-coredns-svc', from: 'coredns', to: 'service-clusterip', label: 'DNS Resolution', type: 'network' },

  /* CNI */
  { id: 'c-cni-pod1a', from: 'cni', to: 'pod-1a', label: 'Network', type: 'network' },
  { id: 'c-cni-pod2a', from: 'cni', to: 'pod-2a', label: 'Network', type: 'network' },

  /* Storage */
  { id: 'c-pvc-pv', from: 'pvc', to: 'pv', label: 'Bind', type: 'storage' },
  { id: 'c-sc-pv', from: 'storage-class', to: 'pv', label: 'Provision', type: 'storage' },
  { id: 'c-csi-sc', from: 'csi-driver', to: 'storage-class', label: 'Implement', type: 'storage' },

  /* Cloud controller → LB */
  { id: 'c-ccm-lb', from: 'cloud-controller', to: 'load-balancer', label: 'Provision LB', type: 'external' },
]

/* ============================================================
   GROUPS (bounding boxes)
   ============================================================ */
export const clusterGroups: K8sGroup[] = [
  {
    id: 'control-plane-group',
    name: 'Control Plane',
    category: 'control-plane',
    color: '#8b5cf6',
    position: [0, 2.2, -2.8],
    size: [9, 2.5, 4],
    children: ['api-server', 'etcd', 'scheduler', 'controller-manager', 'cloud-controller', 'admission-controllers'],
  },
  {
    id: 'worker-node-1',
    name: 'Worker Node 1',
    category: 'worker-node',
    color: '#3b82f6',
    position: [-4.5, -0.7, 2.2],
    size: [4.5, 3, 3],
    children: ['kubelet-1', 'kube-proxy-1', 'container-runtime-1', 'pod-1a', 'pod-1b'],
  },
  {
    id: 'worker-node-2',
    name: 'Worker Node 2',
    category: 'worker-node',
    color: '#3b82f6',
    position: [4.5, -0.7, 2.2],
    size: [4.5, 3, 3],
    children: ['kubelet-2', 'kube-proxy-2', 'container-runtime-2', 'pod-2a', 'pod-2b'],
  },
  {
    id: 'storage-group',
    name: 'Storage Layer',
    category: 'storage',
    color: '#f59e0b',
    position: [0, -2.8, 0.3],
    size: [6, 1.8, 2.5],
    children: ['pv', 'pvc', 'storage-class', 'csi-driver'],
  },
]
