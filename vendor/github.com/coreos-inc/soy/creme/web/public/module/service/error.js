angular.module('creme.svc')
.factory('errorSvc', function($window, _) {
  'use strict';

  return {
    stringify: function(err) {
      var s = '',
          e = err,
          defaultMsg = 'unknown error';
      if (!e) {
        return defaultMsg;
      }
      if (e.data) {
        e = e.data;
      }
      if (_.isString(e)) {
        return e;
      }
      if (e.description) {
        return e.description;
      }
      if (e.error) {
        return e.error;
      }
      if (s === '') {
        return defaultMsg;
      }
      return s;
    },

    sendToErrorPage: function(errType, errMsgKey) {
      var errURL = '/error?';
      errURL += '&error_type=' + errType;
      errURL += '&error=' + errMsgKey;
      $window.location.href = errURL;
    },

  };

});
