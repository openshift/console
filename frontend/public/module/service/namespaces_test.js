describe('bridge.service.namespacesSvc', function() {
  'use strict';
  var namespacesSvc, setPath, mockPath;

  beforeEach(module('bridge.const'));
  beforeEach(module('bridge.service'));

  beforeEach(module(function($provide) {
      $provide.value('$location', {
        path: function(newPath) {
          if (!_.isUndefined(newPath)) {
            setPath = newPath;
          }
          return mockPath;
        }
      });
  }));

  beforeEach(module(function(namespacesSvcProvider) {
    namespacesSvcProvider.clearPrefixes();
    namespacesSvcProvider.registerNamespaceFriendlyPrefix('pods');
  }));

  beforeEach(inject(function(_namespacesSvc_) {
    namespacesSvc = _namespacesSvc_;
  }));

  beforeEach(function() {
    setPath = '*UNSET*'
  });

  describe('setActiveNamespace', function() {
    it('sets active namespace in memory and local storage', function() {
      var expected = 'test';
      mockPath = '/not-a-namespaced-path';
      namespacesSvc.setActiveNamespace(expected);
      expect(setPath).toEqual('*UNSET*');

      expect(namespacesSvc.getActiveNamespace()).toEqual(expected);
      expect(localStorage.getItem('activeNamespace')).toEqual(expected);
      expect(!_.isUndefined(namespacesSvc.getActiveNamespace())).toBe(true);
    });

    it('clears active namespace in memory and local storage', function() {
      namespacesSvc.setActiveNamespace('test');
      namespacesSvc.setActiveNamespace(undefined);

      expect(_.isUndefined(namespacesSvc.getActiveNamespace())).toBe(true);
      expect(namespacesSvc.getActiveNamespace()).toEqual(undefined);
      expect(localStorage.getItem('activeNamespace')).toEqual(null);
    });

    it('should redirect namespaced location paths for known namespace-friendly prefixes', function() {
      mockPath = '/ns/floorwax/pods';
      namespacesSvc.setActiveNamespace('dessert-topping');
      expect(setPath).toEqual('/ns/dessert-topping/pods');
    });

    it('should redirect namespaced location paths to their prefixes', function() {
      mockPath = '/ns/floorwax/pods/new-shimmer';
      namespacesSvc.setActiveNamespace('dessert-topping');
      expect(setPath).toEqual('/ns/dessert-topping/pods');
    });

    it('should redirect to all if no namespaces is selected', function() {
      mockPath = '/ns/floorwax/pods';
      namespacesSvc.setActiveNamespace(null);
      expect(setPath).toEqual('/all-namespaces/pods');
    });

    it('should not redirect if the current path isn\'t namespaced', function() {
      mockPath = '/not-a-namespaced-path';
      namespacesSvc.setActiveNamespace('dessert-topping');
      expect(setPath).toEqual('*UNSET*');
    });
  });

  describe('formatNamespaceRoute', function() {
    it('formats a route correctly without an active namespace', function() {
      namespacesSvc.setActiveNamespace();
      expect(namespacesSvc.formatNamespaceRoute('/pods')).toEqual('/all-namespaces/pods');
      expect(namespacesSvc.formatNamespaceRoute('/pods/GRIBBL')).toEqual('/all-namespaces/pods/GRIBBL');
    });

    it('formats a route with the current active namespace', function() {
      namespacesSvc.setActiveNamespace('test');
      expect(namespacesSvc.formatNamespaceRoute('/pods')).toEqual('/ns/test/pods');
      expect(namespacesSvc.formatNamespaceRoute('/pods/GRIBBL')).toEqual('/ns/test/pods/GRIBBL');
    });

    it('parses resource from path', function () {
      namespacesSvc.setActiveNamespace();
      expect(namespacesSvc.formatNamespaceRoute('/')).toEqual('/all-namespaces/');
      expect(namespacesSvc.formatNamespaceRoute('/gribbl')).toEqual('/all-namespaces/gribbl');
      expect(namespacesSvc.formatNamespaceRoute('gribbl')).toEqual('/all-namespaces/gribbl');
      expect(namespacesSvc.formatNamespaceRoute('/pods')).toEqual('/all-namespaces/pods');
      expect(namespacesSvc.formatNamespaceRoute('ns/foo/pods')).toEqual('/all-namespaces/pods');
      expect(namespacesSvc.formatNamespaceRoute('ns/foo/pods/WACKY_SUFFIX')).toEqual('/all-namespaces/pods');
    });

    it('parses resources that contain a slash correctly', function() {
      namespacesSvc.setActiveNamespace();
      expect(namespacesSvc.formatNamespaceRoute('//')).toEqual('/all-namespaces/');
      expect(namespacesSvc.formatNamespaceRoute('/settings/users')).toEqual('/all-namespaces/settings/users');
      expect(namespacesSvc.formatNamespaceRoute('ns/foo/pods/don\'t/lets/start')).toEqual('/all-namespaces/pods');
      expect(namespacesSvc.formatNamespaceRoute('ns/foo/pods/bar//baz')).toEqual('/all-namespaces/pods');
      expect(namespacesSvc.formatNamespaceRoute('/all-namespaces/pods/terminal/')).toEqual('/all-namespaces/pods');
    });
  });
});
