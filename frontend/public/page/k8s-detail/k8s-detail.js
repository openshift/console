angular.module('bridge.page')
.controller('k8sDetailCtrl', function($scope, $location, $routeParams, $window, k8s) {
  'use strict';
  $scope.name = $routeParams.name;
  let kind;
  if ($routeParams.kind in k8s) {
    kind = k8s[$routeParams.kind].kind;
  } else {
    $scope.component = 'nop';
    $location.url('/404');
    return;
  }

  $scope.kind = kind.id;
  $scope.component = kind.labelPlural.replace(/ /g, '') + 'DetailsPage';
  let view = $routeParams.view;
  if (view) {
    view = view.slice(0, 1).toUpperCase() + view.slice(1);
  }
  $window.document.title = `Tectonic - ${$scope.name} - ${view}`;
});
