'use strict';

angular.module('bridge.ui')
.directive('coTpcList', function (k8sCache) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/tpc-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      layerfilter: '=',
    },
    controller: function($scope, tpm) {
      let policies = [];
      $scope.loadError = false;

      const policyFilter = (policies) => {
        policies = policies || [];
        const bounds = tpm.LAYERS[$scope.layerfilter];

        return policies.filter(policy => {
          if (!policy.policy) {
            return;
          }
          return  !!_.find(policy.policy, (ignore, pcrNum) => {
            pcrNum = parseInt(pcrNum, 10);
            return pcrNum >= bounds[0] && pcrNum <= bounds[1];
          });
        })
        .map(policy => {
          policy.labels = tpm.policyToLayer(policy);
          return policy;
        })
        .sort((a, b) => {
          if (a.metadata.name > b.metadata.name) {
            return 1;
          }
          return -1;
        });
      }

      k8sCache.subscribeToPolicies($scope,
        newPolicies => {
          policies = newPolicies;
          $scope.filteredPolicies = policyFilter(newPolicies);
          $scope.loadError = false;
        },
        () => $scope.loadError = true
      );
      $scope.$watch('layerfilter', () => {
        $scope.filteredPolicies = policyFilter(policies);
      });

    }
  };

});
