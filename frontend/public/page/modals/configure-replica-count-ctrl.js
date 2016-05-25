angular.module('bridge.page')
.controller('ConfigureReplicaCountCtrl', function($scope, $uibModalInstance, k8s, resource, resourceKind) {
  'use strict';

  $scope.resourceKind = resourceKind;
  $scope.fields = {
    replicas: resource.spec.replicas,
  };

  $scope.submit = function() {
    var patch = [{ op: 'replace', path: '/spec/replicas', value: $scope.fields.replicas }];
    $scope.requestPromise = k8s.resource.patch(resourceKind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $uibModalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

})
