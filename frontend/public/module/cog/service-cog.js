/**
 * @fileoverview
 * Cog menu directive for services.
 */

angular.module('app')
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
            label: 'Modify Port...',
            weight: 200
          },
          {
            label: 'Modify Labels...',
            weight: 300,
            callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
              kind: k8s.enum.Kind.SERVICE,
              resource: getService,
            }),
          },
          {
            'label': 'Delete Service...',
            'callback': ModalLauncherSvc.open.bind(null, 'confirm', {
              title: 'Delete Service',
              message: 'Are you sure you want to delete ' +
                  $scope.service.metadata.name + '?',
              btnText: 'Delete Service',
              executeFn: getDeleteFn
            }),
            'weight': 400
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
