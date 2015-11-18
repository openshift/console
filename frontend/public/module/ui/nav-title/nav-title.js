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
      obj: '&'
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
