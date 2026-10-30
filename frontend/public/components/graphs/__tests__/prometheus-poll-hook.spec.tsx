import { act, renderHook, waitFor } from '@testing-library/react';
import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { getPodInventoryQuery } from '@console/shared/src/components/dashboard/inventory-card/prometheus-utils';
import { useSafeFetch } from '../../utils/safe-fetch-hook';
import { usePrometheusPoll } from '../prometheus-poll-hook';

jest.mock('../../utils/safe-fetch-hook', () => ({ useSafeFetch: jest.fn() }));
const fetchURL = jest.fn();
const data = { status: 'success', data: { resultType: 'vector', result: [] } };
const longQuery = getPodInventoryQuery(
  undefined,
  'worker',
  Array.from({ length: 100 }, (_, i) => `uid-${i}`),
);
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSafeFetch).mockReturnValue(fetchURL);
  fetchURL.mockResolvedValue(data);
});
it('retains GET requests for short instant queries', async () => {
  const { result } = renderHook(() =>
    usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY, query: 'up', delay: 0 }),
  );
  await waitFor(() => expect(result.current[0]).toEqual(data));
  const [url, options] = fetchURL.mock.calls[0];
  expect(url).toContain('query=up');
  expect(options.method).toBeUndefined();
  expect(options.body).toBeUndefined();
});
it('sends bounded node selectors as a form body rather than a large URL', async () => {
  renderHook(() =>
    usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY, query: longQuery, delay: 0 }),
  );
  await waitFor(() => expect(fetchURL).toHaveBeenCalledTimes(1));
  const [url, options] = fetchURL.mock.calls[0];
  expect(url.length).toBeLessThan(2048);
  expect(options.method).toBe('POST');
  expect(options.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
  expect(new URLSearchParams(options.body).get('query')).toBe(longQuery);
});
it('keeps namespace authorization on the URL when posting a query', async () => {
  renderHook(() =>
    usePrometheusPoll({
      endpoint: PrometheusEndpoint.QUERY,
      query: longQuery,
      namespace: 'example',
      delay: 0,
    }),
  );
  await waitFor(() => expect(fetchURL).toHaveBeenCalledTimes(1));
  const [url, options] = fetchURL.mock.calls[0];
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  expect(params.get('namespace')).toBe('example');
  expect(params.has('query')).toBe(false);
  expect(options.method).toBe('POST');
});
it('resets results when only the namespace changes', async () => {
  let resolve: (value: typeof data) => void;
  const { result, rerender } = renderHook(
    ({ namespace }) =>
      usePrometheusPoll({
        endpoint: PrometheusEndpoint.QUERY,
        query: 'up',
        namespace,
        delay: 0,
      }),
    { initialProps: { namespace: 'first' } },
  );
  await waitFor(() => expect(result.current[0]).toEqual(data));
  fetchURL.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  rerender({ namespace: 'second' });
  expect(result.current).toEqual([undefined, undefined, true]);
  expect(fetchURL.mock.calls[1][0]).toContain('namespace=second');
  await act(async () => {
    resolve(data);
  });
});
it('does not fetch an empty query', async () => {
  const { result } = renderHook(() =>
    usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY, query: '', delay: 0 }),
  );
  expect(fetchURL).not.toHaveBeenCalled();
  expect(result.current).toEqual([undefined, undefined, false]);
});

it('preserves GET behavior for custom data sources', async () => {
  renderHook(() =>
    usePrometheusPoll({
      endpoint: PrometheusEndpoint.QUERY,
      query: longQuery,
      delay: 0,
      customDataSource: { basePath: 'api/custom-monitoring', dataSourceType: 'prometheus' },
    }),
  );
  await waitFor(() => expect(fetchURL).toHaveBeenCalledTimes(1));
  const [url, options] = fetchURL.mock.calls[0];
  expect(url).toContain('api/custom-monitoring/api/v1/query?query=');
  expect(options.method).toBeUndefined();
  expect(options.body).toBeUndefined();
});

it('keeps a live range stable across renders while advancing its window on each poll', async () => {
  jest.useFakeTimers();
  let now = 1700000000000;
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now++);
  try {
    const { result, rerender, unmount } = renderHook(() =>
      usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY_RANGE, query: 'up', delay: 15000 }),
    );
    await waitFor(() => expect(result.current[0]).toEqual(data));
    expect(result.current[0]).toEqual(data);
    expect(fetchURL).toHaveBeenCalledTimes(1);
    const first = new URLSearchParams(fetchURL.mock.calls[0][0].split('?')[1]);
    now += 15000;
    rerender();
    expect(fetchURL).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });
    expect(fetchURL).toHaveBeenCalledTimes(2);
    const second = new URLSearchParams(fetchURL.mock.calls[1][0].split('?')[1]);
    expect(Number(second.get('end'))).toBeGreaterThan(Number(first.get('end')));
    expect(result.current[2]).toBe(false);
    unmount();
  } finally {
    clock.mockRestore();
    jest.useRealTimers();
  }
});
it('does not refetch a one-shot live range when its response triggers a render', async () => {
  let now = 1700000000000;
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now++);
  try {
    const { result, rerender } = renderHook(() =>
      usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY_RANGE, query: 'up', delay: 0 }),
    );
    await waitFor(() => expect(result.current[0]).toEqual(data));
    rerender();
    expect(fetchURL).toHaveBeenCalledTimes(1);
  } finally {
    clock.mockRestore();
  }
});
it('keeps explicitly historical ranges fixed while polling', async () => {
  jest.useFakeTimers();
  try {
    const { result, unmount } = renderHook(() =>
      usePrometheusPoll({
        endpoint: PrometheusEndpoint.QUERY_RANGE,
        query: 'up',
        endTime: 1700000000000,
        delay: 15000,
      }),
    );
    await waitFor(() => expect(result.current[0]).toEqual(data));
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });
    expect(fetchURL).toHaveBeenCalledTimes(2);
    expect(fetchURL.mock.calls[1][0]).toBe(fetchURL.mock.calls[0][0]);
    unmount();
  } finally {
    jest.useRealTimers();
  }
});
