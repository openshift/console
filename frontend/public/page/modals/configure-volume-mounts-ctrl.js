angular.module('app')
.controller('ConfigureVolumeMountsCtrl', function(_, $scope, $rootScope,
      $controller, $modalInstance, volumes, container, arraySvc, k8s) {
  'use strict';

  $scope.volumes = volumes;

  $scope.rowMgr = $controller('RowMgr', {
    $scope: $rootScope.$new(),
    emptyCheck: function(v) {
      return _.isEmpty(v.name) || _.isEmpty(v.mountPath);
    },
    getEmptyItem: k8s.docker.getEmptyVolumeMount,
  });

  $scope.initVolumeMounts = function(volumeMounts) {
    if (_.isEmpty(volumeMounts)) {
      $scope.rowMgr.setItems([]);
    } else {
      $scope.rowMgr.setItems(angular.copy(volumeMounts));
    }
  };

  $scope.formatReadOnly = function(vm) {
    if (vm.readOnly === 'true') {
      vm.readOnly = true;
    } else {
      vm.readOnly = false;
    }
  };

  $scope.getDropdownLabel = function(volume) {
    return volume.name + ' (' + (volume.source.hostPath.path || 'empty') + ')';
  };

  $scope.save = function() {
    container.volumeMounts = $scope.rowMgr.getNonEmptyItems();
    $modalInstance.close(container);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

  $scope.initVolumeMounts(container.volumeMounts);
})
.controller('ConfigureVolumeMountsFormCtrl', function($scope) {
  $scope.submit = $scope.save;
});
