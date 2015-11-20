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

      $scope.selectNamespace = function(e) {
        var newNamespace,
            resource = namespacesSvc.namespaceResourceFromPath($location.path());

        if (e) {
          newNamespace = e.target.textContent;
        }

        // Redirect to the resource and let the router
        // logic handle putting us in the correct namespace
        // as opposed to re-implementing logic here.
        namespacesSvc.setActiveNamespace(newNamespace);
        $location.path('/' + resource);
      };

      $scope.clearNamespace = function() {
        namespacesSvc.clearActiveNamespace();

        // TODO this is what breaks
        $location.path(namespacesSvc.namespaceResourceFromPath($location.path()));
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
