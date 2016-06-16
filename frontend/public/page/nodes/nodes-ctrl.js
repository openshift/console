angular.module('bridge.page')
.controller('NodesCtrl', function ($scope, k8sCache, ModalLauncherSvc) {
  'use strict';

  k8sCache.configmapsChanged($scope,
    configmaps => {
      configmaps && configmaps.forEach(cm => {
        switch (cm.metadata.name) {
          case 'taint.coreos.com':
            $scope.taintManager = cm.data;
            break;
          case 'tpm-manager.coreos.com':
            $scope.tpmManager = cm.data;
            break;
        }
      });
    }, err => $scope.dtcError = err);

  $scope.dtcModal = () => {
    ModalLauncherSvc.open('dtc-settings');
  };
});
