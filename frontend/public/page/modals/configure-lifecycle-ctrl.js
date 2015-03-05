angular.module('app')
.controller('ConfigureLifecycleCtrl', function($scope, _, k8s, urlSvc, $modalInstance, container) {
  'use strict';

  var placeholders = {
    exec: {
      start: '/bin/my-start-hook',
      stop: '/bin/my-stop-hook',
    },
    httpGet: {
      start: 'http://localhost:8080/my-start-hook',
      stop: 'http://localhost:8080/my-stop-hook',
    },
    tcpSocket: {
      start: '8080',
      stop: '8080',
    },
  };

  $scope.hookTypes = k8s.enum.LifecycleHook;

  $scope.fields = k8s.lifecycle.mapLifecycleConfigToFields(container.lifecycle);

  $scope.getHookLabel = function(type) {
    return k8s.enum.LifecycleHook[type].label;
  };

  $scope.getPlaceholder = function(type, hook) {
    return placeholders[type][hook];
  };

  $scope.save = function() {
    container.lifecycle = k8s.lifecycle.mapFieldsToLifecycleConfig($scope.fields);
    $modalInstance.close(container);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigureLifecycleFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
