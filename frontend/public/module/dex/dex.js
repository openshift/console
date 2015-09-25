angular.module('dex')
.service('dex', function($http) {
  'use strict';

  var basePath = '/api/dex/v1/';

  this.users = {
    // params: {maxResults: ..., nextPageToken: ....}
    list: function(params) {
      return $http({
        url: basePath + 'users',
        method: 'GET',
        params: params
      }).then(function(r) {
        return r.data;
      });
    },
    // params: {user: {email:, displayName:, admin:,}}
    create: function(params) {
      return $http({
        url: basePath + 'users',
        method: 'POST',
        data: params
      }).then(function(r) {
        return r.data;
      });
    }
  };
});
