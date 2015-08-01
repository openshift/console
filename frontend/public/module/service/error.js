angular.module('bridge.service')
.factory('errorSvc', function($window) {
  'use strict';

  return {
    sendToErrorPage: function(errType, errMsgKey) {
      var errURL = '/error?';
      errURL += 'error_type=' + errType;
      errURL += 'error=' + errMsgKey;
      $window.location.href = errURL;
    },
  };

});
