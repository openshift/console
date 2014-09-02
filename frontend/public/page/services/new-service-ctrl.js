angular.module('app')
.controller('NewServiceCtrl', function($scope, $routeParams, ServicesSvc) {
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
  };

})

.controller('NewServiceFormCtrl', function($scope) {
  'use strict';

  $scope.submit = $scope.save;
});
