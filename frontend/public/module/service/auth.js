import {authSvc} from '../auth';

angular.module('bridge.service')
.factory('ensureLoggedInSvc', function($q) {
  'use strict';

  return $q.resolve().then(function () {
    if (window.SERVER_FLAGS.authDisabled) {
      return;
    }

    if (!authSvc.isLoggedIn()) {
      return $q.reject('not-logged-in');
    }
  });
});
