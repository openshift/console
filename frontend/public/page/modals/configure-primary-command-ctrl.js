angular.module('bridge.page')
.controller('ConfigurePrimaryCommandCtrl', function($scope, $uibModalInstance, _, container, k8s) {
  'use strict';

  $scope.fields = {
    commandType: 'default',
    command: '',
  };

  if (!_.isEmpty(container.command)) {
    $scope.fields.commandType = 'custom';
    $scope.fields.command = k8s.command.fromArgs(container.command);
  }

  $scope.save = function() {
    if ($scope.fields.commandType === 'default') {
      container.command = null;
    } else {
      container.command = k8s.command.toArgs($scope.fields.command);
    }
    $uibModalInstance.close(container);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('ConfigurePrimaryCommandFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
