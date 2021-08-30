import { RetryError } from '../../error/http-error';
import { consoleFetch } from '../console-fetch';
import { shouldLogout, validateStatus } from '../console-fetch-utils';

describe('consoleFetch', () => {
  const json = async () => ({
    details: {
      kind: 'clusterresourcequotas',
    },
  });
  const emptyHeaders = new Headers();
  const headers = new Headers();
  headers.set('content-type', 'application/json');

  it('logs out users who get a 401 from k8s', () => {
    expect(shouldLogout('/api/kubernetes/api/v1/pods')).toEqual(true);
  });

  it('respects basePath and logs out users who get a 401 from k8s', () => {
    const originalBasePath = window.SERVER_FLAGS.basePath;
    window.SERVER_FLAGS.basePath = '/blah/';
    expect(shouldLogout('/blah/api/kubernetes/api/v1/pods')).toEqual(true);
    window.SERVER_FLAGS.basePath = originalBasePath;
  });

  it('does not log out users who get a 401 from chargeback', () => {
    expect(
      shouldLogout('/api/kubernetes/api/v1/namespaces/prd354/services/chargeback/proxy/api'),
    ).toEqual(false);
  });

  it('does not log out users who get a 401 from graphs', () => {
    expect(
      shouldLogout(
        '/api/kubernetes/api/v1/proxy/namespaces/tectonic-system/services/prometheus:9090/api/v1/query?query=100%20-%20(sum(rate(node_cpu%7Bjob%3D%22node-exporter%22%2Cmode%3D%22idle%22%7D%5B2m%5D))%20%2F%20count(node_cpu%7Bjob%3D%22node-exporter%22%2C%20mode%3D%22idle%22%7D))%20*%20100',
      ),
    ).toEqual(false);
  });

  it('should throw RetryError', async () => {
    await expect(
      validateStatus({ status: 409, json, headers } as Response, '', 'GET', true),
    ).rejects.not.toBeInstanceOf(RetryError);
    await expect(
      validateStatus({ status: 409, json, headers } as Response, '', 'POST', true),
    ).rejects.toBeInstanceOf(RetryError);
    await expect(
      validateStatus(
        {
          status: 409,
          json: async () => ({ details: { kind: 'resourcequotas' } }),
          headers,
        } as Response,
        '',
        'POST',
        true,
      ),
    ).rejects.toBeInstanceOf(RetryError);
    await expect(
      validateStatus(
        { status: 409, json: async () => ({}), headers } as Response,
        '',
        'POST',
        true,
      ),
    ).rejects.not.toBeInstanceOf(RetryError);
    await expect(
      validateStatus({ status: 409, json, headers } as Response, '', 'POST', false),
    ).rejects.not.toBeInstanceOf(RetryError);
    await expect(
      validateStatus({ status: 429, headers: emptyHeaders } as Response, '', 'POST', true),
    ).rejects.toBeInstanceOf(RetryError);
    await expect(
      validateStatus({ status: 429, headers: emptyHeaders } as Response, '', 'POST', false),
    ).rejects.not.toBeInstanceOf(RetryError);
  });

  it('should retry up to 3 times when RetryError is thrown', async () => {
    window.fetch = jest.fn(() => Promise.resolve({ status: 404, headers: emptyHeaders }));

    try {
      await consoleFetch('');
    } catch {
      // ignore
    }
    expect(window.fetch).toHaveBeenCalledTimes(1);

    (window.fetch as jest.Mock).mockClear();
    window.fetch = jest.fn(() => Promise.resolve({ status: 429, headers: emptyHeaders }));
    try {
      await consoleFetch('');
    } catch {
      // ignore
    }
    expect(window.fetch).toHaveBeenCalledTimes(3);

    (window.fetch as jest.Mock).mockClear();
    window.fetch = jest.fn(() => Promise.resolve({ status: 409, json, headers }));
    try {
      await consoleFetch('', { method: 'POST' });
    } catch {
      // ignore
    }
    expect(window.fetch).toHaveBeenCalledTimes(3);
  });
});
