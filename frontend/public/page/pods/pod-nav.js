/**
 * Veritcal nav for pods.
 */

angular.module('bridge.page')
.directive('coPodNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/pods/pod-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      ns: '=',
      name: '='
    }
  };

});
