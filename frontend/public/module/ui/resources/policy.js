/**
 * @fileoverview
 * List out pods in a table-like view.
 */

const POLICY_TYPES = {
  binaryvalues: 'Binary',
  asciivalues: 'ASCII',
  rawvalues: 'Raw',
};

angular.module('bridge.ui')
.directive('coPolicy', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/policy.html',
    restrict: 'E',
    replace: true,
    scope: {
      name: '=',
    },
    controller: function(_, $scope, $attrs, $routeParams, tpm, k8s) {
      $scope.values = [];
      $scope.pcrToHuman = tpm.pcrToHuman;

      $scope.name = $routeParams.name;
      $scope.policy = null;
      $scope.loadError = false;

      k8s.policies.get($scope.name, 'default')
        .then(function(policy) {
          $scope.policy = policy;
          $scope.loadError = false;
          const values = [];
          const policies = policy && policy.policy;
          _.each(policies, function (pcr, pcrNum) {
            _.each(POLICY_TYPES, (name, type) => {
              const policyValues = (pcr[type] || [{}])[0];
              let prefix = policyValues.prefix;
              _.each(policyValues.values, (value) => {
                value.prefix = prefix;
                value.pcrNum = pcrNum;
                value.type = name;
                values.push(value);
              });
            });
          });
          $scope.values = values;

        })
        .catch(function() {
          $scope.policy = null;
          $scope.loadError = true;
        });
    }
  };
});
