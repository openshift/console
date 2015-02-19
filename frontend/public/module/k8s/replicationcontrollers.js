angular.module('k8s')
.service('k8sReplicationcontrollers', function(k8sUtil, k8sPods, k8sEnum) {
  'use strict';

  this.clean = function(rc) {
    k8sUtil.nullifyEmpty(rc.metadata, ['annotations', 'labels']);
    k8sPods.clean(rc.spec.template);
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
