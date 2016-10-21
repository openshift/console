angular.module('bridge.page')
.controller('ConfigureJobParallelismCtrl', function($scope, $uibModalInstance, k8s, resource, resourceKind) {
  'use strict';

  $scope.resourceKind = resourceKind;
  $scope.fields = {
    parallelism: resource.spec.parallelism || 1,
  };

  $scope.submit = function() {
    var patch = [{ op: 'replace', path: '/spec/parallelism', value: $scope.fields.parallelism }];
    $scope.requestPromise = k8s.resource.patch(resourceKind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $uibModalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

});
