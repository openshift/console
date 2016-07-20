'use strict';

angular.module('bridge.ui')
.directive('coNodeSection', function() {

  return {
    templateUrl: '/static/module/ui/resources/node-section.html',
    restrict: 'E',
    replace: true,
    scope: {
      trusted: '=',
    },
    controller: function ($scope) {
      $scope.passByRef = {
        compacted: 'true',
        status: 'all',
      };

      if ($scope.trusted) {
        $scope.title = 'Trusted Nodes';
        $scope.description = 'Nodes that match a known, trusted hardware provider.';
      } else {
        $scope.title = 'Untrusted Nodes';
        $scope.description = 'Nodes that don\'t match a trusted profile or configuration have been modified since being trusted.';
      }
    }
  };
});
