angular.module('bridge.page')
.directive('bridgeUserList', function () {
  'use strict';
  return {
    templateUrl: '/static/page/settings/user-list.html',
    restrict: 'E',
    scope: {
      users: '=',
      yourID: '=yourId',
      reload: '&',
      search: '=',
    }
  };
});
