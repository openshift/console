import { URL } from 'url';

import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';

describe('getPrometheusURL()', () => {
  it('should build a Prometheus /api/v1/query URL', () => {
    const url = new URL(
      getPrometheusURL(
        {
          namespace: 'test-namespace',
          endpoint: PrometheusEndpoint.QUERY,
          query: 'test-query',
        },
        'https://mock.prometheus.com',
      ),
    );

    // Check that url contains all expected params, in no particular order
    expect(url.pathname).toBe('/api/v1/query');
    expect(url.searchParams.get('namespace')).toBe('test-namespace');
    expect(url.searchParams.get('query')).toBe('test-query');

    // Check that extra params are not present
    expect(url.searchParams.has('end')).toBeFalsy();
    expect(url.searchParams.has('start')).toBeFalsy();
    expect(url.searchParams.has('step')).toBeFalsy();
    expect(url.searchParams.has('timeout')).toBeFalsy();
  });

  it('should build a Prometheus /api/v1/query_range URL', () => {
    const url = new URL(
      getPrometheusURL(
        {
          endpoint: PrometheusEndpoint.QUERY_RANGE,
          endTime: 50000,
          namespace: 'test-namespace',
          query: 'test-query',
          samples: 10,
          timeout: '5s',
          timespan: 10000,
        },
        'https://mock.prometheus.com',
      ),
    );

    // Check that url contains all expected params, in no particular order
    expect(url.pathname).toBe('/api/v1/query_range');
    expect(url.searchParams.get('end')).toBe('50');
    expect(url.searchParams.get('start')).toBe('40');
    expect(url.searchParams.get('step')).toBe('1');
    expect(url.searchParams.get('namespace')).toBe('test-namespace');
    expect(url.searchParams.get('query')).toBe('test-query');
    expect(url.searchParams.get('timeout')).toBe('5s');
  });

  it('should build a Prometheus /api/v1/label URL', () => {
    const url = new URL(
      getPrometheusURL(
        {
          endpoint: PrometheusEndpoint.LABEL,
          namespace: 'test-namespace',
          query: 'test-query',
        },
        'https://mock.prometheus.com',
      ),
    );

    // Check that url contains all expected params, in no particular order
    expect(url.pathname).toBe('/api/v1/label');
    expect(url.searchParams.get('namespace')).toBe('test-namespace');
    expect(url.searchParams.get('query')).toBe('test-query');

    // Check that extra params are not present
    expect(url.searchParams.has('end')).toBeFalsy();
    expect(url.searchParams.has('start')).toBeFalsy();
    expect(url.searchParams.has('step')).toBeFalsy();
    expect(url.searchParams.has('timeout')).toBeFalsy();
  });
});
