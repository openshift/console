export const k8sEnum = {

  DefaultNS: 'default',

  ResourceLimitRegex: /^([+-]?[0-9.]+)([eEimkKMGTP]*[-+]?[0-9]*)$/,

  Kind: {
    SERVICE: {
      // unique machine-friendly id
      id: 'service',
      // k8s "kind" used by api
      kind: 'Service',
      // singular label
      label: 'Service',
      // plural label
      labelPlural: 'Services',
      // api path to resource
      path: 'services',
      plural: 'services',
    },
    POD: {
      id: 'pod',
      kind: 'Pod',
      label: 'Pod',
      labelPlural: 'Pods',
      path: 'pods',
      plural: 'pods',
    },
    CONTAINER: {
      id: 'container',
      kind: 'Container',
      label: 'Container',
      labelPlural: 'Containers',
      path: 'containers',
      plural: 'containers',
    },
    DAEMONSET: {
      id: 'daemonset',
      kind: 'DaemonSet',
      label: 'Daemon Set',
      labelPlural: 'Daemon Sets',
      path: 'daemonsets',
      plural: 'daemonsets',
      isExtension: true,
      apiVersion: 'v1beta1',
    },
    REPLICATIONCONTROLLER: {
      id: 'replicationcontroller',
      kind: 'ReplicationController',
      label: 'Replication Controller',
      labelPlural: 'Replication Controllers',
      path: 'replicationcontrollers',
      plural: 'replicationcontrollers',
    },
    HORIZONTALPODAUTOSCALER: {
      id: 'horizontalpodautoscaler',
      kind: 'HorizontalPodAutoscaler',
      label: 'Horizontal Pod Autoscaler',
      labelPlural: 'Horizontal Pod Autoscalers',
      path: 'horizontalpodautoscalers',
      plural: 'horizontalpodautoscalers',
      apiVersion: 'autoscaling/v1',
      basePath: '/apis/'
    },
    SERVICEACCOUNT: {
      id: 'serviceaccount',
      kind: 'ServiceAccount',
      label: 'Service Account',
      labelPlural: 'Service Accounts',
      path: 'serviceaccounts',
      plural: 'serviceaccounts',
    },
    REPLICASET: {
      id: 'replicaset',
      kind: 'ReplicaSet',
      label: 'Replica Set',
      labelPlural: 'Replica Sets',
      isExtension: true,
      apiVersion: 'v1beta1',
      path: 'replicasets',
      plural: 'replicasets',
    },
    DEPLOYMENT: {
      id: 'deployment',
      kind: 'Deployment',
      label: 'Deployment',
      labelPlural: 'Deployments',
      isExtension: true,
      apiVersion: 'v1beta1',
      path: 'deployments',
      plural: 'deployments',
    },
    JOB: {
      id: 'job',
      kind: 'Job',
      label: 'Job',
      labelPlural: 'Jobs',
      apiVersion: 'batch/v1',
      path: 'jobs',
      basePath: '/apis/',
      plural: 'jobs',
    },
    NODE: {
      id: 'node',
      kind: 'Node',
      label: 'Node',
      labelPlural: 'Nodes',
      path: 'nodes',
      plural: 'nodes',
    },
    EVENT: {
      id: 'event',
      kind: 'Event',
      label: 'Event',
      labelPlural: 'Events',
      path: 'events',
      plural: 'events',
    },
    COMPONENTSTATUS: {
      id: 'componentstatus',
      kind: 'ComponentStatus',
      label: 'Component Status',
      labelPlural: 'Component Statuses',
      path: 'componentstatuses',
      plural: 'componentstatuses',
    },
    NAMESPACE: {
      id: 'namespace',
      kind: 'Namespace',
      label: 'Namespace',
      labelPlural: 'Namespaces',
      path: 'namespaces',
      plural: 'namespaces',
    },
    INGRESS: {
      id: 'ingress',
      kind: 'Ingress',
      label: 'Ingress',
      labelPlural: 'Ingress',
      isExtension: true,
      apiVersion: 'v1beta1',
      path: 'ingresses',
      plural: 'ingresses',
    },
    CONFIGMAP: {
      id: 'configmap',
      kind: 'ConfigMap',
      label: 'Config Map',
      labelPlural: 'Config Maps',
      path: 'configmaps',
      plural: 'configmaps',
    },
    SECRET: {
      id: 'secret',
      kind: 'Secret',
      label: 'Secret',
      labelPlural: 'Secrets',
      path: 'secrets',
      plural: 'secrets',
    },
    'CLUSTERROLEBINDING': {
      id: 'clusterrolebinding',
      kind: 'ClusterRoleBinding',
      label: 'Cluster Role Binding',
      labelPlural: 'Cluster Role Bindings',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'clusterrolebindings',
      plural: 'clusterrolebindings',
    },
    'CLUSTERROLE': {
      id: 'clusterrole',
      kind: 'ClusterRole',
      label: 'Cluster Role',
      labelPlural: 'Cluster Roles',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'clusterroles',
      plural: 'clusterroles',
    },
    'ROLEBINDING': {
      id: 'rolebinding',
      kind: 'RoleBinding',
      label: 'Role Binding',
      labelPlural: 'Role Bindings',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'rolebindings',
      plural: 'rolebindings',
    },
    'ROLE': {
      id: 'role',
      kind: 'Role',
      label: 'Role',
      labelPlural: 'Roles',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'roles',
      plural: 'roles',
    },
    'TECTONICVERSION': {
      id: 'tectonicversion',
      kind: 'TectonicVersion',
      label: 'TectonicVersion',
      labelPlural: 'TectonicVersions',
      basePath: '/apis/coreos.com/',
      apiVersion: 'v1',
      path: 'tectonicversions',
      plural: 'tectonicversions',
    },
    'CHANNELOPERATORCONFIG': {
      id: 'channeloperatorconfig',
      kind: 'ChannelOperatorConfig',
      label: 'ChannelOperatorConfig',
      labelPlural: 'ChannelOperatorConfigs',
      basePath: '/apis/coreos.com/',
      apiVersion: 'v1',
      path: 'channeloperatorconfigs',
      plural: 'channeloperatorconfigs',
    },
    'APPVERSION': {
      id: 'appversion',
      kind: 'AppVersion',
      label: 'AppVersion',
      labelPlural: 'AppVersions',
      basePath: '/apis/coreos.com/',
      apiVersion: 'v1',
      path: 'appversions',
      plural: 'appversions',
    },
    PETSET: {
      id: 'petset',
      label: 'Petset',
      labelPlural: 'Pet Sets',
      plural: 'petsets',
    },
    'CLUSTER': {
      id: 'cluster',
      kind: 'Cluster',
      label: 'EtcdCluster',
      labelPlural: 'EtcdClusters',
      apiVersion: 'v1beta1',
      basePath: '/apis/etcd.coreos.com/',
      path: 'clusters',
      plural: 'clusters'
    },
    '*': {
      id: 'all',
      plural: 'all',
      labelPlural: 'All',
    }
  },

  PullPolicy: {
    Always: {
      id: 'Always',
      label: 'Always Pull',
      weight: 100,
      description: 'Pull down a new copy of the container image whenever a new pod is created.',
      default: true,
    },
    IfNotPresent: {
      id: 'IfNotPresent',
      label: 'Pull If Needed',
      weight: 200,
      description: 'If the container isn’t available locally, pull it down.',
    },
    Never: {
      id: 'Never',
      label: 'Never Pull',
      weight: 300,
      description: 'Don\'t pull down a container image. ' +
        'If the correct container image doesn\'t exist locally, the pod will fail to start correctly.',
    },
  },

  RestartPolicy: {
    Always: {
      // A unique id to identify the type, used as the value when communicating with the API.
      id: 'Always',
      // What is shown in the UI.
      label: 'Always Restart',
      // Ordering weight.
      weight: 100,
      // Description in the UI.
      description: 'If the container restarts for any reason, restart it. ' +
        'Useful for stateless services that may fail from time to time.',
      // Default selection for new pods.
      default: true,
    },
    OnFailure: {
      id: 'OnFailure',
      label: 'Restart On Failure',
      weight: 200,
      description: 'If the container exits with a non-zero status code, restart it.',
    },
    Never: {
      id: 'Never',
      label: 'Never Restart',
      weight: 300,
      description: 'Never restart the container. ' +
        'Useful for containers that exit when they have completed a specific job, like a data import daemon.',
    },
  },

  // Used for probes and lifecycle actions.
  HookAction: {
    exec: {
      weight: 100,
      id: 'exec',
      label: 'Exec Command',
    },
    httpGet: {
      weight: 200,
      id: 'httpGet',
      label: 'HTTP Get',
    },
    tcpSocket: {
      weight: 300,
      id: 'tcpSocket',
      label: 'TCP Socket (Port)',
    },
  },

  VolumeSource: {
    emptyDir: {
      weight: 100,
      id: 'emptyDir',
      label: 'Container Volume',
      description: 'Temporary directory that shares a pod\'s lifetime.',
    },
    hostPath: {
      weight: 200,
      id: 'hostPath',
      label: 'Host Directory',
      description: 'Pre-existing host file or directory, ' +
          'generally for privileged system daemons or other agents tied to the host.',
    },
    gitRepo: {
      weight: 300,
      id: 'gitRepo',
      label: 'Git Repo',
      description: 'Git repository at a particular revision.',
    },
    nfs: {
      weight: 400,
      id: 'nfs',
      label: 'NFS',
      description: 'NFS volume that will be mounted in the host machine.',
    },
    secret: {
      weight: 500,
      id: 'secret',
      label: 'Secret',
      description: 'Secret to populate volume.',
    },
    gcePersistentDisk: {
      weight: 600,
      id: 'gcePersistentDisk',
      label: 'GCE Persistent Disk',
      description: 'GCE disk resource attached to the host machine on demand.',
    },
    awsElasticBlockStore: {
      weight: 700,
      id: 'awsElasticBlockStore',
      label: 'AWS Elastic Block Store',
      description: 'AWS disk resource attached to the host machine on demand.',
    },
    glusterfs: {
      weight: 800,
      id: 'glusterfs',
      label: 'Gluster FS',
      description: 'GlusterFS volume that will be mounted on the host machine.',
    },
    iscsi: {
      weight: 900,
      id: 'iscsi',
      label: 'iSCSI',
      description: 'iSCSI disk attached to host machine on demand',
    },
    configMap: {
      weight: 1000,
      id: 'configMap',
      label: 'ConfigMap',
      description: 'ConfigMap to be consumed in volume.',
    },
  },

};

// Shortcut because this is used so often
export const k8sKinds = k8sEnum.Kind;
