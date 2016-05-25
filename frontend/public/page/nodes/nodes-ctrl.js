angular.module('bridge.page')
.controller('NodesCtrl', function (featureFlags, $scope) {
  'use strict';

  $scope.featureFlags = featureFlags;
});
