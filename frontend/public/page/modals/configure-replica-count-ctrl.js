angular.module('bridge.page')
.controller('ConfigureReplicaCountCtrl', function($scope, $uibModalInstance, k8s, replicationController) {
  'use strict';

  var kind = k8s.enum.Kind.REPLICATIONCONTROLLER;

  $scope.fields = {
    replicas: replicationController.spec.replicas,
  };

  $scope.save = function() {
    var patch = [{ op: 'replace', path: '/spec/replicas', value: $scope.fields.replicas }];
    $scope.requestPromise = k8s.resource.patch(kind, replicationController, patch);
    $scope.requestPromise.then(function(result) {
      $uibModalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

})
.controller('ConfigureReplicaCountFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
