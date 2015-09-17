/**
 * @fileoverview
 * List out namespaces in a list view.
 */

angular.module('bridge.ui')
.directive('coNamespaceList', function(k8s, $location) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/namespace-list.html',
    restrict: 'E',
    replace: true,
    controller: function($scope) {
      k8s.namespaces.list()
      .then(function(namespaces) {
        $scope.namespaces = namespaces;
      })
      .catch(function() {
        $scope.namespaceListError = true;
      });

      $scope.selectNamespace = function(e) {
        var newNamespace,
            resource = k8s.namespaces.namespaceResourceFromPath($location.path());

        if (e) {
          newNamespace = e.target.textContent;
        }

        // Redirect to the resource and let the router
        // logic handle putting us in the correct namespace
        // as opposed to re-implementing logic here.
        k8s.namespaces.setActiveNamespace(newNamespace);
        $location.path('/' + resource);
      };

      $scope.clearNamespace = function() {
        k8s.namespaces.clearActiveNamespace();
        $location.path(k8s.namespaces.namespaceResourceFromPath($location.path()));
      };

      $scope.activeNamespaceClass = function(namespace) {
        if (namespace === k8s.namespaces.getActiveNamespace()) {
          return 'co-namespace-icon__selected fa fa-check-circle';
        }
        return 'co-namespace-icon__unselected fa fa-circle-thin';
      };
    },
  };

});
