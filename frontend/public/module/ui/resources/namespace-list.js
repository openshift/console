angular.module('bridge.ui')
.directive('coNamespaceList', function(k8s, resourceMgrSvc) {
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

      function loadNamespaces() {
        var query = {};
        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.namespaces = [];
          return;
        }

        if (!_.isEmpty($scope.selector)) {
          query.labelSelector = $scope.selector;
        }

        k8s.namespaces.list(query)
        .then(function(namespaces) {
          $scope.namespaces = namespaces;
        });
      }

      $scope.$on(k8s.events.NAMESPACE_DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.namespaces, data.resource);
      });

      $scope.$on(k8s.events.NAMESPACE_ADDED, loadNamespaces);

      $scope.$on(k8s.events.NAMESPACE_MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.namespaces, data.resource);
      });

      loadNamespaces();
    },
  };
});
