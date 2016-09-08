'use strict';

angular.module('bridge.page')
.controller('DTCCtrl', function(_, $scope, k8s, tpm, CONST, Firehose, ModalLauncherSvc) {

  $scope.INVALID_POLICY = CONST.INVALID_POLICY;
  $scope.isTrusted = k8s.nodes.isTrusted;
  $scope.pcrToHuman = tpm.pcrToHuman;
  $scope.auditNode = tpm.auditNode;

  $scope.layers = {};
  $scope.dropdownItems = [];
  _.each(tpm.LAYERS, (value, key) => {
    $scope.layers[key] = key;
    $scope.dropdownItems.push([key, key]);
  });

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
      let managerOfTaint, tpmManager;
      if (state.loadError) {
        $scope.canAdmission = true;
        $scope.dtcError = state.loadError;
        return;
      }
      $scope.dtcError = null;
      _.each(state.configmaps, cm => {
        switch (cm.metadata.name) {
          case 'taint.coreos.com':
            managerOfTaint = $scope.managerOfTaint = cm;
            break;
          case 'tpm-manager.coreos.com':
            tpmManager = $scope.tpmManager = cm;
            break;
        }
      });

      let dtcState = 'Open Admission';
      let substate = 'All nodes will be scheduled for work.';
      if (managerOfTaint) {
        if (managerOfTaint.data.taint === 'true') {
          dtcState = 'Trusted Computing';
          substate = 'Nodes will be validated against DTC policies.';
          if (tpmManager && tpmManager.data.allowunknown === 'false') {
            dtcState = 'Strict Trusted Computing';
            substate = 'Nodes will be validated against DTC policies and must have known TPMs.';
          }
        }
      }
      $scope.dtcState = dtcState;
      $scope.substate = substate;

      $scope.canAdmission = !!($scope.managerOfTaint && $scope.tpmManager);
    });

  $scope.dtcModal = () => {
    ModalLauncherSvc.open('dtc-settings');
  };
});

