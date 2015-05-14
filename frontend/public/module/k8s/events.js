angular.module('k8s').constant('k8sEvents', {
  RESOURCE_ADDED: 'k8s-resource-added',
  RESOURCE_MODIFIED: 'k8s-resource-modified',
  RESOURCE_DELETED: 'k8s-resource-deleted',

  POD_ADDED: 'k8s-pod-added',
  POD_MODIFIED: 'k8s-pod-modified',
  POD_DELETED: 'k8s-pod-deleted',

  RC_ADDED: 'k8s-rc-added',
  RC_MODIFIED: 'k8s-rc-modified',
  RC_DELETED: 'k8s-rc-deleted',

  SERVICE_ADDED: 'k8s-service-added',
  SERVICE_MODIFIED: 'k8s-service-modified',
  SERVICE_DELETED: 'k8s-service-deleted',

  NODE_ADDED: 'k8s-node-added',
  NODE_MODIFIED: 'k8s-node-modified',
  NODE_DELETED: 'k8s-node-deleted',
});
