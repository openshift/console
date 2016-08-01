angular.module('bridge.ui')
.directive('coCreatePolicy', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/create-policy.html',
    restrict: 'E',
    replace: true,
    controller: function($scope, $location, k8s) {
      $scope.update = (form) => {
        const obj = {
          kind: 'Policy',
          apiVersion: 'tpm.coreos.com/v1',
          metadata: {
            name: form.name,
            namespace: 'default',
          },
          policy: $scope.policy_,
        };
        $scope.requestPromise = k8s.policies.create(obj).then(() => $location.path('/trusted-compute-policies'));
      };
    },
  };
});
