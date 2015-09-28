/**
 * Veritcal nav for nodes.
 */

angular.module('bridge.page')
.directive('coNodeNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/nodes/node-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      name: '='
    }
  };

});
