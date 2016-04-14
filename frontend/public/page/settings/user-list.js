angular.module('bridge.page')
.directive('bridgeUserList', function (ModalLauncherSvc) {
  'use strict';
  return {
    templateUrl: '/static/page/settings/user-list.html',
    restrict: 'E',
    scope: {
      users: '=',
      yourId: '=',
      reload: '&',
      search: '=',
    },
    link: function(scope) {
      scope.showDisableModal = function(user, disableIfTrue) {
        var instance = ModalLauncherSvc.open('toggle-disabled-user', {
          user: user,
          disableIfTrue: disableIfTrue
        });
        instance.result.then(scope.reload());
      };
    }
  };
});
