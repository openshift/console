import { parseCmd, flattenCmd } from '../../module/k8s/probe';

describe('k8sProbe', () => {
  describe('#parseCmd', () => {
    describe('for tcpSocket', () => {
      it('returns port as number when string looks like number', () => {
        expect(parseCmd('tcpSocket', '8080')).toEqual({ port: 8080 });
      });

      it('returns port as string when string does not look like number', () => {
        expect(parseCmd('tcpSocket', 'http')).toEqual({ port: 'http' });
      });
    });

    describe('for httpGet', () => {
      it('returns port as number when string looks like number', () => {
        expect(parseCmd('httpGet', 'http://localhost:8080/check')).toEqual({
          host: 'http://localhost',
          path: '/check',
          port: 8080,
        });
      });

      it('returns port as string when string does not look like number', () => {
        expect(parseCmd('httpGet', 'http://localhost:foo/check')).toEqual({
          host: 'http://localhost',
          path: '/check',
          port: 'foo',
        });
      });

      it('returns default port 80 when no port is specified', () => {
        expect(parseCmd('httpGet', 'http://localhost/check')).toEqual({
          host: 'http://localhost',
          path: '/check',
          port: 80,
        });
      });

      it('returns host as https when https is specified', () => {
        expect(parseCmd('httpGet', 'https://localhost:1234/check')).toEqual({
          host: 'https://localhost',
          path: '/check',
          port: 1234,
        });
      });

      it('returns correct port based on scheme', () => {
        expect(parseCmd('httpGet', 'https://localhost/check')).toEqual({
          host: 'https://localhost',
          path: '/check',
          port: 443,
        });
      });
    });

    describe('for grpc', () => {
      it('returns port and service', () => {
        expect(parseCmd('grpc', '5000:my-service')).toEqual({ port: 5000, service: 'my-service' });
      });

      it('returns port only when no service specified', () => {
        expect(parseCmd('grpc', '5000')).toEqual({ port: 5000 });
      });

      it('returns null for empty string', () => {
        expect(parseCmd('grpc', '')).toBeNull();
      });
    });
  });

  describe('#flattenCmd', () => {
    describe('for tcpSocket', () => {
      it('casts port number to string', () => {
        expect(flattenCmd('tcpSocket', { port: 8080 })).toEqual('8080');
      });
    });

    describe('for grpc', () => {
      it('returns port as string', () => {
        expect(flattenCmd('grpc', { port: 5000 })).toEqual('5000');
      });

      it('returns port with service when service is specified', () => {
        expect(flattenCmd('grpc', { port: 5000, service: 'my-service' })).toEqual(
          '5000 (my-service)',
        );
      });

      it('returns empty string when port is missing', () => {
        expect(flattenCmd('grpc', {})).toEqual('');
      });
    });
  });
});
