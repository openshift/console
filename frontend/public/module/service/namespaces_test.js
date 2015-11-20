describe('bridge.service.namespacesSvc', function() {
  'use strict';
  var namespacesSvc;

  // Load the module.
  beforeEach(module('bridge.service'));
  beforeEach(inject(function(_namespacesSvc_) {
    namespacesSvc = _namespacesSvc_;
  }));

  describe('setActiveNamespace', function() {
    it('sets active namespace in memory and local storage', function() {
      var expected = 'test';
      namespacesSvc.setActiveNamespace(expected);

      expect(namespacesSvc.getActiveNamespace()).toEqual(expected);
      expect(localStorage.getItem('activeNamespace')).toEqual(expected);
      expect(!_.isUndefined(namespacesSvc.getActiveNamespace())).toBe(true);
    });
  });

  describe('clearActiveNamespace', function() {
    it('clears active namespace in memory and local storage', function() {
      namespacesSvc.setActiveNamespace('test');
      namespacesSvc.clearActiveNamespace();

      expect(_.isUndefined(namespacesSvc.getActiveNamespace())).toBe(true);
      expect(namespacesSvc.getActiveNamespace()).toEqual(undefined);
      expect(localStorage.getItem('activeNamespace')).toEqual(null);
    });
  });

  describe('namespaceResourceFromPath', function() {
    it('parses resource from path', function () {
      expect(namespacesSvc.namespaceResourceFromPath('/')).toEqual('');
      expect(namespacesSvc.namespaceResourceFromPath('/pods')).toEqual('pods');
      expect(namespacesSvc.namespaceResourceFromPath('ns/foo/pods')).toEqual('pods');
    });

    it('parses resources that contain a slash correctly', function() {
      expect(namespacesSvc.namespaceResourceFromPath('//')).toEqual('/');
      expect(namespacesSvc.namespaceResourceFromPath('/settings/users')).toEqual('settings/users');
      expect(namespacesSvc.namespaceResourceFromPath('ns/foo/don\'t/lets/start')).toEqual('don\'t/lets/start');
      expect(namespacesSvc.namespaceResourceFromPath('ns/foo//bar//baz')).toEqual('/bar//baz');
      expect(namespacesSvc.namespaceResourceFromPath('/all-namespaces/terminal/')).toEqual('terminal/');
    });

  });

  describe('formatNamespaceRoute', function() {
    it('formats a route correctly without an active namespace', function() {
      expect(namespacesSvc.formatNamespaceRoute('/bar')).toEqual('/all-namespaces/bar');
      expect(namespacesSvc.formatNamespaceRoute('/foo/bar/')).toEqual('/all-namespaces/foo/bar/');
    });

    it('formats a route with the current active namespace', function() {
      namespacesSvc.setActiveNamespace('test');

      expect(namespacesSvc.formatNamespaceRoute('/bar')).toEqual('/ns/test/bar');
      expect(namespacesSvc.formatNamespaceRoute('/foo/bar/')).toEqual('/ns/test/foo/bar/');
    });
  });
});
