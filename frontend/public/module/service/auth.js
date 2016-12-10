import {authSvc} from '../auth';

angular.module('bridge.service')
.factory('ensureLoggedInSvc', function($rootScope, $q, featuresSvc) {
  'use strict';

  return $q.resolve().then(function () {
    if (featuresSvc.isAuthDisabled) {
      return;
    }

    if (!authSvc.isLoggedIn()) {
      return $q.reject('not-logged-in');
    }

    $rootScope.user = {
      id: authSvc.userID(),
      name: authSvc.name(),
      email: authSvc.email(),
    };
  });
});
