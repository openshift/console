/**
 * @fileoverview
 * Cog menu directive for pods.
 */

angular.module('bridge.ui')
.directive('coPodCog', function(k8s, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'pod': '='
    },
    controller: function($scope) {
      var deregisterWatch;

      function getPod() {
        return $scope.pod;
      }

      function getDeleteFn() {
        return function() {
          return k8s.pods.delete($scope.pod);
        };
      }

      function generateOptions() {
        $scope.cogOptions = [
          {
            label: 'Modify Labels...',
            weight: 100,
            callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
              kind: k8s.enum.Kind.POD,
              resource: getPod,
            }),
          },
          {
            label: 'Delete Pod...',
            weight: 200,
            callback: ModalLauncherSvc.open.bind(null, 'confirm', {
              title: 'Delete Pod',
              message: 'Are you sure you want to delete ' +
                  $scope.pod.metadata.name + '?',
              btnText: 'Delete Pod',
              executeFn: getDeleteFn
            }),
          }
        ];
      }

      // Run once after app is populated.
      deregisterWatch = $scope.$watch('pod.metadata.name', function() {
        if ($scope.pod && $scope.pod.metadata && $scope.pod.metadata.name) {
          generateOptions();
          deregisterWatch();
        }
      });

    }
  };

});
