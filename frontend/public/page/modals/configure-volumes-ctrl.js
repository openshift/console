angular.module('app')
.controller('ConfigureVolumesCtrl', function(_, $scope, $modalInstance, $controller,
      pod, arraySvc, PodsSvc, $rootScope) {
  'use strict';

  $scope.rowMgr = $controller('RowMgr', {
    $scope: $rootScope.$new(),
    emptyCheck: function(v) {
      return (_.isEmpty(v.source.hostDir) || _.isEmpty(v.source.hostDir.path)) &&
          _.isEmpty(v.name);
    },
    getEmptyItem: function() {
      var v = PodsSvc.getEmptyVolume();
      // Just a placeholder for the form with default value.
      v.type = 'host';
      return v;
    },
  });

  $scope.initializeVolumes = function(volumes) {
    if (_.isEmpty(volumes)) {
      $scope.volumes = [];
    } else {
      $scope.volumes = _.forEach(angular.copy(volumes), function(v) {
        v.type = v.source.emptyDir ? 'container' : 'host';
      });
    }
    $scope.rowMgr.setItems($scope.volumes);
  };

  $scope.save = function() {
    _.each($scope.volumes, function(v) {
      v.source.emptyDir = v.type === 'container' ? true : false;
      delete v.type;
      if (v.source.emptyDir) {
        delete v.source.hostDir.path;
      } else {
        delete v.source.emptyDir;
      }
    });
    pod.desiredState.manifest.volumes = $scope.rowMgr.getNonEmptyItems();
    $modalInstance.close(pod);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

  $scope.onTypeChange = function(v) {
    if (v.type === 'container') {
      v.source.hostDir.path = null;
    }
  };

  $scope.initializeVolumes(pod.desiredState.manifest.volumes);
})
.controller('ConfigureVolumesFormCtrl', function($scope) {
  $scope.submit = $scope.save;
});
