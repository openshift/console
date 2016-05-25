angular.module('k8s')
.service('k8sDeployments', function(k8sUtil, k8sPods, k8sEnum) {
  'use strict';

  this.clean = function(deployment) {
    k8sUtil.nullifyEmpty(deployment.metadata, ['annotations', 'labels']);
    k8sPods.clean(deployment.spec.template);
    k8sUtil.deleteNulls(deployment.metadata);
    k8sUtil.deleteNulls(deployment.spec);
  };

  this.getEmpty = function(ns) {
    return {
      metadata: {
        annotations: [],
        labels: [],
        name: null,
        namespace: ns || k8sEnum.DefaultNS,
      },
      spec: {
        replicas: 0,
        selector: null,
        template: k8sPods.getEmpty(),
        templateRef: null,
      },
    };
  };
});
