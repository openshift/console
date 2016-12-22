angular.module('bridge.page')
.controller('ConfigureSelectorCtrl', function(_, $scope, $uibModalInstance, $controller, $rootScope,
      resource, resourceKind, selectorKind, message, k8s) {
  'use strict';

  $scope.message = message;
  $scope.resource = resource;
  $scope.resourceKind = resourceKind;
  $scope.selectorKind = selectorKind;
  $scope.fields = {
    selector: angular.copy(resource.spec.selector),
  };

  $scope.iconProps = {kind: resourceKind.id};

  $scope.save = function() {
    var patch = [{ op: 'replace', path: '/spec/selector', value: $scope.fields.selector }];
    $scope.requestPromise = k8s.resource.patch($scope.resourceKind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $uibModalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

})
.controller('ConfigureSelectorFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
