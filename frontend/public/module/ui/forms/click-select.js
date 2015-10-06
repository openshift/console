angular.module('bridge.ui')
.directive('coClickSelect', function() {
  'use strict';

  return {
    restrict: 'A',
    link: function(scope, elem) {
      function clickHandler(event) {
        elem.select();
        event.preventDefault();
        event.stopPropagation();
      }
      elem.on('click', clickHandler);
      elem.on('$destroy', function() {
        elem.off('click', clickHandler);
      });
    }
  };
});
