'use strict';

angular.module('bridge.ui')
.directive('coNodeSection', function() {

  return {
    templateUrl: '/static/module/ui/resources/node-section.html',
    restrict: 'E',
    replace: true,
    controller: function ($scope) {
      $scope.passByRef = {
        compacted: 'true',
        status: 'all',
        trusted: 'all',
      };
    }
  };
});
