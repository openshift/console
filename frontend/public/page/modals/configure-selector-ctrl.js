angular.module('bridge.page')
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
    var patch = [{ op: 'replace', path: '/spec/selector', value: $scope.fields.selector }];
    $scope.requestPromise = k8s.resource.patch($scope.resourceKind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $modalInstance.close(result);
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
