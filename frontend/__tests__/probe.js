import { parseCmd, flattenCmd } from '../public/module/k8s/probe';

describe('k8sProbe', function () {
  describe('#parseCmd', function () {
    describe('for tcpSocket', function () {
      it('returns port as number when string looks like number', function () {
        expect(parseCmd('tcpSocket', '8080')).toEqual({port: 8080});
      });

      it('returns port as string when string does not look like number', function () {
        expect(parseCmd('tcpSocket', 'http')).toEqual({port: 'http'});
      });
    });

    describe('for httpGet', function () {
      it('returns port as number when string looks like number', function () {
        expect(parseCmd('httpGet', 'http://localhost:8080/check'))
          .toEqual({ host: 'http://localhost', path: '/check', port: 8080 });
      });

      it('returns port as string when string does not look like number', function () {
        expect(parseCmd('httpGet', 'http://localhost:foo/check'))
          .toEqual({ host: 'http://localhost', path: '/check', port: 'foo' });
      });

      it('returns default port 80 when no port is specified', function () {
        expect(parseCmd('httpGet', 'http://localhost/check'))
          .toEqual({ host: 'http://localhost', path: '/check', port: 80 });
      });

      it('returns host as https when https is specified', function () {
        expect(parseCmd('httpGet', 'https://localhost:1234/check'))
          .toEqual({ host: 'https://localhost', path: '/check', port: 1234 });
      });

      it('returns correct port based on scheme', function () {
        expect(parseCmd('httpGet', 'https://localhost/check'))
          .toEqual({ host: 'https://localhost', path: '/check', port: 443 });
      });
    });
  });

  describe('#flattenCmd', function () {
    describe('for tcpSocket', function () {
      it('casts port number to string', function () {
        expect(flattenCmd('tcpSocket', {port: 8080})).toEqual('8080');
      });
    });
  });
});
