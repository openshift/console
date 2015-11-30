angular.module('bridge.filter')
.filter('ns', function(namespacesSvc) {
  return function(path) {
    return namespacesSvc.formatNamespaceRoute(path);
  };
});
