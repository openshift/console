describe('bridge.service.activeNamespaceSvc', function() {
  'use strict';
  var activeNamespaceSvc, setPath, mockPath;

  beforeEach(module('bridge.service'));
  beforeEach(module('bridge.react-wrapper'));

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

  beforeEach(module(function(activeNamespaceSvcProvider) {
    activeNamespaceSvcProvider.clearPrefixes();
    activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('pods');
  }));

  beforeEach(inject(function(_activeNamespaceSvc_) {
    activeNamespaceSvc = _activeNamespaceSvc_;
  }));

  beforeEach(function() {
    setPath = '*UNSET*';
  });

  describe('setActiveNamespace', function() {
    it('sets active namespace in memory and local storage', function() {
      var expected = 'test';
      mockPath = '/not-a-namespaced-path';
      activeNamespaceSvc.setActiveNamespace(expected);
      expect(setPath).toEqual('*UNSET*');

      expect(activeNamespaceSvc.getActiveNamespace()).toEqual(expected);
      expect(localStorage.getItem('activeNamespace')).toEqual(expected);
      expect(!_.isUndefined(activeNamespaceSvc.getActiveNamespace())).toBe(true);
    });

    it('clears active namespace in memory and local storage', function() {
      activeNamespaceSvc.setActiveNamespace('test');
      activeNamespaceSvc.setActiveNamespace(undefined);

      expect(_.isUndefined(activeNamespaceSvc.getActiveNamespace())).toBe(true);
      expect(activeNamespaceSvc.getActiveNamespace()).toEqual(undefined);
      expect(localStorage.getItem('activeNamespace')).toEqual(null);
    });

    it('should redirect namespaced location paths for known namespace-friendly prefixes', function() {
      mockPath = '/ns/floorwax/pods';
      activeNamespaceSvc.setActiveNamespace('dessert-topping');
      expect(setPath).toEqual('ns/dessert-topping/pods');
    });

    it('should redirect namespaced location paths to their prefixes', function() {
      mockPath = '/ns/floorwax/pods/new-shimmer';
      activeNamespaceSvc.setActiveNamespace(); // reset active namespace
      activeNamespaceSvc.setActiveNamespace('dessert-topping');
      expect(setPath).toEqual('ns/dessert-topping/pods');
    });

    it('should redirect to all if no namespaces is selected', function() {
      mockPath = '/ns/floorwax/pods';
      activeNamespaceSvc.setActiveNamespace(null);
      expect(setPath).toEqual('all-namespaces/pods');
    });

    it('should not redirect if the current path isn\'t namespaced', function() {
      mockPath = '/not-a-namespaced-path';
      activeNamespaceSvc.setActiveNamespace('dessert-topping');
      expect(setPath).toEqual('*UNSET*');
    });
  });

  describe('formatNamespaceRoute', function() {
    it('formats a route correctly without an active namespace', function() {
      activeNamespaceSvc.setActiveNamespace();
      expect(activeNamespaceSvc.formatNamespaceRoute('/pods')).toEqual('all-namespaces/pods');
      expect(activeNamespaceSvc.formatNamespaceRoute('/pods/GRIBBL')).toEqual('all-namespaces/pods/GRIBBL');
    });

    it('formats a route with the current active namespace', function() {
      activeNamespaceSvc.setActiveNamespace('test');
      expect(activeNamespaceSvc.formatNamespaceRoute('/pods')).toEqual('ns/test/pods');
      expect(activeNamespaceSvc.formatNamespaceRoute('/pods/GRIBBL')).toEqual('ns/test/pods/GRIBBL');
    });

    it('parses resource from path', function () {
      activeNamespaceSvc.setActiveNamespace();
      expect(activeNamespaceSvc.formatNamespaceRoute('/')).toEqual('all-namespaces/');
      expect(activeNamespaceSvc.formatNamespaceRoute('/gribbl')).toEqual('all-namespaces/gribbl');
      expect(activeNamespaceSvc.formatNamespaceRoute('gribbl')).toEqual('all-namespaces/gribbl');
      expect(activeNamespaceSvc.formatNamespaceRoute('/pods')).toEqual('all-namespaces/pods');
      expect(activeNamespaceSvc.formatNamespaceRoute('ns/foo/pods')).toEqual('all-namespaces/pods');
      expect(activeNamespaceSvc.formatNamespaceRoute('ns/foo/pods/WACKY_SUFFIX')).toEqual('all-namespaces/pods');
    });

    it('parses resources that contain a slash correctly', function() {
      activeNamespaceSvc.setActiveNamespace();
      expect(activeNamespaceSvc.formatNamespaceRoute('//')).toEqual('all-namespaces/');
      expect(activeNamespaceSvc.formatNamespaceRoute('/settings/users')).toEqual('all-namespaces/settings/users');
      expect(activeNamespaceSvc.formatNamespaceRoute('ns/foo/pods/don\'t/lets/start')).toEqual('all-namespaces/pods');
      expect(activeNamespaceSvc.formatNamespaceRoute('ns/foo/pods/bar//baz')).toEqual('all-namespaces/pods');
      expect(activeNamespaceSvc.formatNamespaceRoute('all-namespaces/pods/terminal/')).toEqual('all-namespaces/pods');
    });
  });
});
