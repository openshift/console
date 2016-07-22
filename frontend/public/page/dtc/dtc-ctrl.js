'use strict';

angular.module('bridge.page')
.controller('DTCCtrl', function(_, $scope, k8s, tpm, CONST, Firehose, ModalLauncherSvc) {

  $scope.INVALID_POLICY = CONST.INVALID_POLICY;
  $scope.isTrusted = k8s.nodes.isTrusted;
  $scope.pcrToHuman = tpm.pcrToHuman;
  $scope.auditNode = tpm.auditNode;

  $scope.layers = {};
  _.each(tpm.LAYERS, (value, key) => {
    $scope.layers[key] = key;
  })

  new Firehose(k8s.policies)
    .watchList()
    .bindScope($scope, null, state => {
      $scope.policies = state.policies;
      $scope.loadPolicyError = state.loadError;
    });

  new Firehose(k8s.nodes)
    .watchList()
    .bindScope($scope, null, state => {
      $scope.nodes = state.nodes;
      $scope.loadNodeError = state.loadError;
    });

  new Firehose(k8s.configmaps)
    .watchList()
    .bindScope($scope, null, state => {
      if (state.loadError) {
        $scope.canAdmission = true;
        $scope.dtcError = state.loadError;
        return;
      }
      $scope.dtcError = null;
      _.each(state.configmaps, cm => {
        switch (cm.metadata.name) {
          case 'taint.coreos.com':
            $scope.taintManager = cm;
            break;
          case 'tpm-manager.coreos.com':
            $scope.tpmManager = cm;
            break;
        }
      });

      $scope.canAdmission = !!($scope.taintManager && $scope.tpmManager);
    });

  $scope.dtcModal = () => {
    ModalLauncherSvc.open('dtc-settings');
  };
});

