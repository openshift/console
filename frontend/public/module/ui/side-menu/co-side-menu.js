/**
 * @fileoverview
 * Displays a side navigation list.
 */

angular.module('bridge.ui')
.directive('coSideMenu', function($, sideMenuVisibility, featuresSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/side-menu/co-side-menu.html',
    restrict: 'E',
    replace: true,
    controller: function($scope) {
      this.hide = sideMenuVisibility.hideSideMenu;
      $scope.$watch(sideMenuVisibility.getShowSideMenu, function(show) {
        $scope.showSideMenu = show;
      });
    },
    link: function(scope, elem, attrs, ctrl) {
      scope.isAuthDisabled = featuresSvc.isAuthDisabled;
      scope.isUserManagementDisabled = featuresSvc.isUserManagementDisabled;
      $('body').click(ctrl.hide);
    },
  };

});
