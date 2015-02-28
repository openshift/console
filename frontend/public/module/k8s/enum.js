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
    Always: 'Always',
    Never: 'Never',
    IfNotPresent: 'IfNotPresent',
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
