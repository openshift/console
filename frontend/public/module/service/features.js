angular.module('bridge.service')
.factory('featuresSvc', function($window) {
  'use strict';
  return {
    isAuthDisabled: $window.SERVER_FLAGS.authDisabled,
    userManagement: undefined,
    rbacV1alpha1: undefined,
    clusterUpdates: undefined,
    revokeToken: !!$window.SERVER_FLAGS.kubectlClientID,
  };
});
