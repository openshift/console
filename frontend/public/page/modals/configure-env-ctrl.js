angular.module('app')
.controller('ConfigureEnvCtrl', function(_, $scope, $modalInstance, env,
      arraySvc) {
  'use strict';

  function getEmptyEnv() {
    return {
      name: null,
      value: null,
    };
  }

  if (_.isEmpty(env)) {
    $scope.env = [getEmptyEnv()];
  } else {
    $scope.env = env;
  }

  $scope.clearRow = function(item) {
    if ($scope.env.length === 1) {
      $scope.env = [getEmptyEnv()];
    } else {
      arraySvc.remove($scope.env, item);
    }
  };

  $scope.save = function() {
    $modalInstance.close($scope.env);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureEnvFormCtrl', function($scope) {

  $scope.submit = $scope.save;

});
