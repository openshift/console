angular.module('bridge.page')
.controller('ConfigureVolumeMountsCtrl', function(_, $scope, $rootScope,
      $controller, $uibModalInstance, volumes, container, arraySvc, k8s) {
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
      $scope.rowMgr.setItems(angular.copy(volumeMounts).map(adjustReadOnly));
    }
  };

  $scope.getDropdownLabel = function(volume) {
    var label = volume.name,
        vType = k8s.pods.getVolumeType(volume);
    if (vType) {
      label += ' (' + vType.label + ')';
    }
    return label;
  };

  $scope.save = function() {
    container.volumeMounts = $scope.rowMgr.getNonEmptyItems();
    $uibModalInstance.close(container);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  // ng-options expects values to be of concrete types
  // so we adjust it to boolean (false or unspecified means read-write for k8s)
  function adjustReadOnly(vm) {
    vm.readOnly = !!vm.readOnly;
    return vm;
  }

  $scope.initVolumeMounts(container.volumeMounts);
})
.controller('ConfigureVolumeMountsFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
