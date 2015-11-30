angular.module('bridge.filter')
.filter('ns', function(namespacesSvc) {
  'use strict';
  return function(path) {
    return namespacesSvc.formatNamespaceRoute(path);
  };
});
