angular.module('bridge.page')
.controller('ConfigureLivenessCtrl', function($scope, $modalInstance, k8s, container) {
  'use strict';

  var placeholders = {
    exec: '/bin/my-liveness-check',
    httpGet: 'http://localhost:8080/my-liveness-check',
    tcpSocket: '8080',
  };

  $scope.actionTypes = k8s.enum.HookAction;
  $scope.fields = k8s.probe.mapLivenessProbeToFields(container.livenessProbe);
  $scope.getActionLabelById = k8s.probe.getActionLabelById;

  $scope.getPlaceholder = function(type) {
    return placeholders[type];
  };

  $scope.save = function() {
    container.livenessProbe = k8s.probe.mapFieldsToLivenessProbe($scope.fields);
    $modalInstance.close(container);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureLivenessFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
