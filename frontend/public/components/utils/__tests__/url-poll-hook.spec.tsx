import { act, renderHook, waitFor } from '@testing-library/react';
import { useSafeFetch } from '../safe-fetch-hook';
import { useURLPoll } from '../url-poll-hook';

jest.mock('../safe-fetch-hook', () => ({ useSafeFetch: jest.fn() }));
const fetchURL = jest.fn();
const deferred = <T,>() => {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve: (value: T) => resolve(value) };
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSafeFetch).mockReturnValue(fetchURL);
  fetchURL.mockResolvedValue({ count: 1 });
});
afterEach(() => {
  jest.useRealTimers();
});

it('loads immediately and returns the successful response', async () => {
  const { result } = renderHook(() => useURLPoll<{ count: number }>('/first', 0));
  expect(result.current).toEqual([undefined, undefined, true]);
  await waitFor(() => expect(result.current).toEqual([{ count: 1 }, null, false]));
});

it('clears cached data immediately when the URL changes, including a namespace-only change', async () => {
  const pending = deferred<{ count: number }>();
  const { result, rerender } = renderHook(
    ({ namespace }) => useURLPoll<{ count: number }>(`/query?namespace=${namespace}`, 0),
    {
      initialProps: { namespace: 'a' },
    },
  );
  await waitFor(() => expect(result.current[0]).toEqual({ count: 1 }));
  fetchURL.mockReturnValue(pending.promise);
  rerender({ namespace: 'b' });
  expect(result.current).toEqual([undefined, undefined, true]);
  await act(async () => {
    pending.resolve({ count: 2 });
  });
  expect(result.current).toEqual([{ count: 2 }, null, false]);
});

it('ignores an old URL response which resolves after the new response', async () => {
  const old = deferred<{ count: number }>();
  fetchURL.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ count: 2 });
  const { result, rerender } = renderHook(({ url }) => useURLPoll<{ count: number }>(url, 0), {
    initialProps: { url: '/old' },
  });
  const previousSignal = fetchURL.mock.calls[0][1].signal;
  rerender({ url: '/new' });
  expect(previousSignal.aborted).toBe(true);
  await waitFor(() => expect(result.current[0]).toEqual({ count: 2 }));
  await act(async () => {
    old.resolve({ count: 1 });
  });
  expect(result.current[0]).toEqual({ count: 2 });
});

it('does not fetch or create a poller for an empty URL', async () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useURLPoll(''));
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(fetchURL).not.toHaveBeenCalled();
  expect(result.current).toEqual([undefined, undefined, false]);
});

it('polls and stops polling on unmount', async () => {
  jest.useFakeTimers();
  const { unmount } = renderHook(() => useURLPoll('/query', 15000));
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(fetchURL).toHaveBeenCalledTimes(2);
  unmount();
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(fetchURL).toHaveBeenCalledTimes(2);
});

it('does not overlap requests if a response takes longer than the poll interval', async () => {
  jest.useFakeTimers();
  const pending = deferred<{ count: number }>();
  fetchURL.mockReturnValue(pending.promise);
  renderHook(() => useURLPoll('/query', 15000));
  await act(async () => {
    jest.advanceTimersByTime(45000);
  });
  expect(fetchURL).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.resolve({ count: 1 });
  });
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(fetchURL).toHaveBeenCalledTimes(2);
});

it('does not reuse cached data when the same URL is disabled and then re-enabled', async () => {
  const { result, rerender } = renderHook(({ url }) => useURLPoll<{ count: number }>(url, 0), {
    initialProps: { url: '/query' },
  });
  await waitFor(() => expect(result.current[0]).toEqual({ count: 1 }));
  rerender({ url: '' });
  expect(result.current[0]).toBeUndefined();
  const pending = deferred<{ count: number }>();
  fetchURL.mockReturnValue(pending.promise);
  rerender({ url: '/query' });
  expect(result.current).toEqual([undefined, undefined, true]);
  await act(async () => {
    pending.resolve({ count: 2 });
  });
  expect(result.current[0]).toEqual({ count: 2 });
});

it('preserves the existing null response on a failed request', async () => {
  const error = new Error('Unavailable');
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    fetchURL.mockRejectedValue(error);
    const { result } = renderHook(() => useURLPoll('/query', 0));
    await waitFor(() => expect(result.current).toEqual([null, error, false]));
  } finally {
    log.mockRestore();
  }
});
