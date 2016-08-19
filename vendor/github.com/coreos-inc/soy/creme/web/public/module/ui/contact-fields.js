angular.module('creme.ui')
.directive('tecContactFields', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/contact-fields.html',
    restrict: 'E',
    scope: {
      profile: '=',
      fieldClass: '@'
    }
  };

});
