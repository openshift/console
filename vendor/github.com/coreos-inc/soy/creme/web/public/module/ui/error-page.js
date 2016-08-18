angular.module('creme.ui')
.directive('tecErrorPage', function() {
  'use strict';

  var defaultMsg = 'Error loading page';

  return {
    templateUrl: '/static/module/ui/error-page.html',
    restrict: 'E',
    scope: {
      message: '@',
    },
    link: function(scope) {
      if (!scope.message) {
        scope.message = defaultMsg;
      }
    },
  };

});
