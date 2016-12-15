import {k8sEnum} from './enum';
import {util} from './util';

angular.module('k8s')
.service('k8sReplicationcontrollers', function(k8sPods) {
  'use strict';

  this.clean = function(rc) {
    util.nullifyEmpty(rc.metadata, ['annotations', 'labels']);
    k8sPods.clean(rc.spec.template);
    util.deleteNulls(rc.metadata);
    util.deleteNulls(rc.spec);
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
