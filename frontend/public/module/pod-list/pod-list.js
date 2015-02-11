/**
 * @fileoverview
 * List out pods in a table-like view.
 */

angular.module('app').directive('coPodList', function(k8s, arraySvc) {
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
        if (data.type === 'pod') {
          arraySvc.remove($scope.pods, data.resource);
        }
      });
    }
  };

});
