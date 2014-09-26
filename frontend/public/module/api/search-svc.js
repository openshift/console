angular.module('app')
.service('SearchSvc', function(_, PodsSvc, ServicesSvc, ControllersSvc) {
  'use strict';

  this.search = function(entityType, labels) {
    var svc;
    // TODO: hopefully replace this logic if k8s ever gets a label search api.
    switch (entityType) {
      case 'pod':
      case 'pods':
        svc = PodsSvc;
        break;
      case 'controller':
      case 'controllers':
        svc = ControllersSvc;
        break;
      case 'service':
      case 'services':
        svc = ServicesSvc;
        break;
    }
    return svc.list({ labels: labels });
  };

});
