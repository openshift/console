/**
 * HTML5 autofocus property can be finicky when it comes to dynamically
 * loaded templates and such with AngularJS.
 *
 * Usage:
 * <input type="text" autofocus>
 */
angular.module('app.ui', [])

.directive('autofocus', function($timeout) {
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, elem) {
      $timeout(function() {
        elem[0].focus();
      });
    }
  };
});
