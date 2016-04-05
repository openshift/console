angular.module('bridge.page')
.controller('NewPodCtrl', function(_, $scope, $location, $routeParams, k8s, ModalLauncherSvc, activeNamespaceSvc) {
  'use strict';

  var namespace = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.pod = k8s.pods.getEmpty(namespace);

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.pod,
    });
  };

  $scope.openRestartPolicyModal = function() {
    ModalLauncherSvc.open('configure-restart-policy', {
      pod: $scope.pod,
    });
  };

  $scope.getRestartPolicyLabel = k8s.pods.getRestartPolicyLabelById;

  $scope.cancel = function() {
    $location.path(activeNamespaceSvc.formatNamespaceRoute('/pods'));
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.pods.create($scope.pod);
    $scope.requestPromise.then(function() {
      $location.path(activeNamespaceSvc.formatNamespaceRoute('/pods'));
    });
  };

})

.controller('NewPodFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
