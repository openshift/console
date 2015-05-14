/**
 * @fileoverview
 * List out pods in a table-like view.
 */

angular.module('bridge.ui')
.directive('coPodList', function(k8s, arraySvc, _, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/pod-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      // (required) namespace to load pods from
      namespace: '=',
      // label selector to filter by. optional unless selector-required=true
      selector: '=',
      // optional search filter
      searchFilter: '=search',
      // field filters to apply to pod list
      podsFilterQuery: '=filter',
      // only attempt loading pods if this is true
      load: '=',
      // force error
      error: '=',
      // restrict pod list to those bound by a particular node
      node: '=',
    },
    controller: function($scope, $attrs) {
      $scope.pods = null;
      $scope.loadError = false;

      function onSuccess(pods) {
        $scope.pods = pods;
        $scope.loadError = false;
      }

      function onError() {
        $scope.pods = null;
        $scope.loadError = true;
      }

      function loadPods() {
        var query = {};
        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.pods = [];
          return;
        }
        if ($scope.selector) {
          query.labelSelector = $scope.selector;
        }
        if ($scope.namespace) {
          query.ns = $scope.namespace;
        }

        // TODO(sym3tri): maybe handle this in the k8s service instead.
        if ($scope.node) {
          k8s.pods.listByNode($scope.node)
            .then(onSuccess)
            .catch(onError);
        } else {
          k8s.pods.list(query)
            .then(onSuccess)
            .catch(onError);
        }
      }

      $scope.$watch('load', function(load) {
        if (load) {
          loadPods();
        }
      });

      $scope.$watch('error', function(error) {
        if (error) {
          $scope.loadError = true;
        }
      });

      $scope.$watch('selector', function() {
        loadPods();
      });

      $scope.$on(k8s.events.POD_DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.pods, data.resource);
      });

      $scope.$on(k8s.events.POD_ADDED, function(e, data) {
        resourceMgrSvc.updateInList($scope.pods, data.resource);
      });

      $scope.$on(k8s.events.POD_MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.pods, data.resource);
      });

    }
  };

});
