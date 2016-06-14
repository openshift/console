/**
 * @fileoverview
 * List deployments in a table-like view.
 */

angular.module('bridge.ui')
.directive('coDeploymentList', function(k8s, _, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/deployment-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
      search: '=',
      selector: '=',
      load: '=',
    },
    controller: function($scope, $attrs) {
      $scope.deployments = null;
      $scope.loadError = false;

      function loadDeployments() {
        var query = {};
        if (!$scope.load) {
          return;
        }

        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.deployments = [];
          return;
        }

        if (!_.isEmpty($scope.selector)) {
          query.labelSelector = $scope.selector;
        }

        if ($scope.namespace) {
          query.ns = $scope.namespace;
        }

        k8s.deployments.list(query)
          .then(function(deployments) {
            $scope.deployments = deployments;
            $scope.loadError = false;
          })
          .catch(function() {
            $scope.deployments = null;
            $scope.loadError = true;
          });
      }

      $scope.$watch('load', loadDeployments);

      const events = k8s.events.deployments;
      $scope.$on(events.DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.deployments, data.resource);
      });

      $scope.$on(events.ADDED, loadDeployments);

      $scope.$on(events.MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.deployments, data.resource);
      });
    }
  };
});
