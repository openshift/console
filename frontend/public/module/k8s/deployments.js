import {util} from './util';

angular.module('k8s')
.service('k8sDeployments', function(k8sPods, k8sEnum) {
  'use strict';

  this.clean = function(deployment) {
    util.nullifyEmpty(deployment.metadata, ['annotations', 'labels']);
    k8sPods.clean(deployment.spec.template);
    util.deleteNulls(deployment.metadata);
    util.deleteNulls(deployment.spec);
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
        strategy: {
          type: 'RollingUpdate'
        },
        template: k8sPods.getEmpty(),
        templateRef: null,
      },
    };
  };
});
