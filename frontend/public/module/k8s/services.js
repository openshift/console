angular.module('k8s')
.service('k8sServices', function(k8sUtil) {
  'use strict';

  this.clean = function(service) {
    k8sUtil.nullifyEmpty(service.metadata, ['annotations', 'labels']);
    k8sUtil.nullifyEmpty(service.spec, ['publicIPs']);
  };

  this.getEmpty = function() {
    return {
      metadata: {
        annotations: null,
        name: null,
        labels: null,
      },
      spec: {
        containerPort: null,
        createExternalLoadBalancer: false,
        port: null,
        portalIP: null,
        protocol: 'TCP',
        proxyPort: null,
        publicIPs: [],
        selector: null,
        sessionAffinity: null,
      },
    };
  };

});
