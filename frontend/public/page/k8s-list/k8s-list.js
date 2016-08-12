angular.module('bridge.page')
.controller('k8sListCtrl', function($scope, k8s, $location) {
  'use strict';

  const id = $location.path().split('/').slice(-1)[0];
  const kind = k8s[id].kind;

  if (id === 'daemonsets') {
    $scope.canCreate = false;
  } else {
    $scope.canCreate = true;
  }
  $scope.kind = kind;
  $scope.title = kind.labelPlural;
  $scope.component = kind.labelPlural.replace(/ /g, '') + 'Page';
});
