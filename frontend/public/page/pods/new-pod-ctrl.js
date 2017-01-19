import {k8sEnum} from '../../module/k8s';
import {getNamespacedRoute} from '../../ui/ui-actions';

angular.module('bridge.page')
.controller('NewPodCtrl', function(_, $scope, $location, $routeParams, k8s) {
  'use strict';

  var namespace = $routeParams.ns || k8sEnum.DefaultNS;
  $scope.pod = k8s.pods.getEmpty(namespace);

  $scope.cancel = function() {
    $location.path(getNamespacedRoute('/pods'));
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.pods.create($scope.pod);
    $scope.requestPromise.then(function() {
      $location.path(getNamespacedRoute('/pods'));
    });
  };

})

.controller('NewPodFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
