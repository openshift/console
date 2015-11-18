angular.module('bridge.page')
.controller('ShowYAMLCtrl', function($scope, $window, yamlizeSvc, obj) {
  'use strict';
  var cleaned = angular.copy(obj);
  var yaml = yamlizeSvc.yamlize(cleaned) + '\n';
  var blob = new Blob([yaml], {type: 'text/plain'});
  $scope.yaml = yaml;
  $scope.downloadURL = $window.URL.createObjectURL(blob);
});
