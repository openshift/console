angular.module('bridge.ui')
.directive('coNamespacedHref', function(namespacesSvc) {
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var namespaced = namespacesSvc.formatNamespaceRoute(attrs.coNamespacedHref);
      element.attr('href', namespaced);
    }
  };
});
