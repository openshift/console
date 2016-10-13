import {util} from '../../module/k8s/util';

angular.module('bridge.page')
.controller('ConfigureVolumesCtrl', function(_, $scope, $uibModalInstance, $controller,
      pod, arraySvc, k8s, $rootScope) {
  'use strict';

  $scope.rowMgr = $controller('RowMgr', {
    $scope: $rootScope.$new(),
    emptyCheck: function(v) {
      if (_.isEmpty(v.name)) {
        return true;
      }
      return v.type === 'host' && (_.isEmpty(v.hostPath) || _.isEmpty(v.hostPath.path));
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
        v.type = v.emptyDir ? 'container' : 'host';
      });
      $scope.rowMgr.setItems(items);
    }
  };

  $scope.save = function() {
    var items = _.map($scope.rowMgr.getNonEmptyItems(), function(v) {
      if (v.type === 'container') {
        v.emptyDir = { medium: '' };
        delete v.hostPath;
      } else {
        delete v.emptyDir;
      }
      delete v.type;
      util.deleteNulls(v);
      return v;
    });
    pod.spec.volumes = items;
    $uibModalInstance.close(pod);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.onTypeChange = function(v) {
    if (v.type === 'container' && _.has(v, 'hostPath.path')) {
      v.hostPath.path = null;
    }
  };

  $scope.initializeVolumes(pod.spec.volumes);
})
.controller('ConfigureVolumesFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
