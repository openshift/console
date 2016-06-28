angular.module('bridge.ui')
  .controller('coNamespaceSecretListCtrl', function coNamespaceSecretListCtrl(
    $scope,
    ModalLauncherSvc
  ) {
    $scope.editQuayPullSecret = editQuayPullSecret;

    // ---

    function editQuayPullSecret() {
      ModalLauncherSvc.open('namespace-quay-pull-secret', {
        namespace: $scope.namespace
      });
    }
  })
;
