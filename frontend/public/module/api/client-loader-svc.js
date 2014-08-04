angular.module('app')
.factory('ClientLoaderSvc', function($rootScope, apiClient, CORE_EVENT) {
  'use strict';

  return apiClient.get('bridge')
    .then(function(client) {
      $rootScope.client = client;
    })
    .catch(function() {
      $rootScope.$emit(CORE_EVENT.PAGE_NOT_FOUND, 'Error loading bridge api discovery json.');
    });

});
