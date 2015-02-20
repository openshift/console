angular.module('app')
.controller('ConfigureSelectorCtrl', function(_, $scope, $modalInstance, $controller, $rootScope,
      resource, resourceKind, selectorKind, message, k8s) {
  'use strict';

  $scope.message = message;
  $scope.resource = resource;
  $scope.resourceKind = resourceKind;
  $scope.selectorKind = selectorKind;
  $scope.fields = {
    selector: angular.copy(resource.spec.selector),
  };

  $scope.save = function() {
    resource.spec.selector = $scope.fields.selector;
    $scope.requestPromise = k8s.resource.update($scope.resourceKind, resource);
    $scope.requestPromise.then(function(updatedResource) {
      $modalInstance.close(updatedResource);
    });
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureSelectorFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
