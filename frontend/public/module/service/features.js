angular.module('bridge.service')
.factory('featuresSvc', function($window) {
  'use strict';
  return {
    isAuthDisabled: $window.SERVER_FLAGS.authDisabled,
    tpm: undefined,
    userManagement: undefined,
    rbacV1alpha1: undefined,
    revokeToken: !!$window.SERVER_FLAGS.kubectlClientID,
  };
});
