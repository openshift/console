const SAMPLE_KEY = 'console-telemetry-sample';

/**
 * Re-imports `isSessionSampled` with a fresh module instance.
 *
 * `segment-utils` memoizes the sampling decision in module-level state
 * `sampledForThisPageLoad` for the lifetime of a page load. Jest keeps a
 * single module instance for the whole test file, so importing at the top
 * would share that memo across tests and make order-dependent failures
 * likely.
 *
 * `jest.resetModules()` plus a dynamic `import()` simulates a real page load,
 * or a reload after SSO, while still letting `sessionStorage` persist between
 * calls.
 */
const loadIsSessionSampled = async (): Promise<() => boolean> => {
  jest.resetModules();
  const { isSessionSampled } = await import('../segment-utils');
  return isSessionSampled;
};

describe('isSessionSampled', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    sessionStorage.clear();
    randomSpy = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
    sessionStorage.clear();
  });

  it('returns true when sessionStorage already contains "1"', async () => {
    sessionStorage.setItem(SAMPLE_KEY, '1');
    const isSessionSampled = await loadIsSessionSampled();

    expect(isSessionSampled()).toBe(true);
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it('returns false when sessionStorage already contains "0"', async () => {
    sessionStorage.setItem(SAMPLE_KEY, '0');
    const isSessionSampled = await loadIsSessionSampled();

    expect(isSessionSampled()).toBe(false);
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it('samples and persists "1" on first visit when random is below the sample rate', async () => {
    randomSpy.mockReturnValue(0.1);
    const isSessionSampled = await loadIsSessionSampled();

    expect(isSessionSampled()).toBe(true);
    expect(sessionStorage.getItem(SAMPLE_KEY)).toBe('1');
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('samples and persists "0" on first visit when random is at or above the sample rate', async () => {
    randomSpy.mockReturnValue(0.2);
    const isSessionSampled = await loadIsSessionSampled();

    expect(isSessionSampled()).toBe(false);
    expect(sessionStorage.getItem(SAMPLE_KEY)).toBe('0');
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('re-rolls and overwrites an invalid sessionStorage value', async () => {
    sessionStorage.setItem(SAMPLE_KEY, 'invalid');
    randomSpy.mockReturnValue(0.1);
    const isSessionSampled = await loadIsSessionSampled();

    expect(isSessionSampled()).toBe(true);
    expect(sessionStorage.getItem(SAMPLE_KEY)).toBe('1');
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('memoizes the result within the same page load', async () => {
    randomSpy.mockReturnValue(0.1);
    const isSessionSampled = await loadIsSessionSampled();

    expect(isSessionSampled()).toBe(true);
    expect(isSessionSampled()).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('reads the persisted value after a reload without re-rolling', async () => {
    randomSpy.mockReturnValue(0.1);
    const firstLoad = await loadIsSessionSampled();
    expect(firstLoad()).toBe(true);
    expect(sessionStorage.getItem(SAMPLE_KEY)).toBe('1');

    randomSpy.mockReturnValue(0.9);
    const secondLoad = await loadIsSessionSampled();
    expect(secondLoad()).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it('memoizes the fallback result when sessionStorage is unavailable', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('sessionStorage blocked');
    });
    randomSpy.mockReturnValue(0.1);
    const isSessionSampled = await loadIsSessionSampled();

    expect(isSessionSampled()).toBe(true);
    expect(isSessionSampled()).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });
});
