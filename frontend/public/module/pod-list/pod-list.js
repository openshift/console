/**
 * @fileoverview
 * List out pods in a table-like view.
 */


angular.module('app').directive('coPodList', function() {
  'use strict';

  return {
    templateUrl: '/static/module/pod-list/pod-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      pods: '='
    }
  };

});
