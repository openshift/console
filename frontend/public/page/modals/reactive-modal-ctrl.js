angular.module('bridge.page')
.controller('ReactiveModalCtrl', function(_, $scope, $uibModalInstance, name, props) {
  'use strict';

  $scope.name = name;

  const dismiss = (reason) => $uibModalInstance.dismiss(reason);
  const cancel = () => dismiss('cancel');
  const close = (result) => $uibModalInstance.close(result);

  $scope.props = Object.assign({dismiss, cancel, close}, props);
});
