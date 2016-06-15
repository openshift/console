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
    controller: function ($scope, k8s, k8sCache) {
      $scope.passByRef = {compacted :'true'};

      if ($scope.trusted) {
        $scope.title = 'Trusted Nodes';
        $scope.description = 'Nodes that match a known, trusted hardware provider.';
      } else {
        $scope.title = 'Untrusted Nodes';
        $scope.description = 'Nodes that don\'t match a trusted profile or configuration have been modified since being trusted.';
      }

      k8sCache.nodesChanged($scope,
        nodes => {
          $scope.loadError = false;
          $scope.nodes = nodes.filter(n => !!$scope.trusted === k8s.nodes.isTrusted(n));
        }, () => {
          $scope.loadError = true
        }
      );
    }
  };
});
