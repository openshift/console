/**
 * Display page title with primary action link.
 */

angular.module('bridge.ui')
.directive('tecNavTitle', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/nav-title/nav-title.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      title: '@',
      obj: '&',
      kind: '=',
      detail: '=',
    },
    controller: function ($scope) {
      $scope.klass = $scope.detail ? 'row co-m-nav-title__detail' : 'row co-m-nav-title';
      $scope.h1Klass = 'co-m-page-title';
      if ($scope.detail) {
        $scope.h1Klass += ' co-m-page-title--detail';
      }
    },
  };
});
