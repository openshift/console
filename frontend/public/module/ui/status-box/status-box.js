/**
 * Convenience wrapper for status message boxes that inform user of errors or empty state, etc.
 * The first child element gets a "title" class added to it, all other immediate children get a "detail" class.
 */
angular.module('bridge.ui')
.directive('cosStatusBox', function() {
  'use strict';

  return {
    template: '<div class="cos-status-box" ng-cloak ng-transclude></div>',
    transclude: true,
    restrict: 'EA',
    replace: true,
    link: function(scope, elem) {
      angular.forEach(elem.children(), function(el, i) {
        if (i === 0) {
          angular.element(el).addClass('cos-status-box__title');
        } else {
          angular.element(el).addClass('cos-status-box__detail');
        }
      });
    }
  };

});
