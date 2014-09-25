angular.module('app')
.controller('ViewJsonCtrl', function($scope, $modalInstance, json, title) {
  'use strict';

  $scope.title = title || '';
  $scope.json = json;
  $scope.jsonString = JSON.stringify(json, null, 2);

  $scope.close = function() {
    $modalInstance.dismiss('close');
  };

});
