angular.module('creme.svc').factory('unauthorizedInterceptorSvc', function($q, $rootScope) {
  'use strict';

  return {
    /**
     * For every failing $http request: broadcast an error event.
     */
    'responseError': function(rejection) {
      if (rejection && rejection.status === 401) {
        $rootScope.$broadcast('xhr-error-unauthorized', rejection);
      }
      return $q.reject(rejection);
    }
  };

});
