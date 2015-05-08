angular.module('bridge.page')
.controller('ConfigureReplicaCountCtrl', function($scope, $modalInstance, k8s, replicationController) {
  'use strict';

  $scope.rc = angular.copy(replicationController);

  $scope.save = function() {
    $scope.requestPromise = k8s.resource.update(k8s.enum.Kind.REPLICATIONCONTROLLER, $scope.rc);
    $scope.requestPromise.then(function(updatedRC) {
      $modalInstance.close(updatedRC);
    });
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureReplicaCountFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
