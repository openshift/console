/**
 * Veritcal nav for replica controllers.
 */


angular.module('app')
.directive('coReplicaNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/controllers/replica-controller-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      controllerId: '='
    }
  };

});
