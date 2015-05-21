/**
 * @fileoverview
 * Cog menu directive for nodes.
 */

angular.module('bridge.ui')
.directive('coNodeCog', function(k8s, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      node: '='
    },
    controller: function($scope) {
      var deregisterWatch;

      function getNode() {
        return $scope.node;
      }

      function generateOptions() {
        $scope.cogOptions = [
          {
            label: 'Modify Labels...',
            weight: 100,
            callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
              kind: k8s.enum.Kind.NODE,
              resource: getNode,
            }),
          },
        ];
      }

      // Run once after app is populated.
      deregisterWatch = $scope.$watch('node.metadata.name', function() {
        if ($scope.node && $scope.node.metadata && $scope.node.metadata.name) {
          generateOptions();
          deregisterWatch();
        }
      });

    }
  };

});
