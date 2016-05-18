describe('k8s', function() {
  'use strict';

  var k8sNodes;

  beforeEach(module('k8s'));
  beforeEach(inject(function(_k8sNodes_) {
    k8sNodes = _k8sNodes_;
  }));

  describe('#isTrusted', function() {
    it('returns false for falsy node', function () {
      expect(k8sNodes.isTrusted()).toEqual(false);
    });

    it('returns false for node without metadata', function () {
      expect(k8sNodes.isTrusted({})).toEqual(false);
    });

    it('returns false for node without annotations', function () {
      expect(k8sNodes.isTrusted({metadata: {}})).toEqual(false);
    });

    it('returns false for node without "com.coreos.tpm/untrusted" annotation', function () {
      expect(k8sNodes.isTrusted({metadata: {annotations: {}}})).toEqual(false);
    });

    it('returns false for node with malformed "com.coreos.tpm/untrusted" annotation', function () {
      expect(k8sNodes.isTrusted({metadata: {annotations: {'com.coreos.tpm/untrusted': 'Oops!'}}})).toEqual(false);
    });

    it('returns false when "com.coreos.tpm/untrusted" annotation is true', function () {
      expect(k8sNodes.isTrusted({metadata: {annotations: {'com.coreos.tpm/untrusted': 'true'}}})).toEqual(false);
    });

    it('returns true when "com.coreos.tpm/untrusted" annotation is false', function () {
      expect(k8sNodes.isTrusted({metadata: {annotations: {'com.coreos.tpm/untrusted': 'false'}}})).toEqual(true);
    });
  });
});
