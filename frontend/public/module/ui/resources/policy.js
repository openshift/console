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
    controller: function(_, $scope, $attrs, $routeParams, tpm, k8s, Firehose) {
      $scope.values = [];
      $scope.pcrToHuman = tpm.pcrToHuman;


      function loadPolicy () {
        const values = [];
        $scope.policy = _.find($scope.policies, (p) => {
          return p.metadata.name === $routeParams.name;
        });
        if (!$scope.policy) {
          $scope.loadError = true;
          return;
        }

        const policies = $scope.policy && $scope.policy.policy;
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
      }

      $scope.loadError = false;

      new Firehose(k8s.policies)
        .watchList()
        .bindScope($scope, null, state => {
          $scope.policies = state.policies;
          $scope.loadError = state.loadError;
          loadPolicy();
        });
    }
  };
});
