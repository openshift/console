/**
 * @fileoverview
 * List services in a table-like view.
 */

angular.module('bridge.ui')
.directive('coServiceList', function(k8s, _, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/service-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
      search: '=',
      selector: '=',
      load: '=',
    },
    controller: function($scope, $attrs) {
      $scope.services = null;
      $scope.loadError = false;

      function loadServices() {
        var query = {};
        if (!$scope.load) {
          return;
        }
        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.services = [];
          return;
        }
        if ($scope.selector) {
          query.labelSelector = $scope.selector;
        }
        if ($scope.namespace) {
          query.ns = $scope.namespace;
        }
        k8s.services.list(query)
          .then(function(services) {
            $scope.services = services;
            $scope.loadError = false;
          })
          .catch(function() {
            $scope.services = null;
            $scope.loadError = true;
          });
      }

      $scope.$watch('load', loadServices);

      $scope.$on(k8s.events.SERVICE_DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.services, data.resource);
      });

      $scope.$on(k8s.events.SERVICE_ADDED, loadServices);

      $scope.$on(k8s.events.SERVICE_MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.services, data.resource);
      });

    }
  };

});
