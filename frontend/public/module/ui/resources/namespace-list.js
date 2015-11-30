/**
 * @fileoverview
 * List out namespaces in a list view.
 */

angular.module('bridge.ui')
.directive('coNamespaceList', function(k8s, $location, namespacesSvc, sideMenuVisibility) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/namespace-list.html',
    restrict: 'E',
    replace: true,
    controller: function($scope) {
      $scope.$watch(sideMenuVisibility.getShowSideMenu, function(show) {
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
  };

});
