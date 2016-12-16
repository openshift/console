import {k8sEnum} from './enum';
import {util} from './util';

import * as k8sPods from './pods';

angular.module('k8s')
.service('k8sDeployments', function() {
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
