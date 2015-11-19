angular.module('bridge.page')
.controller('ShowYAMLCtrl', function($scope, blobURLSvc, yamlizeSvc, obj) {
  'use strict';
  var cleaned = angular.copy(obj);
  var yaml = yamlizeSvc.yamlize(cleaned) + '\n';
  $scope.yaml = yaml;
  $scope.downloadURL = blobURLSvc.blobURL([yaml], {type: 'text/plain'});
});
