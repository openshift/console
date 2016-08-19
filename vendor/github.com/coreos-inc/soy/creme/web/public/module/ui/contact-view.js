angular.module('creme.ui').directive('tecContactView', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/contact-view.html',
    restrict: 'E',
    scope: {
      profile: '=',
    },
  };
});
