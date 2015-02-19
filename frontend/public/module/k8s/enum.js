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

});
