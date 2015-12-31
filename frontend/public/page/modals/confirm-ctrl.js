angular.module('bridge.page')
.controller('ModalConfirmCtrl', function($scope, $uibModalInstance,
      executeFn, title, message, btnText) {
  'use strict';

  $scope.title = title;
  $scope.message = message;
  $scope.btnText = btnText || 'Confirm';

  $scope.execute = function() {
    $scope.requestPromise = executeFn(null, {
        supressNotifications: true
      })
      .success($uibModalInstance.close);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

});
