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

  this.$get = function(_, $location, coLocalStorage) {
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
      setActiveNamespace: function(newActiveNamespace) {
        // make it noop when new active namespace is the same
        // otherwise users will get page refresh and cry about
        // broken direct links and bookmarks
        if (newActiveNamespace === activeNamespace) {
          return;
        }

        if (!newActiveNamespace) {
          activeNamespace = undefined;
          coLocalStorage.removeItem('activeNamespace');
        } else {
          activeNamespace = newActiveNamespace.trim();
          coLocalStorage.setItem('activeNamespace', activeNamespace);
        }

        const oldPath = $location.path();
        if (isNamespaced(oldPath)) {
          $location.path(this.formatNamespaceRoute(oldPath));
        }
      },

      getActiveNamespace: function() {
        return activeNamespace;
      },

      isNamespaceActive: function(namespace) {
        return activeNamespace === namespace;
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
          namespacePrefix = 'all-namespaces/';
        } else {
          namespacePrefix = 'ns/' + active + '/';
        }

        return namespacePrefix + resource;
      }
    };
  }; // $get
});
