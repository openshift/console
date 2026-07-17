import { act, renderHook } from '@testing-library/react';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { useOperatorLifecycle } from '../useOperatorLifecycle';

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetchJSON: jest.fn(),
}));
const mockCoFetchJSON = (coFetchJSON as unknown) as jest.Mock;

// Each test uses a unique packageName to avoid sharing module-level cache entries.
const CATALOG = 'redhat-operators';
const NS = 'openshift-marketplace';

describe('useOperatorLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data when fetch succeeds', async () => {
    const mockData = { lifecycleSchema: 'test', properties: '{}' };
    mockCoFetchJSON.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useOperatorLifecycle('pkg-success', CATALOG, NS));

    expect(result.current[1]).toBe(true); // loading initially

    await act(async () => {
      await Promise.resolve();
    });

    const [data, loading, error] = result.current;
    expect(data).toEqual(mockData);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('surfaces real network errors as errors', async () => {
    const networkError = new Error('Network failure');
    mockCoFetchJSON.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useOperatorLifecycle('pkg-network-error', CATALOG, NS));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const [data, loading, error] = result.current;
    expect(error).toBe(networkError);
    expect(data).toBeNull();
    expect(loading).toBe(false);
  });

  it('skips fetch when packageName is missing', () => {
    renderHook(() => useOperatorLifecycle(undefined, CATALOG, NS));

    expect(mockCoFetchJSON).not.toHaveBeenCalled();
    const [data, loading, error] = renderHook(() =>
      useOperatorLifecycle(undefined, CATALOG, NS),
    ).result.current;
    expect(data).toBeNull();
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('multiple callers sharing the same cache key all receive data from a single fetch', async () => {
    // Core deduplication invariant: N components for the same operator should never
    // issue more than one in-flight request.
    const sharedData = { lifecycleSchema: 'shared', properties: '{}' };
    mockCoFetchJSON.mockResolvedValueOnce(sharedData);

    const PKG = 'pkg-shared-dedup';

    // All three mount and subscribe to the same in-flight promise
    const { result: resultA } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));
    const { result: resultB } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));
    const { result: resultC } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(resultA.current[0]).toEqual(sharedData);
    expect(resultB.current[0]).toEqual(sharedData);
    expect(resultC.current[0]).toEqual(sharedData);
    // Only one fetch regardless of how many components share the key
    expect(mockCoFetchJSON).toHaveBeenCalledTimes(1);
  });

  it('a component mounting after the cache is populated serves data immediately without fetching', async () => {
    const cachedData = { lifecycleSchema: 'cached', properties: '{}' };
    mockCoFetchJSON.mockResolvedValueOnce(cachedData);

    const PKG = 'pkg-cache-hit';

    // First component populates the cache
    const { result: result1 } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result1.current[0]).toEqual(cachedData);
    expect(mockCoFetchJSON).toHaveBeenCalledTimes(1);

    // Second component — cache hit, no new fetch
    const { result: result2 } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));
    expect(result2.current[0]).toEqual(cachedData);
    expect(result2.current[1]).toBe(false); // not loading
    expect(result2.current[2]).toBeNull();
    expect(mockCoFetchJSON).toHaveBeenCalledTimes(1); // still just one fetch
  });
});
