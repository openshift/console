angular.module('bridge.page')
.controller('NewServiceCtrl', function($scope, $routeParams, $location, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.service = k8s.services.getEmpty($scope.ns);

  $scope.fields = {
    portObj: k8s.services.getEmptyPort(),
  };

  $scope.save = function() {
    $scope.service.spec.ports.push($scope.fields.portObj);
    $scope.requestPromise = k8s.services.create($scope.service);
    $scope.requestPromise.then(function() {
      $location.path('/services');
    });
  };

  $scope.cancel = function() {
    $location.path('/services');
  };

})

.controller('NewServiceFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
