/**
 * @fileoverview
 * List node IP addresses in a list.
 */

angular.module('bridge.ui')
.directive('coNodeIpList', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/node-ip-list.html',
    restrict: 'E',
    scope: {
      addresses: '=',
      compacted: '=',
    },
  };
});
