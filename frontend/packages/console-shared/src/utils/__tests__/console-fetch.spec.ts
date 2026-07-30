import { RetryError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import {
  unescapeGoUnicode,
  isK8sUrl,
  validateStatus,
} from '@console/shared/src/utils/console-fetch-utils';
import { coFetch } from '../console-fetch';

describe('unescapeGoUnicode', () => {
  it('should unescape 4-digit Go unicode escapes', () => {
    expect(unescapeGoUnicode('\\ue00f')).toBe('\ue00f');
    expect(unescapeGoUnicode('\\ue4c8')).toBe('\ue4c8');
  });

  it('should unescape 8-digit Go unicode escapes for supplementary plane characters', () => {
    expect(unescapeGoUnicode('\\U0002ebf0')).toBe(String.fromCodePoint(0x2ebf0));
    expect(unescapeGoUnicode('\\U0002ebf1')).toBe(String.fromCodePoint(0x2ebf1));
  });

  it('should unescape mixed content with normal text and escapes', () => {
    const input = 'a啊阿沸犯跃kg\\ue00f\\ue010\\ue011\\ue4c8丙乩h妖哪匸与f去\\U0002ebf0\\U0002ebf1';
    const expected = `a啊阿沸犯跃kg\ue00f\ue010\ue011\ue4c8丙乩h妖哪匸与f去${String.fromCodePoint(
      0x2ebf0,
    )}${String.fromCodePoint(0x2ebf1)}`;
    expect(unescapeGoUnicode(input)).toBe(expected);
  });

  it('should not throw on out-of-range 8-digit escape sequences', () => {
    expect(unescapeGoUnicode('\\UFFFFFFFF')).toBe('\\UFFFFFFFF');
  });
});

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
    expect(isK8sUrl('/api/kubernetes/api/v1/pods')).toEqual(true);
  });

  it('respects basePath and logs out users who get a 401 from k8s', () => {
    const originalBasePath = window.SERVER_FLAGS.basePath;
    window.SERVER_FLAGS.basePath = '/blah/';
    expect(isK8sUrl('/blah/api/kubernetes/api/v1/pods')).toEqual(true);
    window.SERVER_FLAGS.basePath = originalBasePath;
  });

  it('does not log out users who get a 401 from chargeback', () => {
    expect(
      isK8sUrl('/api/kubernetes/api/v1/namespaces/prd354/services/chargeback/proxy/api'),
    ).toEqual(false);
  });

  it('does not log out users who get a 401 from graphs', () => {
    expect(
      isK8sUrl(
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
    window.fetch = jest.fn(() =>
      Promise.resolve({ status: 404, headers: emptyHeaders } as Response),
    );
    try {
      await coFetch('');
    } catch {
      // ignore
    }
    expect(window.fetch).toHaveBeenCalledTimes(1);

    (window.fetch as jest.Mock).mockClear();
    window.fetch = jest.fn(() =>
      Promise.resolve({ status: 429, headers: emptyHeaders } as Response),
    );
    try {
      await coFetch('');
    } catch {
      // ignore
    }
    expect(window.fetch).toHaveBeenCalledTimes(3);

    (window.fetch as jest.Mock).mockClear();
    window.fetch = jest.fn(() => Promise.resolve({ status: 409, json, headers } as Response));
    try {
      await coFetch('', { method: 'POST' });
    } catch {
      // ignore
    }
    expect(window.fetch).toHaveBeenCalledTimes(3);
  });
});
