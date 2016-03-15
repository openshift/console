angular.module('bridge.page')
.controller('NamespacesCtrl', function($scope, k8s, ModalLauncherSvc) {
  $scope.newNamespaceModal = function() {
    ModalLauncherSvc.open('new-namespace');
  };
});
