angular.module('app')
.controller('NewServiceCtrl', function($scope, $routeParams, $location,
      ServicesSvc) {
  'use strict';

  $scope.service = {
    id: null,
    port: null,
    containerPort: null,
    selector: null,
    labels: null
  };

  $scope.save = function() {
    $scope.requestPromise = ServicesSvc.create($scope.service);
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
