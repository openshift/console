/**
 * @fileoverview
 * Cog menu directive for replication controllers.
 */

angular.module('app')
.directive('coReplicationcontrollerCog', function(k8s, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'rc': '='
    },
    controller: function($scope) {
      var deregisterWatch;

      function getDeleteFn() {
        return function() {
          return k8s.replicationcontrollers.delete($scope.rc);
        };
      }

      function generateOptions() {
        $scope.cogOptions = [
          {
            label: 'Modify Desired Count...',
            weight: 100
          },
          {
            label: 'Modify Selector...',
            weight: 200,
            href: '#',
          },
          {
            label: 'Modify Labels...',
            weight: 300,
            callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
              kind: k8s.enum.Kind.REPLICATIONCONTROLLER,
              resource: $scope.rc,
            }),
          },
          {
            label: 'Delete Replication Controller...',
            weight: 400,
            callback: ModalLauncherSvc.open.bind(null, 'confirm', {
              title: 'Delete Replication Controller',
              message: 'Are you sure you want to delete ' +
                  $scope.rc.metadata.name + '?',
              btnText: 'Delete Replication Controller',
              executeFn: getDeleteFn
            }),
          }
        ];
      }

      // Run once after app is populated.
      deregisterWatch = $scope.$watch('rc.metadata.name', function() {
        if ($scope.rc && $scope.rc.metadata && $scope.rc.metadata.name) {
          generateOptions();
          deregisterWatch();
        }
      });

    }
  };

});
