'use strict';

angular.module('bridge.page')
.controller('TPMCtrl', function(_, $scope, $routeParams, k8s, tpm, firehydrant, CONST) {

  const INVALID_POLICY =  $scope.INVALID_POLICY = CONST.INVALID_POLICY;
  $scope.isTrusted = k8s.nodes.isTrusted;
  $scope.pcrToHuman = tpm.pcrToHuman;

  firehydrant.subscribeToNodes($scope,
    nodes => {
      $scope.nodes = nodes;
      $scope.loadNodeError = false;
    }, () => {
      $scope.loadNodeError = true
    }
  );

  firehydrant.subscribeToPolicies($scope,
    policies => {
      $scope.policies = policies;
      $scope.loadPolicyError = false;
    }, () => {
      $scope.loadPolicyError = true
    }
  );

  $scope.auditNode = (node) => {
    const annotations = node.metadata.annotations && node.metadata.annotations['tpm.coreos.com/logstate'];
    if (!annotations) {
      return {};
    }
    const logstate = JSON.parse(annotations);

    const init = {};
    _.each(new Array(10), (v, k) => {
      init[k] = [];
    });

    const pcrToPolicy = logstate.reduce((acculator, log) => {
      const pcr = log.Pcr;
      acculator[pcr] = acculator[pcr] || [];
      let source = log.Source;
      if (source === '') {
        source = INVALID_POLICY;
      }
      acculator[pcr].push(source)
      return acculator;
    }, init);

    const policyList = {};
    _.each(pcrToPolicy, (policies, pcr) => {
      // CoreOS only uses PCRs 0-9 ...
      if (pcr > 9) {
        return;
      }

      let invalid = false;

      policies = _.uniq(policies).sort();
      if (policies.indexOf(INVALID_POLICY) >= 0) {
        policies = [INVALID_POLICY];
        invalid = true;
      }

      policyList[pcr] = {
        policies,
        invalid,
      };
    });

    return policyList;
  }
})
