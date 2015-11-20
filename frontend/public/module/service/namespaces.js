angular.module('bridge.service')
.service('namespacesSvc', function(_, coLocalStorage) {
  'use strict';

  var nsPathPattern = /^\/?ns\/[^\/]*\/?(.*)$/;
  var allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;
  var activeNamespace = coLocalStorage.getItem('activeNamespace') || undefined;

  this.setActiveNamespace = function(namespace) {
    if (_.isUndefined(namespace)) {
      return;
    }

    namespace = namespace.trim();
    activeNamespace = namespace;
    coLocalStorage.setItem('activeNamespace', namespace);
  };

  this.getActiveNamespace = function() {
    return activeNamespace;
  };

  this.clearActiveNamespace = function() {
    activeNamespace = undefined;
    coLocalStorage.removeItem('activeNamespace');
  };

  this.formatNamespaceRoute = function(originalPath) {
    var resource = this.namespaceResourceFromPath(originalPath),
        namespace = activeNamespace,
        namespacePrefix;

    if (_.isUndefined(namespace)) {
      namespacePrefix = '/all-namespaces/';
    } else {
      namespacePrefix = '/ns/' + namespace + '/';
    }

    return namespacePrefix + resource;
  };

  this.namespaceResourceFromPath = function(path) {
    var match = path.match(nsPathPattern);
    if (match) {
      return match[1];
    }

    match = path.match(allNsPathPattern);
    if (match) {
      return match[1];
    }

    if (path[0] === '/') {
      return path.substr(1);
    }

    return path;
  };

});
