/**
 * @fileoverview
 * Dynamically lists resources in a table-like view.
 */

angular.module('app.ui')
.directive('coResourceList', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/resource-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      kind: '=',
      resources: '=',
    }
  };

});
