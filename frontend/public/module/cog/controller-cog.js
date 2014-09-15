/**
 * @fileoverview
 * Cog menu directive for controllers.
 */

angular.module('app')
.directive('coControllerCog', function(ControllersSvc, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'controller': '='
    },
    controller: function($scope) {

      function getDeleteFn() {
        return function() {
          return ControllersSvc.delete($scope.controller);
        };
      }

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
          weight: 300
        },
        {
          label: 'Delete Controller...',
          weight: 400,
          callback: ModalLauncherSvc.open.bind(null, 'confirm', {
            title: 'Delete Controller',
            message: 'Are you sure you want to delete ' +
                $scope.controller.id + '?',
            btnText: 'Delete Controller',
            executeFn: getDeleteFn
          }),
        }
      ];

    }
  };

});
