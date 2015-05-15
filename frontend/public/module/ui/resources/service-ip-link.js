angular.module('bridge.ui')
.directive('coServiceIpLink', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/service-ip-link.html',
    restrict: 'E',
    replace: true,
    scope: {
      service: '=',
    },
    controller: function($scope) {
      $scope.tooltipText = function(portObj) {
        var parts = [
          'protocol: ' + portObj.protocol,
          'target port:' + portObj.targetPort,
        ];
        if (portObj.name) {
          parts.push('name: ' + portObj.name);
        }
        return parts.join(', ');
      };
    },
  };

});
