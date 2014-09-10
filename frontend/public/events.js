(function() {
  'use strict';

  angular.module('app').constant('EVENTS', {
    SERVICE_DELETE: 'service-delete',
    POD_DELETE: 'pod-delete',
    CONTROLLER_DELETE: 'controller-delete',
    CONTAINER_REMOVE: 'container-remove',
  });

}());
