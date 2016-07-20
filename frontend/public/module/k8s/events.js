'use strict';

const EVENTS = {};

export default EVENTS;
angular.module('k8s').constant('k8sEvents', EVENTS);

// must match Enum.KIND.plural
[
  'resources', 'pods', 'replicasets', 'replicationcontrollers', 'deployments',
  'services', 'nodes', 'namespaces', 'configmaps', 'policies',
].forEach(name => {
  EVENTS[name] = {
    ADDED: `k8s-${name}-added`,
    MODIFIED: `k8s-${name}-modified`,
    DELETED: `k8s-${name}-deleted`,
  };
});

