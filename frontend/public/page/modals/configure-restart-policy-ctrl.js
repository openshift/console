angular.module('bridge.page')
.controller('ConfigureRestartPolicyCtrl', function($scope, $uibModalInstance, k8s, pod) {
  'use strict';

  $scope.policies = k8s.enum.RestartPolicy;

  $scope.fields = {
    policy: pod.spec.restartPolicy,
  };

  $scope.save = function() {
    pod.spec.restartPolicy = $scope.fields.policy;
    $uibModalInstance.close(pod);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

})
.controller('ConfigureRestartPolicyFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
