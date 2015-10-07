angular.module('dex')
.service('dex', function($window, $http) {
  'use strict';

  var basePath = '/api/dex/v1/';

  this.users = {
    // returns true if and only if the api is available
    available: function() {
      return $http({
        url: basePath + 'users',
        method: 'GET',
        params: {maxResults: 0},
        unauthorizedOk: true,
      })
      .then(function() {
          return true;
      })
      .catch(function(reason) {
        if (reason.status === 401 || reason.status === 403 || reason.status === 404) {
          return false;
        }

        throw reason;
      });
    },

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
    },
    disable: function(userID, disableIfTrue) {
      return $http({
        url: basePath + 'users/' + $window.encodeURIComponent(userID) + '/disable',
        method: 'POST',
        data: {disable: disableIfTrue}
      }).then(function(r) {
        return r.data;
      });
    }
  };
});
