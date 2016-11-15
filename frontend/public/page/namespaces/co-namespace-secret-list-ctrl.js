angular.module('bridge.ui')
  .controller('coNamespaceSecretListCtrl', function coNamespaceSecretListCtrl(
    $scope,
    k8s,
    ModalLauncherSvc
  ) {
    const load = () => {
      $scope.loading = true;
      $scope.pullSecretLoaded = k8s.secrets.get(`?fieldSelector=${encodeURIComponent('type=kubernetes.io/dockerconfigjson')}`, _.get($scope, 'namespace.metadata.name'))
        .catch(function (error) {
          $scope.loading = false;
          // no pull secrets exist, we're in create mode
          if (error.status === 404) {
            return;
          }

          throw error;
        })
        .then(function (pullSecrets) {
          $scope.loading = false;
          $scope.pullSecret = _.get(pullSecrets, 'items[0]');
        });
    };

    function editPullSecret() {
      ModalLauncherSvc.open('namespace-pull-secret', {
        namespace: $scope.namespace,
        pullSecret: $scope.pullSecret
      }).result.then(load);
    }

    // ---

    $scope.loading = true;
    $scope.editPullSecret = editPullSecret;

    $scope.$watch('namespace', load);
  })
;
