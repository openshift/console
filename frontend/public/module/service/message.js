angular.module('bridge.service')
.factory('messageSvc', function(MESSAGES) {
  'use strict';
  return {
    get: function(type, id) {
      var t = MESSAGES[type];
      if (!t) {
        return '';
      }
      return t[id] || t.default || '';
    },
  };
})
.constant('MESSAGES', {
  auth: {
    'invalid_code': 'There was an error logging you in. Please logout and try again.',
    'default': 'There was an authentication error with the system. Please try again or contact support.',
    'logout_error': 'There was an error logging you out. Please try again.',
  },
});
