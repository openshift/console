angular.module('app')
.controller('NewAppCtrl', function($scope, $routeParams, $location, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.service = k8s.services.getEmpty($scope.ns);

  $scope.save = function() {
    $scope.requestPromise = k8s.services.create($scope.service);
    $scope.requestPromise.then(function() {
      $location.path('/apps');
    });
  };

})

.controller('NewAppFormCtrl', function($scope) {
  'use strict';

  $scope.submit = $scope.save;

  $scope.continue = function() {
    // TODO: continue to next step
  };

});
