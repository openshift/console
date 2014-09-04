/**
 * @fileoverview
 * List out pods in a table-like view.
 */


angular.module('app').directive('coPodList', function(EVENTS, arraySvc) {
  'use strict';

  return {
    templateUrl: '/static/module/pod-list/pod-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      pods: '='
    },
    controller: function($scope) {
      $scope.$on(EVENTS.POD_DELETE, function(e, pod) {
        arraySvc.remove($scope.pods, pod);
      });
    }
  };

});
