angular.module('bridge.service')
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
