angular.module('bridge.filter')
.filter('ns', function(namespacesSvc) {
  'use strict';
  var ret = function(path) {
    return namespacesSvc.formatNamespaceRoute(path);
  };
  ret.$stateful = true;

  return ret;
});
