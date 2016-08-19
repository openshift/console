import { Control } from '@angular/common';
import { WizValidators } from './validators';

describe('WizValidators', function() {

  describe('nonempty', () => {
    let nonempty = WizValidators.nonempty;

    [
      'stuff',
      'more stuff',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] validates nonempty value: ${v}`, () => {
        expect(nonempty(c)).toBe(null);
      });
    });

    [
      '',
      ' ',
      '  ',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] fails for empty value: "${v}"`, () => {
        expect(nonempty(c)).not.toBe(null);
      });
    });

  });

  describe('url', () => {
    let url = WizValidators.url;

    [
      'http://123.456.789.100',
      'http://localhost',
      'http://localhost:80',
      'http://localhost:1234',
      'http://user:pwd@localhost',
      'http://user:pwd@localhost:80',
      'http://user:pwd@localhost:80/one',
      'http://user:pwd@localhost:80/one/two',
      'http://123.456.789.100',
      'https://localhost',
      'https://localhost:80',
      'https://localhost:1234',
      'https://user:pwd@localhost',
      'https://user:pwd@localhost:80',
      'https://user:pwd@localhost:80/one',
      'https://user:pwd@localhost:80/one/two',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] validates valid url: ${v}`, () => {
        expect(url(c)).toBe(null);
      });
    });

    [
      'localhost',
      'ftp://localhost',
      'http:localhost',
      'http//localhost',
      '//localhost',
      'http//localhost:abc',
      '',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] fails for invalid url: ${v}`, () => {
        expect(url(c)).not.toBe(null);
      });
    });

  });

  describe('k8sName', () => {
    let k8sName = WizValidators.k8sName;

    [
      // Up to 253 chars, dot separted every 63 chars.
      (new Array(64)).join('x'),
      [(new Array(64)).join('x'), (new Array(64)).join('y'), (new Array(64)).join('z')].join('.'),
      'alpha-enum.is-ok123',
      'a1-1-2.a-123',
    ].forEach((v, i) => {
      it(`[test: ${i}] is a valid k8s name: ${v}`, () => {
        let c = new Control(v);
        expect(k8sName(c)).toBe(null);
      });
    });

    [
      '',
      // more than 253 chars
      (new Array(255)).join('x'),
      // more than 63 chars in a segment
      [(new Array(65)).join('x'), (new Array(63)).join('y')].join('.'),
      'CAPITALLETTERS',
      'nonalphaenum&',
      'nonalphaenum*',
      'nonalphaenum#',
      'nonalphaenum!',
      'nonalphaenum_',
      // can't start with a dash
      '---',
      // can't end in a dot
      'abc.',
    ].forEach((v, i) => {
      it(`[test: ${i}] fails for invalid k8s name: ${v}`, () => {
        let c = new Control(v);
        expect(k8sName(c)).not.toBe(null);
      });
    });

  });

  describe('email', () => {
    let email = WizValidators.email;

    [
      'foo@bar.com',
      'a@b.io',
      'foo.bar@example.co.uk',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] validates valid email: ${v}`, () => {
        expect(email(c)).toBe(null);
      });
    });

    [
      '',
      'foo',
      'foo@',
      '@bar',
      '@bar.com',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] fails for invalid email: ${v}`, () => {
        expect(email(c)).not.toBe(null);
      });
    });

  });

  describe('psql', () => {
    let psql = WizValidators.psql;

    [
      'postgres://user:passwd@host:5432/dbname?some-option=yes',
      'postgres://user:passwd@some.host.com:5432/dbname?some-option=yes',
      'postgres://host:5432/dbname?some-option=yes',
      'postgres://host.com:5432/dbname?some-option=yes',
      'postgres://host:1234/dbname',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] validates valid psql DSN: ${v}`, () => {
        expect(psql(c)).toBe(null);
      });
    });

    [
      '',
      // missing scheme
      'user:passwd@host:5432/dbname',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] fails for invalid psql DSN: "${v}"`, () => {
        expect(psql(c)).not.toBe(null);
      });
    });

  });

  describe('certificate', () => {
    let certificate = WizValidators.certificate;

    [
      ['-----BEGIN CERTIFICATE-----', 'x', '-----END CERTIFICATE-----'].join('\n'),
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] validates valid certificate structure: "${v}"`, () => {
        expect(certificate(c)).toBe(null);
      });
    });

    [
      '',
      // missing end
      '-----BEGIN CERTIFICATE-----',
      // missing beginning
      '-----END CERTIFICATE-----',
      // no contents, too short
      ['-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----'].join('\n'),
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] fails for invalid certificate structure: "${v}"`, () => {
        expect(certificate(c)).not.toBe(null);
      });
    });

  });

  describe('privateKey', () => {
    let privateKey = WizValidators.privateKey;

    [
      ['-----BEGIN RSA PRIVATE KEY-----', 'x', '-----END RSA PRIVATE KEY-----'].join('\n'),
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] validates valid private key structure: "${v}"`, () => {
        expect(privateKey(c)).toBe(null);
      });
    });

    [
      '',
      // missing end
      '-----BEGIN RSA PRIVATE KEY-----',
      // missing beginning
      '-----END RSA PRIVATE KEY-----',
      // no contents
      ['-----BEGIN RSA PRIVATE KEY-----', '-----END RSA PRIVATE KEY-----'].join('\n'),
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] fails for invalid private key structure: "${v}"`, () => {
        expect(privateKey(c)).not.toBe(null);
      });
    });

  });

  describe('json', () => {
    let json = WizValidators.json;

    [
      JSON.stringify({ a: true, b: 1, c: 'asdf' })
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] validates valid json: "${v}"`, () => {
        expect(json(c)).toBe(null);
      });
    });

    [
      // trailing comma
      '{"a":true, "b":1,}',
    ].forEach((v, i) => {
      let c = new Control(v);
      it(`[test: ${i}] fails for invalid json: "${v}"`, () => {
        expect(json(c)).not.toBe(null);
      });
    });

  });

  describe('address', () => {
    let address = WizValidators.address;

    [
      '1.2.3.4:1234',
      'one.two.three.four:1234',
    ].forEach((v, i) => {
      it(`[test: ${i}] validates valid address: "${v}"`, () => {
        expect(address(new Control(v))).toEqual(null);
      });
    });

    [
      '1.2.3.4',
    ].forEach((v, i) => {
      it(`[test: ${i}] fails for invalid address: "${v}"`, () => {
        expect(address(new Control(v))).toEqual({
          address: 'A valid address in host:port format is required.'
        });
      });
    });

  });

});
