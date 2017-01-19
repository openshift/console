import {k8sEnum} from '../../module/k8s';
import {getNamespacedRoute} from '../../ui/ui-actions';

angular.module('bridge.page')
.controller('NewServiceCtrl', function($scope, $routeParams, $location, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8sEnum.DefaultNS;
  $scope.service = k8s.services.getEmpty($scope.ns);

  $scope.minPort = 30000;
  $scope.maxPort = 32767;

  $scope.fields = {
    portObj: k8s.services.getEmptyPort(),
    nodePortAssignment: 'auto',
  };

  $scope.save = function() {
    // TODO(sym3tri): remove this once we support multiple ports.
    $scope.fields.portObj.name = 'default';

    $scope.service.spec.ports = [];
    $scope.service.spec.ports.push($scope.fields.portObj);
    $scope.requestPromise = k8s.services.create($scope.service);
    $scope.requestPromise.then(function() {
      $location.path(getNamespacedRoute('/services'));
    });
  };

  $scope.cancel = function() {
    $location.path(getNamespacedRoute('/services'));
  };

  // Prevent values for nodePort if auto-selecting a port.
  $scope.$watch('fields.nodePortAssignment', function(val) {
    if (val === 'auto') {
      $scope.fields.portObj.nodePort = null;
    }
  });

})

.controller('NewServiceFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
