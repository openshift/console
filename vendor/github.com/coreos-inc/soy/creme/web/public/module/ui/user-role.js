angular.module('creme.ui').directive('tecUserRole', function(USER_ROLE) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/user-role.html',
    restrict: 'E',
    scope: {
      fields: '=',
    },
    controller: function($scope) {
      $scope.adminRoleValue = USER_ROLE.ADMIN;
      $scope.readonlyRoleValue = USER_ROLE.READ_ONLY;
    },
  };

});
