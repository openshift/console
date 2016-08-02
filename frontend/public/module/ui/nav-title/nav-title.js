/**
 * Display page title with primary action link. If obj="" is included,
 * show a "View YAML" link on the right hand side of the element.
 */

angular.module('bridge.ui')
.directive('tecNavTitle', function(ModalLauncherSvc) {
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
      plural: '=',
    },
    controller: function ($scope) {
      $scope.klass = $scope.plural ? 'row co-m-nav-title__plural' : 'row co-m-nav-title';
      $scope.h1Klass = 'co-m-page-title';
      if ($scope.plural) {
        $scope.h1Klass += ' co-m-page-title--plural';
      }
    },
    link: function(scope) {
      scope.showYAML = function() {
        ModalLauncherSvc.open('show-yaml', {
          obj: scope.obj()
        });
      };
    }
  };
});
