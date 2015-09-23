angular.module('bridge.service')
.factory('featuresSvc', function($window) {
  return {
    isAuthDisabled: $window.SERVER_FLAGS.authDisabled,
  };
});
