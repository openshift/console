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
    var patch = [{ op: 'replace', path: '/metadata/labels', value: $scope.fields.labels }];
    $scope.requestPromise = k8s.resource.patch(kind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $modalInstance.close(result);
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
