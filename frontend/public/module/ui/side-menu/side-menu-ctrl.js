angular.module('bridge.ui')
.controller('SideMenuCtrl', function($scope, sideMenu) {
  'use strict';

  $scope.sideMenuToggle = function(e) {
    e.preventDefault();
    e.stopPropagation();
    sideMenu.toggleSideMenu();
  };
});
