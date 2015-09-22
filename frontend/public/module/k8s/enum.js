angular.module('k8s').constant('k8sEnum', {

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
    },
    POD: {
      id: 'pod',
      kind: 'Pod',
      label: 'Pod',
      labelPlural: 'Pods',
      path: 'pods',
    },
    REPLICATIONCONTROLLER: {
      id: 'replicationcontroller',
      kind: 'ReplicationController',
      label: 'Replication Controller',
      labelPlural: 'Replication Controllers',
      path: 'replicationcontrollers',
    },
    NODE: {
      id: 'node',
      kind: 'Node',
      label: 'Machine',
      labelPlural: 'Machines',
      path: 'nodes',
    },
    EVENT: {
      id: 'event',
      kind: 'Event',
      label: 'Event',
      labelPlural: 'Events',
      path: 'events',
    },
    COMPONENTSTATUS: {
      id: 'componentstatus',
      kind: 'ComponentStatus',
      label: 'Component Status',
      labelPlural: 'Component Statuses',
      path: 'componentstatuses',
    },
    NAMESPACE: {
      id: 'namespace',
      kind: 'Namespace',
      label: 'Namespace',
      labelPlural: 'Namespaces',
      path: 'namespaces',
    },
  },

  PullPolicy: {
    Always: {
      id: 'always',
      value: 'Always',
      label: 'Always Pull',
      weight: 100,
      description: 'Pull down a new copy of the container image whenever a new pod is created.',
      default: true,
    },
    IfNotPresent: {
      id: 'ifnotpresent',
      value: 'IfNotPresent',
      label: 'Pull If Needed',
      weight: 200,
      description: 'If the container isn’t available locally, pull it down.',
    },
    Never: {
      id: 'never',
      value: 'Never',
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
      id: 'gitRepot',
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
  },

});
