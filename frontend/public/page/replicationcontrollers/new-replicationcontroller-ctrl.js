import {k8sEnum} from '../../module/k8s';
import {getNamespacedRoute} from '../../ui/ui-actions';

angular.module('bridge.page')
.controller('NewReplicationcontrollerCtrl', function(_, $scope, $location, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8sEnum.DefaultNS;
  $scope.rc = k8s.replicationcontrollers.getEmpty($scope.ns);
  $scope.podTemplate = $scope.rc.spec.template;

  $scope.cancel = function() {
    $location.path(getNamespacedRoute('/replicationcontrollers'));
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.replicationcontrollers.create($scope.rc);
    $scope.requestPromise.then(function() {
      $location.path(getNamespacedRoute('/replicationcontrollers'));
    });
  };

})

.controller('NewReplicationcontrollerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
