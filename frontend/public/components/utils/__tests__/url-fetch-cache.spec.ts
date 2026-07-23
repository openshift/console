import { dedupedFetch } from '../url-fetch-cache';

describe('dedupedFetch', () => {
  it('should return the same promise for the same URL while in-flight', () => {
    const fetchFn = jest.fn(() => new Promise(() => {}));
    const p1 = dedupedFetch('/api/dedup-same', fetchFn);
    const p2 = dedupedFetch('/api/dedup-same', fetchFn);

    expect(p1).toBe(p2);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('should return different promises for different URLs', () => {
    const fetchFn = jest.fn(() => new Promise(() => {}));
    const p1 = dedupedFetch('/api/dedup-a', fetchFn);
    const p2 = dedupedFetch('/api/dedup-b', fetchFn);

    expect(p1).not.toBe(p2);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('should create a new fetch after the previous one resolves', async () => {
    let resolveFirst: (v: any) => void;
    const fetchFn = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>((r) => {
            resolveFirst = r;
          }),
      )
      .mockImplementationOnce(() => Promise.resolve('second'));

    const p1 = dedupedFetch('/api/dedup-resolve', fetchFn);
    resolveFirst!('first');
    await p1;

    const p2 = dedupedFetch('/api/dedup-resolve', fetchFn);
    expect(p2).not.toBe(p1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('should propagate errors to all subscribers', async () => {
    const error = new Error('fetch failed');
    const fetchFn = jest.fn(() => Promise.reject(error));

    const p1 = dedupedFetch('/api/dedup-fail', fetchFn);
    const p2 = dedupedFetch('/api/dedup-fail', fetchFn);

    await expect(p1).rejects.toThrow('fetch failed');
    await expect(p2).rejects.toThrow('fetch failed');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('should clear the cache entry after settlement', async () => {
    const fetchFn = jest.fn(() => Promise.resolve('data'));

    await dedupedFetch('/api/dedup-clear', fetchFn);
    await dedupedFetch('/api/dedup-clear', fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
