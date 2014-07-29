angular.module('app')
.controller('ServiceCtrl', function($scope, ServicesSvc) {
  'use strict';

  ServicesSvc.get().then(function(result) {
    $scope.service = result;
  });

});
