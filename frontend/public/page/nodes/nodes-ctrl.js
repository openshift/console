angular.module('bridge.page')
.controller('NodesCtrl', function ($scope, $q, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.modal = () => {
    ModalLauncherSvc.open('dtc-settings');
  }

  $q.all([
    k8s.configmaps.get('tpm-manager.coreos.com', 'default'),
    k8s.configmaps.get('taint.coreos.com', 'default'),
  ])
  .then(configs => {
    $scope.managerOfTPM = configs[0];
    $scope.taintManager = configs[1];
  })
  .catch(() => {});
});
