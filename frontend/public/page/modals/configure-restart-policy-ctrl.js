angular.module('app')
.controller('ConfigureRestartPolicyCtrl', function($scope, $modalInstance, k8s, pod) {
  'use strict';

  $scope.policies = k8s.enum.RestartPolicy;

  $scope.fields = {
    policy: pod.spec.restartPolicy,
  };

  $scope.save = function() {
    pod.spec.restartPolicy = $scope.fields.policy;
    $modalInstance.close(pod);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureRestartPolicyFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
