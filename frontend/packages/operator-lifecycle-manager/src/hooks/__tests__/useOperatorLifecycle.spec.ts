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

  it('does not surface AbortError as a real error', async () => {
    // The bug: fetchLifecycleData re-throws AbortErrors after clearing the cache.
    // The hook's .catch only checked !controller.signal.aborted — if the signal was
    // never explicitly aborted (e.g., AbortError came from an old cached promise's
    // signal), the error was incorrectly set in state.
    //
    // The fix: also guard on err.name !== 'AbortError' so abort-flavored errors
    // are never surfaced regardless of which signal triggered them.
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    mockCoFetchJSON.mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useOperatorLifecycle('pkg-abort', CATALOG, NS));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve(); // allow rejection microtask to settle
    });

    const [data, loading, error] = result.current;
    expect(error).toBeNull(); // AbortError must not surface as a real error
    expect(data).toBeNull();
    expect(loading).toBe(false);
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

  it('retries with a fresh request when the cached in-flight promise was aborted by another caller', async () => {
    // Fix B scenario: two hook instances share the same cache key.
    // Hook A starts the fetch (P1 enters cache). Hook B arrives and gets P1 from cache.
    // Hook A is then aborted — P1 rejects with AbortError.
    // Fix B detects that B's signal is still live and retries with B's signal.
    const retryData = { lifecycleSchema: 'retry', properties: '{}' };
    let rejectP1: (err: Error) => void;

    // Hook A's fetch hangs until we manually reject it
    mockCoFetchJSON.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectP1 = reject;
        }),
    );
    // Hook B's retry fetch resolves immediately
    mockCoFetchJSON.mockResolvedValueOnce(retryData);

    const PKG = 'pkg-cached-shared';

    // Hook A: effect runs → P1 created and stored in cache
    const { unmount: unmountA } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));

    // Hook B: same key → effect finds P1 in cache → Fix B wraps P1 with B's signal
    const { result: resultB } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));

    await act(async () => {
      unmountA(); // aborts A's controller (signal_A); our mock doesn't react to signals
      // Manually reject P1 to simulate what signal_A abort does to the real fetch
      rejectP1(new DOMException('The operation was aborted.', 'AbortError'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve(); // allow retry to complete
    });

    const [data, loading, error] = resultB.current;
    expect(error).toBeNull();
    expect(data).toEqual(retryData); // retry produced real data
    expect(loading).toBe(false);
    expect(mockCoFetchJSON).toHaveBeenCalledTimes(2); // P1 (aborted) + P2 (retry)
  });

  it('issues only one retry when three callers share the same aborted cached promise', async () => {
    // Regression for: multiple callers each unconditionally deleting the cache and
    // starting their own retry, causing N redundant fetches.
    // Only the first caller to detect the abort should start a retry; the others
    // should reuse the retry promise already stored by the first.
    const retryData = { lifecycleSchema: 'three-caller', properties: '{}' };
    let rejectP1: (err: Error) => void;

    // P1: hangs until manually rejected
    mockCoFetchJSON.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectP1 = reject;
        }),
    );
    // P2: the single retry (only one should be started)
    mockCoFetchJSON.mockResolvedValueOnce(retryData);

    const PKG = 'pkg-three-callers';

    // Mount A, B, C — all share the same cache key; B and C get P1 from cache
    const { unmount: unmountA } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));
    const { result: resultB } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));
    const { result: resultC } = renderHook(() => useOperatorLifecycle(PKG, CATALOG, NS));

    await act(async () => {
      unmountA();
      rejectP1(new DOMException('The operation was aborted.', 'AbortError'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Both B and C should see the retry data — not an error, not null
    expect(resultB.current[2]).toBeNull();
    expect(resultB.current[0]).toEqual(retryData);
    expect(resultC.current[2]).toBeNull();
    expect(resultC.current[0]).toEqual(retryData);

    // Only two coFetchJSON calls total: P1 (aborted) + P2 (single retry)
    expect(mockCoFetchJSON).toHaveBeenCalledTimes(2);
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
});
