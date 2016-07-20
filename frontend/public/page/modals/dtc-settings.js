angular.module('bridge.page')
.controller('DtcSettingsCtrl', function(_, $scope, $uibModalInstance, $q, k8s) {
  'use strict';

  let taintManager, tpmManager;
  // k8sCache.configmapsChanged($scope,
  //   configmaps => {
  //     configmaps && configmaps.forEach(cm => {
  //       switch (cm.metadata.name) {
  //         case 'taint.coreos.com':
  //           taintManager = cm;
  //           break;
  //         case 'tpm-manager.coreos.com':
  //           tpmManager = cm;
  //           break;
  //       }
  //     });
  //   }, err => $scope.loadError = err);

  $scope.fields = {
    admission: taintManager.data.taint ? 'closed' : 'open',
    reverify: tpmManager.data.reverify,
    notallowunknown: !(tpmManager.data.allowunknown === 'true'),
    enabledReverify: parseInt(tpmManager.data.reverify, 10) > 0,
  };

  $scope.execute = function() {
    const shouldTaint = ($scope.fields.admission === 'closed').toString();
    const allowUnknown = (!$scope.fields.notallowunknown).toString();
    const reverify = $scope.fields.reverify.toString();


    let promise1;
    if (shouldTaint !== taintManager.data.taint) {
      const newTaint = _.cloneDeep(taintManager);
      newTaint.data.taint = shouldTaint;
      promise1 = k8s.configmaps.update(newTaint);
    }

    let promise2;
    if (allowUnknown !== tpmManager.data.allowunknown || reverify !== tpmManager.data.reverify) {
      const manager = _.cloneDeep(tpmManager);
      manager.data.allowunknown = allowUnknown;
      manager.data.reverify = reverify;
      promise2 = k8s.configmaps.update(manager);
    }

    $scope.requestPromise = promise1 && promise2 ? $q.all([promise1, promise2]) : promise1 || promise2;

    $scope.requestPromise.then(function() {
      $uibModalInstance.dismiss('cancel');
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  let previousReverify = tpmManager.data.reverify || 10;
  $scope.$watch('fields.reverify', () => {
    const reverify = parseInt($scope.fields.reverify, 10);
    if ( reverify === 0 ) {
      if ($scope.fields.enabledReverify) {
        $scope.fields.enabledReverify = false;
      }
      return;
    }
    if (!$scope.fields.enabledReverify ) {
      $scope.fields.enabledReverify = true;
    }
    previousReverify = reverify;
  });

  $scope.$watch('fields.enabledReverify', () => {
    if ($scope.fields.enabledReverify) {
      $scope.fields.reverify = previousReverify;
      return;
    }
    const reverify = parseInt($scope.fields.reverify, 10);
    if ( reverify !== 0 ) {
      previousReverify = reverify;
    }
    $scope.fields.reverify = 0;
  });

});
