/**
 * @fileoverview
 * Cog menu directive for deployments.
 */

angular.module('bridge.ui')
.directive('coDeploymentCog', function(k8s, ModalLauncherSvc, resourceMgrSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'deployment': '='
    },
    controller: function($scope) {
      var deregisterWatch;

      function getDeployment() {
        return $scope.deployment;
      }

      function getDeleteFn() {
        return function() {
          return k8s.deployment.delete($scope.deployment);
        };
      }

      function getEditLink() {
        return resourceMgrSvc.getEditLink($scope.deployment, k8s.enum.Kind.DEPLOYMENT);
      }

      function generateOptions() {
        $scope.cogOptions = [
          {
            label: 'Modify Desired Count...',
            weight: 100,
            callback: ModalLauncherSvc.open.bind(null, 'configure-replica-count', {
              resourceKind: k8s.enum.Kind.DEPLOYMENT,
              resource:     getDeployment
            }),
          },
          {
            label: 'Modify Pod Selector...',
            weight: 200,
            callback: ModalLauncherSvc.open.bind(null, 'configure-selector', {
              resourceKind: k8s.enum.Kind.DEPLOYMENT,
              selectorKind: k8s.enum.Kind.POD,
              resource: getDeployment,
              message: 'Deployments ensure the configured number ' +
                  'of pods matching this pod selector are healthy and running.',
            }),
          },
          {
            label: 'Modify Labels...',
            weight: 300,
            callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
              kind: k8s.enum.Kind.DEPLOYMENT,
              resource: getDeployment,
            }),
          },
          {
            label: 'Edit Deployment...',
            weight: 400,
            href: getEditLink(),
          },
          {
            label: 'Delete Deployment...',
            weight: 500,
            callback: ModalLauncherSvc.open.bind(null, 'confirm', {
              title: 'Delete Deployment',
              message: 'Are you sure you want to delete ' +
                  $scope.deployment.metadata.name + '?',
              btnText: 'Delete Deployment',
              executeFn: getDeleteFn
            }),
          }
        ];
      }

      // Run once after app is populated.
      deregisterWatch = $scope.$watch('deployment.metadata.name', function() {
        if ($scope.deployment && $scope.deployment.metadata && $scope.deployment.metadata.name) {
          generateOptions();
          deregisterWatch();
        }
      });
    }
  };
});
