/**
 * @fileoverview
 * Cog menu directive for pods.
 */

angular.module('app').directive('coPodCog', function(PodsSvc, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'pod': '='
    },
    controller: function($scope) {

      function getDeleteFn() {
        return function() {
          return PodsSvc.delete($scope.pod);
        };
      }

      $scope.cogOptions = [
        {
          label: 'Modify Labels...',
          weight: 100
        },
        {
          'label': 'Delete Pod...',
          'callback': ModalLauncherSvc.open.bind(null, 'confirm', {
            title: 'Delete Pod',
            message: 'Are you sure you want to delete ' +
                $scope.pod.id + '?',
            btnText: 'Delete Pod',
            executeFn: getDeleteFn
          }),
          'weight': 200
        }
      ];

    }
  };

});
