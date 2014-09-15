angular.module('app')
.controller('ConfigureVolumesCtrl', function(_, $scope, $modalInstance, pod,
      arraySvc) {

  'use strict';

  function getEmptyVolume() {
    return {
      name: null,
      source: {
        hostDir: {
          path: null
        },
        emptyDir: null
      }
    };
  }

  if (_.isEmpty(pod.desiredState.manifest.volumes)) {
    $scope.volumes = [getEmptyVolume()];
  } else {
    $scope.volumes = angular.copy(pod.desiredState.manifest.volumes);
  }

  $scope.onEmptyDirChange = function(v) {
    if (v.source.emptyDir) {
      v.source.hostDir.path = null;
    }
  };

  $scope.clearRow = function(item) {
    if ($scope.volumes.length === 1) {
      $scope.volumes = [getEmptyVolume()];
    } else {
      arraySvc.remove($scope.volumes, item);
    }
  };

  $scope.save = function() {
    _.each($scope.volumes, function(v) {
      if (!v.source.emptyDir) {
        delete v.source.emptyDir;
      }
    });

    pod.desiredState.manifest.volumes = $scope.volumes;
    $modalInstance.close(pod);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureVolumesFormCtrl', function($scope) {

  $scope.submit = $scope.save;

});
