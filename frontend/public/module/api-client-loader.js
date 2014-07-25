angular.module('app')
.factory('apiClientLoaderSvc', function($rootScope, apiClient, CORE_EVENT) {
  'use strict';

  return apiClient.get('bridge')
    .catch(function() {
      $rootScope.$emit(CORE_EVENT.PAGE_NOT_FOUND, 'Error loading bridge api discovery json.');
    });

});
