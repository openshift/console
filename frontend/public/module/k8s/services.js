angular.module('k8s')
.service('k8sServices', function(k8sUtil, k8sEnum) {
  'use strict';

  this.clean = function(service) {
    k8sUtil.nullifyEmpty(service.metadata, ['annotations', 'labels']);
    k8sUtil.nullifyEmpty(service.spec, ['publicIPs']);
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
