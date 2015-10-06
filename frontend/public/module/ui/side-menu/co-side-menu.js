/**
 * @fileoverview
 * Displays a side navigation list.
 */

angular.module('bridge.ui')
.directive('coSideMenu', function($, sideMenuVisibility, authSvc, featuresSvc, dex) {
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

      $scope.logout = function(e) {
        if (!$scope.isAuthDisabled) {
          authSvc.logout();
        }
        e.preventDefault();
      };
    },
    link: function(scope, elem, attrs, ctrl) {
      dex.users.list({maxResults: 1})
      .then(function() {
        scope.usersAreManageable = true;
      });
      scope.isAuthDisabled = featuresSvc.isAuthDisabled;
      $('body').click(ctrl.hide);
    },
  };

});
