angular.module('bridge.page')
.controller('k8sListCtrl', function($scope, k8s, $location, $routeParams, $window) {
  'use strict';

  let kind;
  if ($routeParams.kind in k8s) {
    kind = k8s[$routeParams.kind].kind;
  } else {
    $scope.component = 'nop';
    $location.url('/404');
    return;
  }

  if ($routeParams.kind === 'daemonsets') {
    $scope.canCreate = false;
  } else {
    $scope.canCreate = true;
  }
  $scope.kind = kind;
  $scope.title = kind.labelPlural;
  $scope.component = kind.labelPlural.replace(/ /g, '') + 'Page';
  $window.document.title = `Tectonic - ${kind.labelPlural}`;
});
