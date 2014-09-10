angular.module('app')
.controller('ConfigureVolumeMountsCtrl', function(_, $scope, $modalInstance,
      volumes, volumeMounts, arraySvc) {
  'use strict';

  $scope.volumes = volumes;

  function getEmptyVolumeMount() {
    return {
      name: null,
      mountPath: null,
      readOnly: false,
    };
  }

  if (_.isEmpty(volumeMounts)) {
    $scope.volumeMounts = [getEmptyVolumeMount()];
  } else {
    $scope.volumeMounts = angular.copy(volumeMounts);
  }

  $scope.clearRow = function(item) {
    if ($scope.volumeMounts.length === 1) {
      $scope.volumeMounts = [getEmptyVolumeMount()];
    } else {
      arraySvc.remove($scope.volumeMounts, item);
    }
  };

  $scope.formatReadOnly = function(v) {
    if (v.readOnly === 'true') {
      v.readOnly = true;
    } else {
      v.readOnly = false;
    }
  };

  $scope.getDropdownLabel = function(volume) {
    return volume.name + ' (' + (volume.source.hostDir.path || 'empty') + ')';
  };

  $scope.save = function() {
    $modalInstance.close($scope.volumeMounts);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureVolumeMountsFormCtrl', function($scope) {

  $scope.submit = $scope.save;

});
