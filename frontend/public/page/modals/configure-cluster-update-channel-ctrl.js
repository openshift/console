angular.module('bridge.page')
.controller('ConfigureClusterUpdateChannelCtrl', ($scope, $uibModalInstance, _, k8s, config, callbacks) => {
  'use strict';

  $scope.fields = {
    channel: angular.copy(config.channel)
  };

  $scope.save = () => {
    callbacks.invalidateState(true);
    const patch = [{ op: 'replace', path: '/channel', value: $scope.fields.channel }];
    $scope.requestPromise = k8s.resource.patch(k8s.enum.Kind.TCO_CONFIG, config, patch);
    $scope.requestPromise.then((result) => {
      $uibModalInstance.close(result);
    }).catch(() => {
      callbacks.invalidateState(false);
    });
  };

  $scope.cancel = () => {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('ConfigureClusterUpdateChannelFormCtrl', ($scope) => {
  'use strict';
  $scope.submit = $scope.save;
});
