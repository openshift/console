angular.module('k8s')
.service('k8sNamespaces', function(_, coLocalStorage) {
  'use strict';

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
    var parts = _.compact(path.split('/'));
    return _.last(parts) || '';
  };

});
