angular.module('bridge.ui')
.controller('SideMenuCtrl', function($scope, sideMenuVisibility) {
  'use strict';

  $scope.sideMenuToggle = function(e) {
    e.preventDefault();
    e.stopPropagation();
    sideMenuVisibility.toggleSideMenu();
  };
});
