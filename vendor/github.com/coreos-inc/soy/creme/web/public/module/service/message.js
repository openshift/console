angular.module('creme.svc')
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

});
