angular.module('app')
.controller('ConfigurePrimaryCommandCtrl', function($scope, $modalInstance, k8s, _, container) {
  'use strict';

  $scope.fields = {
    commandType: 'default',
    command: '',
  };

  if (!_.isEmpty(container.command)) {
    $scope.fields.commandType = 'custom';
    $scope.fields.command = container.command.join(' ');
  }

  $scope.save = function() {
    if ($scope.fields.commandType === 'default') {
      container.command = null;
    } else {
      container.command = $scope.fields.command.split(' ');
    }
    $modalInstance.close(container);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigurePrimaryCommandFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
