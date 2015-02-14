angular.module('app')
.controller('NewServiceCtrl', function($scope, $routeParams, $location, k8s) {
  'use strict';

  $scope.service = k8s.services.getEmpty();

  $scope.save = function() {
    $scope.requestPromise = k8s.services.create($scope.service);
    $scope.requestPromise.then(function() {
      $location.path('/services');
    });
  };

})

.controller('NewServiceFormCtrl', function($scope) {
  'use strict';

  $scope.submit = $scope.save;

  $scope.continue = function() {
    // TODO: continue to next step
  };

});
