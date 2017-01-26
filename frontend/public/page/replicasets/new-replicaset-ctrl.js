import {k8s, k8sEnum} from '../../module/k8s';
import {getNamespacedRoute} from '../../ui/ui-actions';

angular.module('bridge.page')
.controller('NewReplicaSetCtrl', function(_, $scope, $location, $routeParams) {
  'use strict';

  $scope.ns = $routeParams.ns || k8sEnum.DefaultNS;
  $scope.rs = k8s.replicasets.getEmpty($scope.ns);
  $scope.podTemplate = $scope.rs.spec.template;

  $scope.cancel = function() {
    $location.path(getNamespacedRoute('/replicasets'));
  };

  $scope.submit = function() {
    $scope.requestPromise = k8s.replicasets.create($scope.rs);
    $scope.requestPromise.then(function() {
      $location.path(getNamespacedRoute('/replicasets'));
    });
  };
});
