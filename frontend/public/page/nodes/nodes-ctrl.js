angular.module('bridge.page')
.controller('NodesCtrl', function ($scope, ModalLauncherSvc) {
  'use strict';

  $scope.dtcModal = () => {
    ModalLauncherSvc.open('dtc-settings');
  };
});
