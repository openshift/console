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
      // filter pod list by an api field selector
      fieldSelector: '=',
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
        if (!$scope.load) {
          return;
        }
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
        if ($scope.fieldSelector) {
          query.fieldSelector = $scope.fieldSelector;
        }

        k8s.pods.list(query)
          .then(onSuccess)
          .catch(onError);
      }

      $scope.$watch('load', loadPods);
      $scope.$watch('selector', loadPods);
      $scope.$watch('fieldSelector', loadPods);

      $scope.$watch('error', function(error) {
        if (error) {
          $scope.loadError = true;
        }
      });

      $scope.$on(k8s.events.POD_DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.pods, data.resource);
      });

      $scope.$on(k8s.events.POD_ADDED, loadPods);

      $scope.$on(k8s.events.POD_MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.pods, data.resource);
      });

    }
  };

});
