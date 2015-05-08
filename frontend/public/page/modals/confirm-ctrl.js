angular.module('bridge.page')
.controller('ModalConfirmCtrl', function($scope, $modalInstance,
      executeFn, title, message, btnText) {
  'use strict';

  $scope.title = title;
  $scope.message = message;
  $scope.btnText = btnText || 'Confirm';

  $scope.execute = function() {
    $scope.requestPromise = executeFn(null, {
        supressNotifications: true
      })
      .success($modalInstance.close);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

});
