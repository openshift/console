import {k8sEnum} from '../../module/k8s/enum';
import {getNamespacedRoute} from '../../ui/ui-actions';

angular.module('bridge.page')
.controller('EditReplicaSetCtrl', function($scope, $location, $routeParams, _, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8sEnum.DefaultNS;
  $scope.rsName = $routeParams.name;
  $scope.loadError = false;
  $scope.loaded = false;
  $scope.rs = {};
  $scope.navProps = {
    pages: [
      {name: 'Overview', href: 'details'},
      {name: 'Edit', href: 'edit'},
      {name: 'YAML', href: 'yaml'},
      {name: 'Pods', href: 'pods'},
    ]
  };

  k8s.replicasets.get($routeParams.name, $scope.ns)
    .then(function(rs) {
      $scope.rs = rs;
      $scope.loadError = false;
      $scope.loaded = true;
    })
    .catch(function() {
      $scope.loadError = true;
    });

  $scope.cancel = function() {
    $location.path(getNamespacedRoute('/replicasets'));
  };

  $scope.submit = function() {
    $scope.requestPromise = k8s.replicasets.update($scope.rs);
    $scope.requestPromise.then(function() {
      $location.path(getNamespacedRoute('/replicasets'));
    });
  };
});
