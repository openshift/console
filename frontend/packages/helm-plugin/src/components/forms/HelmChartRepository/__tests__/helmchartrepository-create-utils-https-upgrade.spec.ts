import { tryHttpsUpgrade } from '../helmchartrepository-create-utils';

describe('tryHttpsUpgrade', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('should return https URL when server responds with 200', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const result = await tryHttpsUpgrade('http://example.com/repo');
    expect(result).toBe('https://example.com/repo');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/repo',
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('should return null when server responds with a non-OK status', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 404 }));
    const result = await tryHttpsUpgrade('http://example.com/repo');
    expect(result).toBeNull();
  });

  it('should return null when server responds with 500', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const result = await tryHttpsUpgrade('http://example.com/repo');
    expect(result).toBeNull();
  });

  it('should return null when server does not support HTTPS', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await tryHttpsUpgrade('http://example.com/repo');
    expect(result).toBeNull();
  });

  it('should return null for HTTPS URLs', async () => {
    const result = await tryHttpsUpgrade('https://example.com');
    expect(result).toBeNull();
  });

  it('should return null for OCI URLs', async () => {
    const result = await tryHttpsUpgrade('oci://registry.io/chart');
    expect(result).toBeNull();
  });

  it('should return null for null or undefined input', async () => {
    expect(await tryHttpsUpgrade(null)).toBeNull();
    expect(await tryHttpsUpgrade(undefined)).toBeNull();
  });

  it('should return null when fetch times out', async () => {
    global.fetch = jest.fn().mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(new DOMException('Aborted')));
        }),
    );
    jest.useFakeTimers();
    const promise = tryHttpsUpgrade('http://slow-server.com/repo');
    jest.advanceTimersByTime(3000);
    const result = await promise;
    expect(result).toBeNull();
  });
});
