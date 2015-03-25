/**
 * @fileoverview
 * List out pods in a table-like view.
 */

angular.module('app.ui')
.directive('coPodList', function(k8s, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/pod-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      pods: '=',
      search: '=',
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
