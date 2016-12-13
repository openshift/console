import {getNamespacedRoute} from '../../../ui/ui-actions';

angular.module('bridge.ui')
.directive('coNamespacedHref', function() {
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var namespaced = getNamespacedRoute(attrs.coNamespacedHref);
      element.attr('href', namespaced);
    }
  };
});
