/**
 * @fileoverview
 * Cog menu directive for services.
 */

angular.module('bridge.ui')
.directive('coServiceCog', function(k8s, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'service': '='
    },
    controller: function($scope) {
      var deregisterWatch;

      function getService() {
        return $scope.service;
      }

      function getDeleteFn() {
        return function() {
          return k8s.services.delete($scope.service);
        };
      }

      function generateOptions() {
        $scope.cogOptions = [
          {
            label: 'Modify Label Selector...',
            weight: 100,
            callback: ModalLauncherSvc.open.bind(null, 'configure-selector', {
              resourceKind: k8s.enum.Kind.SERVICE,
              selectorKind: k8s.enum.Kind.POD,
              resource: getService,
              message: 'Services will route traffic to pods matching this label selector:',
            }),
          },
          {
            label: 'Modify Service Port...',
            weight: 200,
            callback: ModalLauncherSvc.open.bind(null, 'configure-port', {
              kind: k8s.enum.Kind.SERVICE,
              resource: getService,
              propertyName: 'port',
              title: 'Modify Service Port',
              description: 'The service can be reached at its portal IP and this port.',
            }),
          },
          {
            label: 'Modify Target Port...',
            weight: 300,
            callback: ModalLauncherSvc.open.bind(null, 'configure-port', {
              kind: k8s.enum.Kind.SERVICE,
              resource: getService,
              propertyName: 'targetPort',
              title: 'Modify Target Port',
              description: 'The port used by the service for connecting to pods. ' +
                  'Pod ports must be exposed in their configuration.',
            }),
          },
          {
            label: 'Modify Labels...',
            weight: 400,
            callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
              kind: k8s.enum.Kind.SERVICE,
              resource: getService,
            }),
          },
          {
            label: 'Delete Service...',
            callback: ModalLauncherSvc.open.bind(null, 'confirm', {
              title: 'Delete Service',
              message: 'Are you sure you want to delete ' +
                  $scope.service.metadata.name + '?',
              btnText: 'Delete Service',
              executeFn: getDeleteFn
            }),
            weight: 500
          }
        ];
      }

      // Run once after app is populated.
      deregisterWatch = $scope.$watch('service.metadata.name', function() {
        if ($scope.service && $scope.service.metadata && $scope.service.metadata.name) {
          generateOptions();
          deregisterWatch();
        }
      });

    }
  };

});
