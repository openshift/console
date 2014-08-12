/**
 * @fileoverview
 * Cog menu directive for controllers.
 */

angular.module('app').directive('coControllerCog', function() {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'controller': '='
    },
    controller: function($scope) {

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
        }
      ];

    }
  };

});
