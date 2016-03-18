angular.module('bridge.service')
.provider('namespacesSvc', function(CONST) {
  'use strict';

  // This module supports users viewing resources based on namespace,
  // *not* their creation, deletion, editing of namespaces themselves.
  // That is, this is namespaces as part of the interface, not as the
  // object of the interface.

  var nsPathPattern = new RegExp('^\/?ns\/' + CONST.legalNamePattern.source + '\/?(.*)$');
  var allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;
  var prefixes = [];

  // Most namespaced urls can't move from one namespace to another,
  // but happen to have prefixes that can - for example:
  //
  //   /ns/NS1/pods/MY_POD
  //
  // MY_POD is in general only associated with ns1, but /ns/$$/pods
  // is valid for all values of $$
  //
  // Only paths with registered namespace friendly prefixes can be
  // re-namespaced, so register your prefixes here as you define the
  // associated routes.
  this.registerNamespaceFriendlyPrefix = function(s) {
    prefixes.push(s);
  };

  this.clearPrefixes = function() {
    prefixes = [];
  };

  this.$get = function(_, coLocalStorage) {
    var activeNamespace = coLocalStorage.getItem('activeNamespace') || undefined;
    var prefixOf = function(s) {
      var ret = _.find(prefixes, function(prefix) {
        return s.indexOf(prefix) === 0;
      });

      if (!ret) {
        throw new Error('path can\'t be namespaced: ' + s);
      }

      return ret;
    };

    return {
      setActiveNamespace: function(namespace) {
        if (_.isUndefined(namespace)) {
          return;
        }

        namespace = namespace.trim();
        activeNamespace = namespace;
        coLocalStorage.setItem('activeNamespace', namespace);
      },

      getActiveNamespace: function() {
        return activeNamespace;
      },

      clearActiveNamespace: function() {
        activeNamespace = undefined;
        coLocalStorage.removeItem('activeNamespace');
      },

      isNamespaced: function(path) {
        return path.match(nsPathPattern) || path.match(allNsPathPattern);
      },

      formatNamespaceRoute: function(originalPath) {
        var resource = this.namespaceResourceFromPath(originalPath),
            namespacePrefix;

        if (!activeNamespace) {
          namespacePrefix = '/all-namespaces/';
        } else {
          namespacePrefix = '/ns/' + activeNamespace + '/';
        }

        return namespacePrefix + resource;
      },

      namespaceResourceFromPath: function(path) {
        var match = this.isNamespaced(path);
        if (match) {
          return prefixOf(match[1]);
        }

        if (path[0] === '/') {
          return path.substr(1);
        }

        return path;
      }
    };
  }; // $get
});
