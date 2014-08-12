/**
 * @fileoverview
 * Cog menu directive for pods.
 */

angular.module('app').directive('coPodCog', function() {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      'pod': '='
    },
    controller: function($scope) {

      $scope.cogOptions = [
        {
          label: 'Modify Labels...',
          weight: 100
        }
      ];

    }
  };

});
