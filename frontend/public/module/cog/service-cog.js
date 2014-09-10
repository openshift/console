/**
 * @fileoverview
 * Cog menu directive for services.
 */

angular.module('app').directive('coServiceCog', function(ServicesSvc, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'service': '='
    },
    controller: function($scope) {

      function getDeleteFn() {
        return function() {
          return ServicesSvc.delete($scope.service);
        };
      }

      $scope.cogOptions = [
        {
          label: 'Modify Selector...',
          weight: 100,
          href: '#',
        },
        {
          label: 'Modify Port...',
          weight: 200
        },
        {
          label: 'Modify Labels...',
          weight: 300
        },
        {
          'label': 'Delete Service...',
          'callback': ModalLauncherSvc.open.bind(null, 'confirm', {
            title: 'Delete Service',
            message: 'Are you sure you want to delete ' +
                $scope.service.id + '?',
            btnText: 'Delete Service',
            executeFn: getDeleteFn
          }),
          'weight': 400
        }
      ];

    }
  };

});
