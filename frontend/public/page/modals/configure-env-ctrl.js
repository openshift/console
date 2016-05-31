angular.module('bridge.page')
.controller('ConfigureEnvCtrl', function(_, $scope, $uibModalInstance, $controller,
      $rootScope, container, k8s) {
  'use strict';

  $scope.rowMgr = $controller('RowMgr', {
    $scope: $rootScope.$new(),
    emptyCheck: k8s.docker.isEnvVarEmpty,
    getEmptyItem: k8s.docker.getEmptyEnvVar,
  });

  $scope.initEnvVars = function(envVars) {
    $scope.rowMgr.min = 1;

    if (_.isEmpty(envVars)) {
      $scope.rowMgr.setItems([]);
    } else {
      $scope.rowMgr.setItems(angular.copy(envVars));
    }
  };

  $scope.save = function() {
    container.env = $scope.rowMgr.getNonEmptyItems();
    $uibModalInstance.close(container);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.initEnvVars(container.env);
})
.controller('ConfigureEnvFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
