angular.module('bridge.page')
.controller('ReactiveModalCtrl', function(_, $scope, $uibModalInstance, name, props) {
  'use strict';

  $scope.name = name;
  const close = () => $uibModalInstance.dismiss('cancel');
  $scope.props = Object.assign({}, {close}, props);
});
