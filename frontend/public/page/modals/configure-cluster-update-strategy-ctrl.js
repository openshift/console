angular.module('bridge.page')
.controller('ConfigureClusterUpdateStrategyCtrl', ($scope, $uibModalInstance, _, k8s, config, callbacks, updateAvailable) => {
  'use strict';

  const initialStrategy = config.automaticUpdate ? 'automatic' : 'admin-approval';
  $scope.fields = {
    strategy: initialStrategy
  };
  $scope.model = {
    strategy: initialStrategy,
    updateAvailable
  };

  $scope.save = () => {
    callbacks.invalidateState(true);
    const value = $scope.fields.strategy === 'automatic';
    const patch = [{ op: 'replace', path: '/automaticUpdate', value }];
    $scope.requestPromise = k8s.resource.patch(k8s.enum.Kind.CHANNELOPERATORCONFIG, config, patch);
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
.controller('ConfigureClusterUpdateStrategyFormCtrl', ($scope) => {
  'use strict';
  $scope.submit = $scope.save;
});
