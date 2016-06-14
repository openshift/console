'use strict';

function makeEvents (names) {
  const events = {};
  names.forEach( name => {
    events[name] = {
      ADDED: `k8s-${name}-added`,
      MODIFIED: `k8s-${name}-modified`,
      DELETED: `k8s-${name}-deleted`,
    };
  });
  return events;
}

angular.module('k8s').constant('k8sEvents', makeEvents([
  // must match Enum.KIND.IDs
  'resources', 'pods', 'replicasets', 'replicationcontrollers', 'deployments', 'services', 'nodes', 'namespaces', 'configmaps'
]));
