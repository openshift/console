angular.module('app.modules')
.service('debugSvc', function($log, coLocalStorage) {
  'use strict';

  function debugOn() {
    return coLocalStorage.getItem('debug') === 'true';
  }

  function wrap(fn) {
    return function() {
      if (debugOn()) {
        return fn.apply(null, arguments);
      }
    };
  }

  this.log = wrap($log.log);
  this.info = wrap($log.info);
  this.warn = wrap($log.warn);
  this.error = wrap($log.error);
  this.debug = wrap($log.debug);
  this.debugOn = debugOn;
});


angular.module('app.ui')
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
