angular.module('bridge.ui')
.directive('coNamespaceList', function(_, k8s, namespaceCacheSvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/namespace-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      search: '=',
      selector: '=',
    },
    controller: function($scope, $attrs) {
      $scope.namespaces = null;
      $scope.loadError = false;

      // We can't just use the namespaces in namespaceCacheSvc directly
      // here because we might be searching.  TODO break this up - no
      // reason to share controllers now, since *all* of the junk below
      // is for search
      function loadNamespaces() {
        var query = {};
        var expectCacheVersion = namespaceCacheSvc.cacheVersion;

        $scope.loadError = false;
        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.namespaces = [];
          return;
        }

        if (!_.isEmpty($scope.selector)) {
          query.labelSelector = $scope.selector;
        }

        if (_.isEmpty(query)) {
          $scope.namespaces = namespaceCacheSvc.namespaces;
        } else {
          k8s.namespaces.list(query)
          .then(function(namespaces) {
            // This query races with namespaceCacheSvc - that is, a user
            // could enter a search, then a namespace could be deleted,
            // and the user's search results could still contain that
            // deleted namespace. In this case, just reload.
            if (expectCacheVersion !== namespaceCacheSvc.cacheVersion) {
              loadNamespaces();
            } else {
              $scope.namespaces = namespaces;
            }
          })
          .catch(function() {
            $scope.loadError = true;
          });
        }
      }

      loadNamespaces();

      $scope.$watch(function() {
        return namespaceCacheSvc.cacheVersion;
      }, loadNamespaces);
    }
  };
});
