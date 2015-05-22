angular.module('bridge.page')
.controller('ServicePortsCtrl', function(_, $scope, $rootScope, $controller,
      $modalInstance, k8s, kind, resource) {
  'use strict';

  var portObj;
  $scope.fields = {};
  if (resource.spec.ports && resource.spec.ports.length) {
    // TODO: add support for multiple ports pairs
    portObj = resource.spec.ports[0];
    $scope.fields.port = portObj.port;
    $scope.fields.targetPort = portObj.targetPort;
  }

  $scope.save = function() {
    var ports, patch;
    ports = [{
      port: $scope.fields.port,
      targetPort: $scope.fields.targetPort,
      // TODO: add support for protocol
      protocol: 'TCP',
    }];
    patch = [{ op: 'replace', path: '/spec/ports', value: ports }];
    $scope.requestPromise = k8s.resource.patch(kind, resource, patch);
    $scope.requestPromise.then(function(result) {
      $modalInstance.close(result);
    });
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ServicePortsFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
