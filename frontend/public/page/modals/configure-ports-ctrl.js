angular.module('bridge.page')
.controller('ConfigurePortsCtrl', function(_, $scope, $rootScope, $controller,
      $uibModalInstance, container, k8s) {
  'use strict';

  $scope.rowMgr = $controller('RowMgr', {
    $scope: $rootScope.$new(),
    emptyCheck: function(p) {
      return _.isNull(p.containerPort) || _.isEmpty(p.name);
    },
    getEmptyItem: k8s.docker.getEmptyPort,
  });

  $scope.initPorts = function(ports) {
    if (_.isEmpty(ports)) {
      $scope.rowMgr.setItems([]);
    } else {
      $scope.rowMgr.setItems(angular.copy(ports));
    }
  };

  $scope.save = function() {
    container.ports = $scope.rowMgr.getNonEmptyItems();
    $uibModalInstance.close(container);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.initPorts(container.ports);
})
.controller('ConfigurePortsFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
