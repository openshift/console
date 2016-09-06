angular.module('bridge.page')
.controller('ConfigureUpdateStrategyCtrl', function($scope, $uibModalInstance, _, deploymentSpec) {
  'use strict';

  let type;
  if (_.has(deploymentSpec, 'strategy.type')) {
    type = deploymentSpec.strategy.type;
  } else {
    type = 'RollingUpdate';
  }

  $scope.fields = {
    replicas: deploymentSpec.replicas,
    strategy: {
      type: type,
      rollingUpdate: {}
    }
  };

  if (_.get(deploymentSpec, 'strategy.rollingUpdate')) {
    $scope.fields.strategy.rollingUpdate.maxUnavailable = deploymentSpec.strategy.rollingUpdate.maxUnavailable;
    $scope.fields.strategy.rollingUpdate.maxSurge = deploymentSpec.strategy.rollingUpdate.maxSurge;
  }

  $scope.save = function() {
    deploymentSpec.strategy.type = $scope.fields.strategy.type;

    const numberOrPercent = function(value) {
      if (typeof value === 'undefined') {
        return null;
      }
      if (typeof value === 'string' && value.indexOf('%') > -1) {
        return value;
      }

      return _.toInteger(value);
    };

    if (deploymentSpec.strategy.type === 'RollingUpdate') {
      deploymentSpec.strategy.rollingUpdate = {};
      deploymentSpec.strategy.rollingUpdate.maxUnavailable = numberOrPercent($scope.fields.strategy.rollingUpdate.maxUnavailable);
      deploymentSpec.strategy.rollingUpdate.maxSurge = numberOrPercent($scope.fields.strategy.rollingUpdate.maxSurge);
    } else {
      deploymentSpec.strategy.rollingUpdate = null;
    }
    $uibModalInstance.close(deploymentSpec.strategy);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('ConfigureUpdateStrategyFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
