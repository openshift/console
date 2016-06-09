angular.module('bridge.page')
.controller('nodeTpmLogCtrl', function($scope, $routeParams, k8s, tpm) {
  'use strict';

  $scope.nodeName = $routeParams.name;
  $scope.pcrToHuman = tpm.pcrToHuman;
  $scope.pcrRawToHex = tpm.pcrRawToHex;
  k8s.nodes.get($routeParams.name)
    .then(function(node) {
      $scope.node = node;
      const annotations = node.metadata.annotations && node.metadata.annotations['tpm.coreos.com/logstate'];
      if (!annotations) {
        return;
      }
      $scope.logs = JSON.parse(annotations).sort((a, b) => { return a.Pcr - b.Pcr});
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.node = null;
      $scope.loadError = true;
    });
});
