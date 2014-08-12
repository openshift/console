/**
 * @fileoverview
 * Cog menu directive for services.
 */

angular.module('app').directive('coServiceCog', function() {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'service': '='
    },
    controller: function($scope) {

      $scope.cogOptions = [
        {
          label: 'Modify Selector...',
          weight: 100,
          href: '#',
        },
        {
          label: 'Modify Ports...',
          weight: 200
        },
        {
          label: 'Modify Labels...',
          weight: 300
        }
      ];

    }
  };

});
