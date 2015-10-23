describe('k8s.k8sNamespaces', function() {
  'use strict';
  var k8s;

  // Load the module.
  beforeEach(module('k8s'));
  beforeEach(inject(function(_k8s_) {
    k8s = _k8s_;
  }));

  describe('setActiveNamespace', function() {
    it('sets active namespace in memory and local storage', function() {
      var expected = 'test';
      k8s.namespaces.setActiveNamespace(expected);

      expect(k8s.namespaces.getActiveNamespace()).toEqual(expected);
      expect(localStorage.getItem('activeNamespace')).toEqual(expected);
      expect(!_.isUndefined(k8s.namespaces.getActiveNamespace())).toBe(true);
    });
  });

  describe('clearActiveNamespace', function() {
    it('clears active namespace in memory and local storage', function() {
      k8s.namespaces.setActiveNamespace('test');
      k8s.namespaces.clearActiveNamespace();

      expect(_.isUndefined(k8s.namespaces.getActiveNamespace())).toBe(true);
      expect(k8s.namespaces.getActiveNamespace()).toEqual(undefined);
      expect(localStorage.getItem('activeNamespace')).toEqual(null);
    });
  });

  describe('namespaceResourceFromPath', function() {
    it('parses resource from path', function () {
      expect(k8s.namespaces.namespaceResourceFromPath('/')).toEqual('');
      expect(k8s.namespaces.namespaceResourceFromPath('/pods')).toEqual('pods');
      expect(k8s.namespaces.namespaceResourceFromPath('ns/foo/pods')).toEqual('pods');
    });

    it('parses resources that contain a slash correctly', function() {
      expect(k8s.namespaces.namespaceResourceFromPath('//')).toEqual('/');
      expect(k8s.namespaces.namespaceResourceFromPath('/settings/users')).toEqual('settings/users');
      expect(k8s.namespaces.namespaceResourceFromPath('ns/foo/don\'t/lets/start')).toEqual('don\'t/lets/start');
      expect(k8s.namespaces.namespaceResourceFromPath('ns/foo//bar//baz')).toEqual('/bar//baz');
      expect(k8s.namespaces.namespaceResourceFromPath('/all-namespaces/terminal/')).toEqual('terminal/');
    });

  });

  describe('formatNamespaceRoute', function() {
    it('formats a route correctly without an active namespace', function() {
      expect(k8s.namespaces.formatNamespaceRoute('/bar')).toEqual('/all-namespaces/bar');
      expect(k8s.namespaces.formatNamespaceRoute('/foo/bar/')).toEqual('/all-namespaces/foo/bar/');
    });

    it('formats a route with the current active namespace', function() {
      k8s.namespaces.setActiveNamespace('test');

      expect(k8s.namespaces.formatNamespaceRoute('/bar')).toEqual('/ns/test/bar');
      expect(k8s.namespaces.formatNamespaceRoute('/foo/bar/')).toEqual('/ns/test/foo/bar/');
    });
  });
});
