angular.module('bridge.page')
.controller('ConfigureLabelsCtrl', function(_, $scope, $modalInstance, $controller, $rootScope,
      resource, kind, k8s) {
  'use strict';

  $scope.resource = resource;
  $scope.kind = kind;
  $scope.fields = {
    labels: angular.copy(resource.metadata.labels),
  };

  $scope.save = function() {
    resource.metadata.labels = $scope.fields.labels;
    $scope.requestPromise = k8s.resource.update(kind, resource);
    $scope.requestPromise.then(function() {
      $modalInstance.close(resource);
    });
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureLabelsFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
