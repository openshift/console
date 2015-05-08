/**
 * Veritcal nav for replica controllers.
 */

angular.module('bridge.page')
.directive('coReplicationcontrollerNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/replicationcontrollers/replicationcontroller-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      rc: '='
    }
  };

});
