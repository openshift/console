describe('k8s.k8sProbe', function () {
  'use strict';

  var k8sProbe;

  beforeEach(module('k8s'));
  beforeEach(inject(function (_k8sProbe_) {
    k8sProbe = _k8sProbe_;
  }));

  describe('#parseCmd', function () {
    describe('for tcpSocket', function () {
      it('returns port as number when string looks like number', function () {
        expect(k8sProbe.parseCmd('tcpSocket', '8080')).toEqual({port: 8080});
      });

      it('returns port as string when string does not look like number', function () {
        expect(k8sProbe.parseCmd('tcpSocket', 'http')).toEqual({port: 'http'});
      });
    });
  });

  describe('#flattenCmd', function () {
    describe('for tcpSocket', function () {
      it('casts port number to string', function () {
        expect(k8sProbe.flattenCmd('tcpSocket', {port: 8080})).toEqual('8080');
      });
    });
  });
});
