angular.module('k8s').constant('k8sEnum', {

  DefaultNS: 'default',

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
      // A unique id to identify the type.
      id: 'always',
      // Value used in communication with API.
      value: {
        always: {},
      },
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
      id: 'onfailure',
      value: {
        onFailure: {},
      },
      label: 'Restart On Failure',
      weight: 200,
      description: 'If the container exits with a non-zero status code, restart it.',
    },
    Never: {
      id: 'never',
      value: {
        never: {},
      },
      label: 'Never Restart',
      weight: 300,
      description: 'Never restart the container. ' +
        'Useful for containers that exit when they have completed a specific job, like a data import daemon.',
    },
  },

});
