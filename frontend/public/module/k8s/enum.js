export const k8sEnum = {

  DefaultNS: 'default',

  ResourceLimitRegex: /^([+-]?[0-9.]+)([eEimkKMGTP]*[-+]?[0-9]*)$/,

  Kind: {
    Service: {
      // singular label
      label: 'Service',
      // api path to resource
      path: 'services',
      //Used in resource-list.jsx to return the matching object
      plural: 'services',
      abbr: 'S',
    },
    Pod: {
      label: 'Pod',
      path: 'pods',
      plural: 'pods',
      abbr: 'P',
    },
    Container: {
      label: 'Container',
      path: 'containers',
      plural: 'containers',
      abbr: 'C',
    },
    DaemonSet: {
      label: 'Daemon Set',
      path: 'daemonsets',
      plural: 'daemonsets',
      isExtension: true,
      apiVersion: 'v1beta1',
      abbr: 'DS',
    },
    ReplicationController: {
      label: 'Replication Controller',
      path: 'replicationcontrollers',
      plural: 'replicationcontrollers',
      abbr: 'RC',
    },
    HorizontalPodAutoscaler: {
      label: 'Horizontal Pod Autoscaler',
      path: 'horizontalpodautoscalers',
      plural: 'horizontalpodautoscalers',
      apiVersion: 'autoscaling/v1',
      basePath: '/apis/',
      abbr: 'HPA',
    },
    ServiceAccount: {
      label: 'Service Account',
      path: 'serviceaccounts',
      plural: 'serviceaccounts',
      abbr: 'SA',
    },
    ReplicaSet: {
      label: 'Replica Set',
      isExtension: true,
      apiVersion: 'v1beta1',
      path: 'replicasets',
      plural: 'replicasets',
      abbr: 'RS',
    },
    Deployment: {
      label: 'Deployment',
      isExtension: true,
      apiVersion: 'v1beta1',
      path: 'deployments',
      plural: 'deployments',
      abbr: 'D',
    },
    Job: {
      label: 'Job',
      apiVersion: 'batch/v1',
      path: 'jobs',
      basePath: '/apis/',
      plural: 'jobs',
      abbr: 'J',
    },
    Node: {
      label: 'Node',
      path: 'nodes',
      plural: 'nodes',
      abbr: 'N',
    },
    Event: {
      label: 'Event',
      path: 'events',
      plural: 'events',
      abbr: 'E',
    },
    ComponentStatus: {
      label: 'Component Status',
      labelPlural: 'Component Statuses',
      path: 'componentstatuses',
      plural: 'componentstatuses',
      abbr: 'CS',
    },
    Namespace: {
      label: 'Namespace',
      path: 'namespaces',
      plural: 'namespaces',
      abbr: 'N',
    },
    Ingress: {
      label: 'Ingress',
      labelPlural: 'Ingresses',
      isExtension: true,
      apiVersion: 'v1beta1',
      path: 'ingresses',
      plural: 'ingresses',
      abbr: 'I',
    },
    ConfigMap: {
      label: 'Config Map',
      path: 'configmaps',
      plural: 'configmaps',
      abbr: 'CM',
    },
    Secret: {
      label: 'Secret',
      path: 'secrets',
      plural: 'secrets',
      abbr: 'S',
    },
    ClusterRoleBinding: {
      label: 'Cluster Role Binding',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'clusterrolebindings',
      plural: 'clusterrolebindings',
      abbr: 'CRB',
    },
    ClusterRole: {
      label: 'Cluster Role',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'clusterroles',
      plural: 'clusterroles',
      abbr: 'CR'
    },
    RoleBinding: {
      label: 'Role Binding',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'rolebindings',
      plural: 'rolebindings',
      abbr: 'RB',
    },
    Role: {
      label: 'Role',
      basePath: '/apis/rbac.authorization.k8s.io/',
      apiVersion: 'v1beta1',
      path: 'roles',
      plural: 'roles',
      abbr: 'R',
    },
    TectonicVersion: {
      label: 'Tectonic Version',
      basePath: '/apis/coreos.com/',
      apiVersion: 'v1',
      path: 'tectonicversions',
      plural: 'tectonicversions',
      abbr: 'TV',
    },
    ChannelOperatorConfig: {
      label: 'Channel Operator Config',
      basePath: '/apis/coreos.com/',
      apiVersion: 'v1',
      path: 'channeloperatorconfigs',
      plural: 'channeloperatorconfigs',
      abbr: 'COC',
    },
    AppVersion: {
      label: 'AppVersion',
      basePath: '/apis/coreos.com/',
      apiVersion: 'v1',
      path: 'appversions',
      plural: 'appversions',
      abbr: 'AV',
    },
    Petset: {
      label: 'Petset',
      plural: 'petsets',
      abbr: 'PS',
    },
    StatefulSet: {
      label: 'StatefulSet',
      plural: 'statefulsets',
      abbr: 'SS',
    },
    EtcdCluster: {
      label: 'etcd Cluster',
      apiVersion: 'v1beta1',
      basePath: '/apis/etcd.coreos.com/',
      path: 'clusters',
      plural: 'etcdclusters',
      abbr: 'EC',
    },
    NetworkPolicy: {
      label: 'Network Policy',
      labelPlural: 'Network Policies',
      apiVersion: 'v1',
      basePath: '/apis/networking.k8s.io/',
      path: 'networkpolicies',
      plural: 'networkpolicies',
      abbr: 'NP',
    },
    Prometheus: {
      label: 'Prometheus',
      labelPlural: 'Prometheuses',
      apiVersion: 'v1alpha1',
      basePath: '/apis/monitoring.coreos.com/',
      path: 'prometheuses',
      plural: 'prometheuses',
      abbr: 'PI',
    },
    ServiceMonitor: {
      label: 'Service Monitor',
      labelPlural: 'Service Monitors',
      apiVersion: 'v1alpha1',
      basePath: '/apis/monitoring.coreos.com/',
      path: 'servicemonitors',
      plural: 'servicemonitors',
      abbr: 'SM',
    },
    Alertmanager: {
      label: 'Alert Manager',
      labelPlural: 'Alert Managers',
      apiVersion: 'v1alpha1',
      basePath: '/apis/monitoring.coreos.com/',
      path: 'alertmanagers',
      plural: 'alertmanagers',
      abbr: 'AM',
    },
    'PodVuln': {
      label: 'Pod Vuln',
      labelPlural: 'Pod Vulns',
      path: 'podvulns',
      plural: 'podvulns',
      abbr: 'PV',
    },
    '*': {
      id: 'all',
      plural: 'all',
      labelPlural: 'All',
      abbr: '*',
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

export const idToEnum = {};
_.each(k8sEnum.Kind, v => idToEnum[v.id] = v);

// Shortcut because this is used so often
export const k8sKinds = k8sEnum.Kind;

_.each(k8sEnum.Kind, (v, k) => {
  v.kind = v.kind || k;
  v.id = v.id || k.toLowerCase();
  v.labelPlural = v.labelPlural || `${v.label}s`;
});
