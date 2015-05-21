angular.module('bridge.page')
.controller('ConfigureReplicaCountCtrl', function($scope, $modalInstance, k8s, replicationController) {
  'use strict';

  var kind = k8s.enum.Kind.REPLICATIONCONTROLLER;

  $scope.fields = {
    replicas: replicationController.spec.replicas,
  };

  $scope.save = function() {
    var patch = [{ op: 'replace', path: '/spec/replicas', value: $scope.fields.replicas }];
    $scope.requestPromise = k8s.resource.patch(kind, replicationController, patch);
    $scope.requestPromise.then(function(result) {
      $modalInstance.close(result);
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
