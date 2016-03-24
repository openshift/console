angular.module('bridge.service')
.factory('featuresSvc', function($window) {
  'use strict';
  return {
    isAuthDisabled: $window.SERVER_FLAGS.authDisabled,
  };
});
