/**
 * Veritcal nav for Deployments.
 */

angular.module('bridge.page')
.directive('coDeploymentNav', function() {
  'use strict';

  return {
    templateUrl: '/static/page/deployments/deployment-nav.html',
    restrict: 'E',
    replace: true,
    scope: {
      ns: '=',
      name: '=',
    }
  };
});
