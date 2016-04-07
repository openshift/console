angular.module('bridge.ui')
.directive('coNamespacedHref', function(activeNamespaceSvc) {
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var namespaced = activeNamespaceSvc.formatNamespaceRoute(attrs.coNamespacedHref);
      element.attr('href', namespaced);
    }
  };
});
