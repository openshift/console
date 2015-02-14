/**
 * Veritcal nav for replica controllers.
 */

angular.module('app')
.directive('coReplicationcontrollerNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/replicationcontrollers/replicationcontroller-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      rcId: '='
    }
  };

});
