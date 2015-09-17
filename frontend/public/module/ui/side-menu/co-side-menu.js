/**
 * @fileoverview
 * Displays a side navigation list.
 */

angular.module('bridge.ui')
.directive('coSideMenu', function($, sideMenu) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/side-menu/co-side-menu.html',
    restrict: 'E',
    replace: true,
    controller: function($scope) {
      this.hide = sideMenu.hideSideMenu;
      $scope.$watch(sideMenu.getShowSideMenu, function(val) {
        $scope.showSideMenu = val;
      });
    },
    link: function(scope, elem, attrs, ctrl) {
      $('body').click(ctrl.hide);
    },
  };

});
