/**
 * @fileoverview
 * Toggle button to play/pause.
 * Calls an optional 'on-toggle' callback with the active state.
 */

angular.module('bridge.ui')
.directive('coTogglePlay', function() {
  'use strict';

  return {
    template: '<button ng-click="toggle()" class="co-toggle-play fa"></button>',
    restrict: 'E',
    replace: true,
    scope: {
      active: '=',
      onToggle: '&?',
    },
    link: function(scope, elem) {
      function updateUI() {
        elem.removeClass('co-toggle-play--active co-toggle-play--inactive');
        if (scope.active) {
          elem.addClass('co-toggle-play--active');
        } else {
          elem.addClass('co-toggle-play--inactive');
        }
      }

      scope.toggle = function() {
        scope.active = !scope.active;
        if (scope.onToggle) {
          scope.onToggle({ active: scope.active });
        }
      };

      scope.$watch('active', updateUI);
    },
  };

});
