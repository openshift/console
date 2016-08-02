describe('k8s.k8sResource', function() {
  'use strict';
  var k8s;

  beforeEach(module('k8s'));

  beforeEach(inject(function($window) {
    $window.SERVER_FLAGS = {};
  }));

  beforeEach(inject(function(_k8s_) {
    k8s = _k8s_;
  }));


  describe('create', function() {
    it('automatically lowercases resource name', function () {
      var data = { metadata: { name: 'TEST' }, spec: { volumes: [] } };

      k8s.pods.create(data);
      // Since we're passing by reference we
      // can simply assert about the mutation of
      // the object here.
      expect(data.metadata.name).toEqual('test');
    });
  });
});
