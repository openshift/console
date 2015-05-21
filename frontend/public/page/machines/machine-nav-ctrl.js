/**
 * Veritcal nav for machines.
 */

angular.module('bridge.page')
.directive('coMachineNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/machines/machine-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      name: '='
    }
  };

});
