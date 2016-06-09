angular.module('bridge.page')
.controller('dtcSettings', function($scope, $uibModalInstance, k8s, $q) {
  'use strict';

  $q.all([
    k8s.configmaps.get('tpm-manager.coreos.com', 'default'),
    k8s.configmaps.get('taint.coreos.com', 'default'),
  ])
  .then(configs => {
    $scope.managerOfTPM = configs[0];
    $scope.taintManager = configs[1];
  })
  .catch(() => {});

  $scope.save = function () {
    var patch = [{ op: 'replace', path: '/spec/selector', value: $scope.fields.selector }];
    $scope.requestPromise = k8s.resource.patch($scope.resourceKind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $uibModalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

});
