angular.module('app')
.controller('ConfigureVolumesCtrl', function(_, $scope, $modalInstance, $controller,
      pod, arraySvc, k8s, $rootScope) {
  'use strict';

  $scope.rowMgr = $controller('RowMgr', {
    $scope: $rootScope.$new(),
    emptyCheck: function(v) {
      return (_.isEmpty(v.source.hostPath) || _.isEmpty(v.source.hostPath.path)) &&
          _.isEmpty(v.name);
    },
    getEmptyItem: function() {
      var v = k8s.pods.getEmptyVolume();
      // Just a placeholder for the form with default value.
      v.type = 'host';
      return v;
    },
  });

  $scope.initializeVolumes = function(volumes) {
    var items;
    if (_.isEmpty(volumes)) {
      $scope.rowMgr.setItems([]);
    } else {
      items = _.forEach(angular.copy(volumes), function(v) {
        v.type = v.source.emptyDir ? 'container' : 'host';
      });
      $scope.rowMgr.setItems(items);
    }
  };

  $scope.save = function() {
    var items = _.map($scope.rowMgr.getNonEmptyItems(), function(v) {
      v.source.emptyDir = v.type === 'container' ? true : false;
      delete v.type;
      if (v.source.emptyDir) {
        delete v.source.hostPath;
      } else {
        delete v.source.emptyDir;
      }
      return v;
    });
    pod.spec.volumes = items;
    $modalInstance.close(pod);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

  $scope.onTypeChange = function(v) {
    if (v.type === 'container') {
      v.source.hostPath.path = null;
    }
  };

  $scope.initializeVolumes(pod.spec.volumes);
})
.controller('ConfigureVolumesFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
