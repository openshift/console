import {util} from './util';

angular.module('k8s')
.service('k8sServices', function(k8sEnum) {
  'use strict';

  this.clean = function(service) {
    util.nullifyEmpty(service.metadata, ['annotations', 'labels']);
    util.nullifyEmpty(service.spec, ['ports']);
    util.deleteNulls(service.metadata);
    util.deleteNulls(service.spec);
  };

  this.getEmptyPort = function() {
    return {
      name: null,
      port: null,
      targetPort: null,
      protocol: 'TCP',
      nodePort: null,
    };
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
        type: 'ClusterIP',
        ports: [],
        clusterIP: null,
        selector: null,
        sessionAffinity: 'None',
      },
    };
  };

});
