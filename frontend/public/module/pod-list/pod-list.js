/**
 * @fileoverview
 * List out pods in a table-like view.
 */

angular.module('app').directive('coPodList', function(k8s, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/pod-list/pod-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      pods: '='
    },
    controller: function($scope) {

      $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
        if (data.kind === k8s.enum.Kind.POD) {
          arraySvc.remove($scope.pods, data.original);
        }
      });

      $scope.$on(k8s.events.RESOURCE_UPDATED, function(e, data) {
        if (data.kind === k8s.enum.Kind.POD) {
          resourceMgrSvc.updateInList($scope.pods, data.resource);
        }
      });

    }
  };

});
