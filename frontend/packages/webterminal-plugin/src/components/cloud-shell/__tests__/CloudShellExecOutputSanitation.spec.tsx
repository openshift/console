import { sanitizeURL } from '../CloudShellExec';

describe('sanitizeURL', () => {
  it('should remove username and password from URLs', () => {
    const input = 'https://user:pass@example.com/resource';
    const expected = 'https://example.com/resource';
    expect(sanitizeURL(input)).toBe(expected);
  });

  it('should leave URLs without credentials unchanged', () => {
    const input = 'https://example.com/resource';
    expect(sanitizeURL(input)).toBe(input);
  });

  it('should handle multiple occurrences of credentials in a string', () => {
    const input = 'https://user:pass@site1.com/path https://admin:1234@site2.com/resource';
    const expected = 'https://site1.com/path https://site2.com/resource';
    expect(sanitizeURL(input)).toBe(expected);
  });

  it('should handle missing username', () => {
    const input = 'https://:password@example.com/resource';
    const expected = 'https://example.com/resource';
    expect(sanitizeURL(input)).toBe(expected);
  });

  it('should handle missing password', () => {
    const input = 'https://username:@example.com/resource';
    const expected = 'https://example.com/resource';
    expect(sanitizeURL(input)).toBe(expected);
  });

  it('should handle missing username and password', () => {
    const input = 'https://@some.host/foo/bar';
    const expected = 'https://some.host/foo/bar';
    expect(sanitizeURL(input)).toBe(expected);
  });

  it('should handle IPv6 URLs with port numbers', () => {
    const input = 'https://[::1]:456';
    const expected = 'https://[::1]:456';
    expect(sanitizeURL(input)).toBe(expected);
  });

  it('should handle printenv output containing proxy URLs', () => {
    const input =
      'no_proxy=.cluster.local,.svc,.ap-south-1.compute.internal,localhost,172.30.0.1\n' +
      'https_proxy=http://username:password@hostname:3128/\n' +
      'NO_PROXY=.cluster.local,.svc,.ap-south-1.compute.internal,localhost,172.30.0.1\n' +
      'HTTPS_PROXY=http://username:password@hostname:3128/\n' +
      'HTTP_PROXY=http://username:password@hostname:3128/\n' +
      'http_proxy=http://username:password@hostname:3128/';
    const expected =
      'no_proxy=.cluster.local,.svc,.ap-south-1.compute.internal,localhost,172.30.0.1\n' +
      'https_proxy=http://hostname:3128/\n' +
      'NO_PROXY=.cluster.local,.svc,.ap-south-1.compute.internal,localhost,172.30.0.1\n' +
      'HTTPS_PROXY=http://hostname:3128/\n' +
      'HTTP_PROXY=http://hostname:3128/\n' +
      'http_proxy=http://hostname:3128/';
    expect(sanitizeURL(input)).toBe(expected);
  });

  it('should not modify non-URL text', () => {
    const input = 'This is a test string without URLs.';
    expect(sanitizeURL(input)).toBe(input);
  });
});
