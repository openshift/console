/**
 * @fileoverview
 * Cog menu directive for replica sets.
 */

angular.module('bridge.ui')
.directive('coReplicasetCog', function(k8s, ModalLauncherSvc, resourceMgrSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'rs': '='
    },
    controller: function($scope) {
      var deregisterWatch;

      function getRS() {
        return $scope.rs;
      }

      function getDeleteFn() {
        return function() {
          return k8s.replicasets.delete($scope.rs);
        };
      }

      function getEditLink() {
        return resourceMgrSvc.getEditLink($scope.rs, k8s.enum.Kind.REPLICASET);
      }

      function generateOptions() {
        $scope.cogOptions = [
          {
            label: 'Modify Desired Count...',
            weight: 100,
            callback: ModalLauncherSvc.open.bind(null, 'configure-replica-count', {
              resourceKind: k8s.enum.Kind.REPLICASET,
              resource:     getRS
            }),
          },
          {
            label: 'Modify Pod Selector...',
            weight: 200,
            callback: ModalLauncherSvc.open.bind(null, 'configure-selector', {
              resourceKind: k8s.enum.Kind.REPLICASET,
              selectorKind: k8s.enum.Kind.POD,
              resource: getRS,
              message: 'Replica Sets ensure the configured number ' +
                  'of pods matching this pod selector are healthy and running.',
            }),
          },
          {
            label: 'Modify Labels...',
            weight: 300,
            callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
              kind: k8s.enum.Kind.REPLICASET,
              resource: getRS,
            }),
          },
          {
            label: 'Edit Replica Set...',
            weight: 400,
            href: getEditLink(),
          },
          {
            label: 'Delete Replica Set...',
            weight: 500,
            callback: ModalLauncherSvc.open.bind(null, 'confirm', {
              title: 'Delete Replica Set',
              message: 'Are you sure you want to delete ' +
                  $scope.rs.metadata.name + '?',
              btnText: 'Delete Replica Set',
              executeFn: getDeleteFn
            }),
          }
        ];
      }

      // Run once after app is populated.
      deregisterWatch = $scope.$watch('rs.metadata.name', function() {
        if ($scope.rs && $scope.rs.metadata && $scope.rs.metadata.name) {
          generateOptions();
          deregisterWatch();
        }
      });
    }
  };
});
