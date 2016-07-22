angular.module('bridge.service')
.factory('errorSvc', function($window) {
  'use strict';

  return {
    sendToErrorPage: function(errType, errMsgKey) {
      var errURL = $window.SERVER_FLAGS.loginErrorURL + '?';
      errURL += 'error_type=' + encodeURIComponent(errType);
      errURL += '&error=' + encodeURIComponent(errMsgKey);
      $window.location.href = errURL;
    },
  };

});
