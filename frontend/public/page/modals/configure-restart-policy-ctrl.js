angular.module('app')
.controller('ConfigureRestartPolicyCtrl', function($scope, $modalInstance, k8s, pod) {
  'use strict';

  $scope.policies = k8s.enum.RestartPolicy;

  $scope.fields = {
    policy: k8s.pods.getRestartPolicyByValue(pod.spec.restartPolicy).id,
  };

  $scope.save = function() {
    pod.spec.restartPolicy = k8s.pods.getRestartPolicyById($scope.fields.policy).value;
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
