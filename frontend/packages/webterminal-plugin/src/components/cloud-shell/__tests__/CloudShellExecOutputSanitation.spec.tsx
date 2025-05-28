import { k8sGetResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { extractProxyEnvVarsFromWorkspacePod, sanitizeURL } from '../CloudShellExec';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sGetResource: jest.fn(),
}));

describe('sanitizeURL', () => {
  it('should remove username and password from URLs', () => {
    // Given
    const input = 'https://user:pass@example.com/resource';
    const expected = 'https://example.com/resource';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'https://user:pass@example.com/resource' })).toBe(
      expected,
    );
  });

  it('should leave URLs without credentials unchanged', () => {
    // Given
    const input = 'https://example.com/resource';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'https://user:pass@example.com/resource' })).toBe(input);
  });

  it('should handle multiple occurrences of credentials in a string', () => {
    // Given
    const input = 'https://user:pass@site1.com/path https://admin:1234@site2.com/resource';
    const expected = 'https://site1.com/path https://admin:1234@site2.com/resource';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'https://user:pass@site1.com/path' })).toBe(expected);
  });

  it('should handle missing username', () => {
    // Given
    const input = 'https://:password@example.com/resource';
    const expected = 'https://example.com/resource';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'https://:password@example.com/resource' })).toBe(
      expected,
    );
  });

  it('should handle missing password', () => {
    // Given
    const input = 'https://username:@example.com/resource';
    const expected = 'https://example.com/resource';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'https://username:@example.com/resource' })).toBe(
      expected,
    );
  });

  it('should handle missing username and password', () => {
    // Given
    const input = 'https://@some.host/foo/bar';
    const expected = 'https://some.host/foo/bar';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'https://@some.host/foo/bar' })).toBe(expected);
  });

  it('should handle IPv6 URLs with port numbers', () => {
    // Given
    const input = 'https://[::1]:456';
    const expected = 'https://[::1]:456';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'https://[::1]:456' })).toBe(expected);
  });

  it('should handle printenv output containing proxy URLs', () => {
    // Given
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
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'http://username:password@hostname:3128/' })).toBe(
      expected,
    );
  });

  it('should not modify non-URL text', () => {
    // Given
    const input = 'This is a test string without URLs.';
    // When + Then
    expect(sanitizeURL(input, { httpProxy: 'http://username:password@hostname:3128/' })).toBe(
      input,
    );
  });
});

const k8sGetMocked = k8sGetResource as jest.Mock;

describe('extractProxyEnvVarsFromWorkspacePod', () => {
  beforeEach(() => {
    k8sGetMocked.mockClear();
  });

  afterEach(jest.resetAllMocks);

  it('should extract both Proxy environment variables from Pod env if present', async () => {
    // Given
    k8sGetMocked.mockReturnValueOnce({
      metadata: {
        name: 'test-pod',
        namespace: 'test-namespace',
      },
      spec: {
        containers: [
          {
            env: [
              { name: 'HTTP_PROXY', value: 'https://username:password@hostname:3128/' },
              { name: 'HTTPS_PROXY', value: 'https://username:password@hostname:3128/' },
            ],
          },
        ],
      },
    });
    // When
    const result = await extractProxyEnvVarsFromWorkspacePod('test-pod', 'test-namespace');
    // Then
    expect(result).toEqual({
      httpProxy: 'https://username:password@hostname:3128/',
      httpsProxy: 'https://username:password@hostname:3128/',
    });
  });

  it('should return empty object if Proxy environment variables absent', async () => {
    // Given
    k8sGetMocked.mockReturnValueOnce({
      metadata: {
        name: 'test-pod',
        namespace: 'test-namespace',
      },
      spec: {
        containers: [
          {
            env: [{ name: 'ENV_VAR_NAME', value: 'myval' }],
          },
        ],
      },
    });
    // When
    const result = await extractProxyEnvVarsFromWorkspacePod('test-pod', 'test-namespace');
    // Then
    expect(result).toEqual({
      httpProxy: null,
      httpsProxy: null,
    });
  });

  it('should return object with only HTTP_PROXY if Proxy environment variables present', async () => {
    // Given
    k8sGetMocked.mockReturnValueOnce({
      metadata: {
        name: 'test-pod',
        namespace: 'test-namespace',
      },
      spec: {
        containers: [
          {
            env: [{ name: 'HTTP_PROXY', value: 'http://hostname:3128/' }],
          },
        ],
      },
    });
    // When
    const result = await extractProxyEnvVarsFromWorkspacePod('test-pod', 'test-namespace');
    // Then
    expect(result).toEqual({
      httpProxy: 'http://hostname:3128/',
      httpsProxy: null,
    });
  });

  it('should return object with only HTTPS_PROXY if Proxy environment variables present', async () => {
    // Given
    k8sGetMocked.mockReturnValueOnce({
      metadata: {
        name: 'test-pod',
        namespace: 'test-namespace',
      },
      spec: {
        containers: [
          {
            env: [{ name: 'HTTPS_PROXY', value: 'https://hostname:3128/' }],
          },
        ],
      },
    });
    // When
    const result = await extractProxyEnvVarsFromWorkspacePod('test-pod', 'test-namespace');
    // Then
    expect(result).toEqual({
      httpProxy: null,
      httpsProxy: 'https://hostname:3128/',
    });
  });
});
