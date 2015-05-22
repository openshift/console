/**
 * Veritcal nav for services.
 */

angular.module('bridge.page')
.directive('coServiceNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/services/service-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      ns: '=',
      name: '='
    }
  };

});
