angular.module('bridge.page')
.controller('ConfigurePullPolicyCtrl', function($scope, $uibModalInstance, k8s, container) {
  'use strict';

  $scope.policies = k8s.enum.PullPolicy;

  $scope.fields = {
    policy: k8s.docker.getPullPolicyByValue(container.imagePullPolicy).id,
  };

  $scope.save = function() {
    container.imagePullPolicy = k8s.docker.getPullPolicyById($scope.fields.policy).value;
    $uibModalInstance.close(container);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

})
.controller('ConfigurePullPolicyFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
