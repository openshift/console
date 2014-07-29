angular.module('app')
.service('ControllersSvc', function($rootScope) {
  'use strict';

  this.list = function() {
    return $rootScope.client.controllers.list()
      .then(function(result) {
        return result.data.items;
      });
  };

});
