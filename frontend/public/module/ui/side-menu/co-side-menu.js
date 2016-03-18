/**
 * @fileoverview
 * Displays a side navigation list.
 */

angular.module('bridge.ui')
.directive('coSideMenu', function($, $location, authSvc, dex, errorMessageSvc,
                                  featuresSvc, k8s, namespacesSvc, sideMenuVisibility) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/side-menu/co-side-menu.html',
    restrict: 'E',
    replace: true,
    controller: function($scope) {
      this.hide = sideMenuVisibility.hideSideMenu;
      $scope.$watch(sideMenuVisibility.getShowSideMenu, function(show) {
        $scope.showSideMenu = show;
        if (show) {
          k8s.namespaces.list()
          .then(function(namespaces) {
            $scope.namespaces = namespaces;
          })
          .catch(function() {
            $scope.namespaceListError = true;
          });
        }
      });

      $scope.logout = function(e) {
        if (!$scope.isAuthDisabled) {
          authSvc.logout();
        }
        e.preventDefault();
      };

      $scope.selectNamespace = function(newNamespace) {
        var oldPath = $location.path();

        if (newNamespace) {
          namespacesSvc.setActiveNamespace(newNamespace);
        } else {
          namespacesSvc.clearActiveNamespace();
        }

        if (namespacesSvc.isNamespaced(oldPath)) {
          $location.path(namespacesSvc.formatNamespaceRoute(oldPath));
        }
      };

      $scope.activeNamespaceClass = function(namespace) {
        if (namespace === namespacesSvc.getActiveNamespace()) {
          return 'co-namespace-icon__selected fa fa-check-circle';
        }
        return 'co-namespace-icon__unselected fa fa-circle-thin';
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
