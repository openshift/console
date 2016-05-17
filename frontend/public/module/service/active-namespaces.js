angular.module('bridge.service')
.provider('activeNamespaceSvc', function(CONST) {
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

  this.$get = function(_, $location, coLocalStorage, namespaceCacheSvc) {
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


    var isNamespaced = function(path) {
      return path.match(nsPathPattern) || path.match(allNsPathPattern);
    };

    return {
      setActiveNamespace: function(namespaceName) {
        var oldPath;

        if (!namespaceName) {
          activeNamespace = undefined;
          coLocalStorage.removeItem('activeNamespace');
        } else {
          activeNamespace = namespaceName.trim();
          coLocalStorage.setItem('activeNamespace', activeNamespace);
        }

        oldPath = $location.path();
        if (isNamespaced(oldPath)) {
          $location.path(this.formatNamespaceRoute(oldPath));
        }
      },

      getActiveNamespace: function() {
        return namespaceCacheSvc.get(activeNamespace);
      },

      isNamespaceActive: function(namespaceName) {
        var isAllActive = !namespaceName && !activeNamespace; // falsy namespace name means virtual "all" namespace
        return isAllActive || (activeNamespace === namespaceName);
      },

      formatNamespaceRoute: function(originalPath) {
        var namespacePrefix,
            resource = originalPath,
            active = this.getActiveNamespace();

        var match = isNamespaced(originalPath);
        if (match) {
          resource = prefixOf(match[1]);
        }

        while(resource[0] === '/') {
          resource = resource.substr(1);
        }

        if (!active) {
          namespacePrefix = '/all-namespaces/';
        } else {
          namespacePrefix = '/ns/' + active.metadata.name + '/';
        }

        return namespacePrefix + resource;
      }
    };
  }; // $get
});
