angular.module('bridge.page')
.controller('ShowYAMLCtrl', function($scope, yamlizeSvc, obj) {
  'use strict';
  var cleaned = angular.copy(obj);
  var yaml = `${yamlizeSvc.yamlize(cleaned)}\n`;
  $scope.yaml = yaml;
  const blob = new Blob([yaml], {type: 'text/plain'});
  $scope.downloadURL = URL.createObjectURL(blob);
  $scope.selectAll = function(event) {
    event.target.select();
    event.preventDefault();
    event.stopPropagation();
  };
});
