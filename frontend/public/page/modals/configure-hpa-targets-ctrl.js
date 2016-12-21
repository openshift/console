angular.module('bridge.page')
.controller('ConfigureHpaTargetsCtrl', function($scope, $uibModalInstance, k8s, resource, resourceKind) {
  'use strict';

  $scope.resourceKind = resourceKind;
  $scope.fields = {
    target: _.get(resource, 'spec.cpuUtilization.targetPercentage'),
  };

  $scope.submit = function() {
    var patch = [{ op: 'replace', path: '/spec/cpuUtilization/targetPercentage', value: $scope.fields.target }];
    $scope.requestPromise = k8s.resource.patch(resourceKind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $uibModalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

});
