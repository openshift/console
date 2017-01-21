import {k8s} from '../../module/k8s';

angular.module('bridge.page')
.controller('k8sListCtrl', function($scope, $location, $routeParams, $window, $route) {
  'use strict';

  let kind;

  const k8sKind = $route.current.$$route.k8sKind;
  if (k8sKind && k8sKind in k8s) {
    kind = k8s[k8sKind].kind;
  } else if ($routeParams.kind in k8s) {
    kind = k8s[$routeParams.kind].kind;
  } else {
    $scope.component = 'nop';
    $location.url('/404');
    return;
  }

  if (['daemonsets', 'configmaps', 'secrets', 'jobs', 'horizontalpodautoscalers', 'serviceaccounts', 'ingresses'].indexOf($routeParams.kind) === -1) {
    $scope.canCreate = true;
  } else {
    $scope.canCreate = false;
  }

  $scope.kind = kind;
  $scope.title = kind.labelPlural;
  $scope.component = `${kind.labelPlural.replace(/ /g, '')}Page`;
  $window.document.title = `Tectonic - ${kind.labelPlural}`;
});
