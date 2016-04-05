/**
 * @fileoverview
 * Displays a side navigation list.
 */

angular.module('bridge.ui')
.directive('coSideMenu', function($, $window,  activeNamespaceSvc, authSvc, dex,
                                  errorMessageSvc, featuresSvc, ModalLauncherSvc,
                                  namespaceCacheSvc, sideMenuVisibility) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/side-menu/co-side-menu.html',
    restrict: 'E',
    replace: true,
    controller: function($scope) {
      this.hide = sideMenuVisibility.hideSideMenu;
      $scope.namespaceCacheSvc = namespaceCacheSvc;

      $scope.$watch(sideMenuVisibility.getShowSideMenu, function(show) {
        $scope.showSideMenu = show;
      });

      $scope.logout = function(e) {
        if (!$scope.isAuthDisabled) {
          authSvc.logout();
        }
        e.preventDefault();
      };

      // TODO the whole point of this exercise
      $scope.setActiveNamespace = _.bind(activeNamespaceSvc.setActiveNamespace, activeNamespaceSvc);
      $scope.createNamespace = function() {
        ModalLauncherSvc.open('new-namespace');
      };

      $scope.activeNamespaceClass = function(namespace) {
        var active = activeNamespaceSvc.getActiveNamespace();
        if (active && namespace === active.metadata.name) {
          return 'co-namespace-icon__selected fa fa-check-circle';
        }
        return 'co-namespace-icon__unselected fa fa-circle-thin';
      };

      $scope.namespaceLink = function(namespaceName) {
        return '/namespaces?name=' + $window.encodeURIComponent(namespaceName);
      }
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
      $('body').click(function(evt) {
        if (evt.target.closest('.modal-dialog') ||
            evt.target.closest('.keep-sidebar-open')) {
          // Slight hack to keep the sidebar open if you're messing with
          // either modals or calling them up. Do nothing.
        } else {
          ctrl.hide();
        }
      });
    },
  };

});
