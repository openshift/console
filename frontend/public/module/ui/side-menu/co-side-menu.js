/**
 * @fileoverview
 * Displays a side navigation list.
 */

angular.module('bridge.ui')
.directive('coSideMenu', function($, $window, authSvc, dex, errorMessageSvc,
                                  featuresSvc, k8s, ModalLauncherSvc,
                                  namespacesSvc, resourceMgrSvc,
                                  sideMenuVisibility) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/side-menu/co-side-menu.html',
    restrict: 'E',
    replace: true,
    controller: function($scope) {
      this.hide = sideMenuVisibility.hideSideMenu;

      function loadNamespaces() {
        if ($scope.showSideMenu) {
          k8s.namespaces.list()
          .then(function(namespaces) {
            $scope.namespaces = namespaces;
          })
          .catch(function() {
            $scope.namespaceListError = true;
          });
        }
      }

      $scope.$on(k8s.events.NAMESPACE_DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.namespaces, data.resource);
      });

      $scope.$on(k8s.events.NAMESPACE_ADDED, _.debounce(loadNamespaces, 250));

      $scope.$on(k8s.events.NAMESPACE_MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.namespaces, data.resource);
      });

      $scope.$watch(sideMenuVisibility.getShowSideMenu, function(show) {
        $scope.showSideMenu = show;
        loadNamespaces();
      });

      $scope.logout = function(e) {
        if (!$scope.isAuthDisabled) {
          authSvc.logout();
        }
        e.preventDefault();
      };

      $scope.setActiveNamespace = _.bind(namespacesSvc.setActiveNamespace, namespacesSvc);
      $scope.createNamespace = function() {
        ModalLauncherSvc.open('new-namespace');
      };

      $scope.activeNamespaceClass = function(namespace) {
        if (namespace === namespacesSvc.getActiveNamespace()) {
          return 'co-namespace-icon__selected fa fa-check-circle';
        }
        return 'co-namespace-icon__unselected fa fa-circle-thin';
      };

      $scope.namespaceLink = function(namespace) {
        return '/namespaces?name=' + $window.encodeURIComponent(namespace.metadata.name);
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
