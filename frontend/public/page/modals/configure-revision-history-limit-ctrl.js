angular.module('bridge.page')
.controller('ConfigureRevisionHistoryLimitCtrl', function($scope, $uibModalInstance, _, deploymentSpec) {
  'use strict';

  $scope.fields = {
    type: 'unlimited',
    customLimit: null
  };

  if (_.isInteger(deploymentSpec.revisionHistoryLimit)) {
    $scope.fields.type = 'custom';
    $scope.fields.customLimit = deploymentSpec.revisionHistoryLimit;
  }

  $scope.save = function() {
    if ($scope.fields.type === 'unlimited') {
      deploymentSpec.revisionHistoryLimit = null;
    } else if ($scope.fields.type === 'custom') {
      deploymentSpec.revisionHistoryLimit = $scope.fields.customLimit;
    }

    $uibModalInstance.close(deploymentSpec);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('ConfigureRevisionHistoryLimitFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
