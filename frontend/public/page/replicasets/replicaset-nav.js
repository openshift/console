/**
 * Veritcal nav for replica sets.
 */

angular.module('bridge.page')
.directive('coReplicasetNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/replicasets/replicaset-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      ns: '=',
      name: '=',
    }
  };
});
