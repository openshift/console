import {k8sEnum} from '../../module/k8s';
import {getNamespacedRoute} from '../../ui/ui-actions';

angular.module('bridge.page')
.controller('EditReplicationcontrollerCtrl', function($scope, $location, $routeParams, _, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8sEnum.DefaultNS;
  $scope.rcName = $routeParams.name;
  $scope.loadError = false;
  $scope.loaded = false;
  $scope.rc = {};
  $scope.navProps = {
    pages: [
      {name: 'Overview', href: 'details'},
      {name: 'Edit', href: 'edit'},
      {name: 'Pods', href: 'pods'},
      {name: 'Events', href: 'events'},
    ]
  };

  k8s.replicationcontrollers.get($routeParams.name, $scope.ns)
    .then(function(rc) {
      $scope.rc = rc;
      $scope.loadError = false;
      $scope.loaded = true;
    })
    .catch(function() {
      $scope.loadError = true;
    });

  $scope.cancel = function() {
    $location.path(getNamespacedRoute('/replicationcontrollers'));
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.replicationcontrollers.update($scope.rc);
    $scope.requestPromise.then(function() {
      $location.path(getNamespacedRoute('/replicationcontrollers'));
    });
  };

})

.controller('EditReplicationcontrollerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
