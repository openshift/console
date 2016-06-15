angular.module('bridge.page')
.controller('NodesCtrl', function ($scope, k8sCache) {
  'use strict';

  k8sCache.configmapsChanged($scope,
    configmaps => {
      configmaps && configmaps.forEach(cm => {
        switch (cm.metadata.name) {
          case 'taint.coreos.com':
            $scope.taintManager = cm;
            break;
          case 'tpm-manager.coreos.com':
            $scope.managerOfTPM = cm;
            break;
        }
      });
    }, err =>{
      debugger;
    });
});
