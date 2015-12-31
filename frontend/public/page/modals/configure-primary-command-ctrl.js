angular.module('bridge.page')
.controller('ConfigurePrimaryCommandCtrl', function($scope, $uibModalInstance, _, container) {
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
