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
        unauthorizedOk: true, // We expect 401s without getting logged out
      })
      .then(function() {
          return true;
      })
      .catch(function() {
        return false;
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
