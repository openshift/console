angular.module('bridge.ui')
  .controller('coNamespaceSecretListCtrl', function coNamespaceSecretListCtrl(
    $scope,
    k8s,
    ModalLauncherSvc
  ) {
    $scope.loading = true;
    $scope.editPullSecret = editPullSecret;

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

    $scope.$watch('namespace', load);

    // ---

    function editPullSecret() {
      ModalLauncherSvc.open('namespace-pull-secret', {
        namespace: $scope.namespace,
        pullSecret: $scope.pullSecret
      }).result.then(load);
    }
  })
;
