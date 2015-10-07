/**
 * @fileoverview
 * Displays a side navigation list.
 */

angular.module('bridge.ui')
.directive('coSideMenu', function($, sideMenuVisibility, authSvc, featuresSvc, errorMessageSvc, dex) {
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
      dex.users.available()
      .then(function(isAvailable) {
        scope.usersAreManageable = isAvailable;
      })
      .catch(function(resp) {
        scope.userManagementError = true;
        if (resp && resp.data && resp.data.error_description) {
          scope.userManagementErrorMessage = resp.data.error_description;
        } else {
          scope.userManagementErrorMessage = 'user management features are unavailable due to an error';
        }
      });
      scope.isAuthDisabled = featuresSvc.isAuthDisabled;
      $('body').click(ctrl.hide);
    },
  };

});
