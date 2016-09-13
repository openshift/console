angular.module('bridge.page')
.controller('ConfigureHpaReplicasCtrl', function($scope, $uibModalInstance, k8s, resource, resourceKind) {
  'use strict';

  $scope.resourceKind = resourceKind;
  $scope.fields = {
    min: resource.spec.minReplicas,
    max: resource.spec.maxReplicas,
  };

  $scope.submit = function() {
    var patch = [
      { op: 'replace', path: '/spec/minReplicas', value: $scope.fields.min },
      { op: 'replace', path: '/spec/maxReplicas', value: $scope.fields.max },
    ];
    $scope.requestPromise = k8s.resource.patch(resourceKind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $uibModalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

})
