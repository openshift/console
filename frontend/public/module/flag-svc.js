/**
 * @fileoverview
 * Provides access to global page flags.
 */
angular.module('app.modules')
.provider('flagSvc', function() {
  'use strict';

  var globalId;

  this.setGlobalId = function(id) {
    globalId = id;
  };

  this.$get = function($window) {
    return {
      // Get a global flag by name.
      get: function(name) {
        return $window[globalId][name];
      },
      all: function() {
        return $window[globalId];
      },
    };
  };

});
