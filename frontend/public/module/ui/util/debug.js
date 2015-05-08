angular.module('bridge.ui')
.directive('coDebug', function(debugSvc) {
  'use strict';
  return {
    template: '<div ng-if="debugOn"><pre>{{getObj()}}</pre></div>',
    restrict: 'E',
    replace: false,
    scope: {
      obj: '='
    },
    link: function(scope, elem) {
      if (debugSvc.debugOn()) {
        scope.debugOn = true;
        scope.getObj = function() {
          return JSON.stringify(scope.obj, null, 2);
        };
        elem.css('display', 'block');
      }
    }
  };
});
