import { hasSegmentCdnOverride, resolveSegmentCdnUrl } from '../segment-utils';

describe('hasSegmentCdnOverride', () => {
  let originalServerFlags: typeof window.SERVER_FLAGS;

  beforeEach(() => {
    originalServerFlags = window.SERVER_FLAGS;
  });

  afterEach(() => {
    window.SERVER_FLAGS = originalServerFlags;
  });

  const setTelemetry = (telemetry: Record<string, string> | undefined) => {
    window.SERVER_FLAGS = { ...originalServerFlags, telemetry };
  };

  it('returns false when telemetry is missing', () => {
    window.SERVER_FLAGS = { ...originalServerFlags };
    delete window.SERVER_FLAGS.telemetry;

    expect(hasSegmentCdnOverride()).toBe(false);
  });

  it('returns false when no CDN override keys are configured', () => {
    setTelemetry({ SEGMENT_API_KEY: 'test-key' });

    expect(hasSegmentCdnOverride()).toBe(false);
  });

  it('returns true when SEGMENT_CDN_URL is configured', () => {
    setTelemetry({ SEGMENT_CDN_URL: 'https://example.com/cdn' });

    expect(hasSegmentCdnOverride()).toBe(true);
  });

  it('returns true when SEGMENT_JS_URL is configured', () => {
    setTelemetry({
      SEGMENT_JS_URL: 'https://example.redhat.com/cdn/analytics.js/v1/abcde/analytics.min.js',
    });

    expect(hasSegmentCdnOverride()).toBe(true);
  });

  it('returns true when SEGMENT_JS_HOST is configured', () => {
    setTelemetry({ SEGMENT_JS_HOST: 'console.redhat.com/connections/cdn' });

    expect(hasSegmentCdnOverride()).toBe(true);
  });
});

describe('resolveSegmentCdnUrl', () => {
  let originalServerFlags: typeof window.SERVER_FLAGS;

  beforeEach(() => {
    originalServerFlags = window.SERVER_FLAGS;
  });

  afterEach(() => {
    window.SERVER_FLAGS = originalServerFlags;
  });

  const setTelemetry = (telemetry: Record<string, string> | undefined) => {
    window.SERVER_FLAGS = { ...originalServerFlags, telemetry };
  };

  describe('when telemetry is not configured', () => {
    it('returns undefined when telemetry is missing', () => {
      window.SERVER_FLAGS = { ...originalServerFlags };
      delete window.SERVER_FLAGS.telemetry;

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('returns undefined when telemetry is empty', () => {
      setTelemetry({});

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });
  });

  describe('SEGMENT_CDN_URL', () => {
    it('returns the CDN URL with https protocol unchanged', () => {
      setTelemetry({ SEGMENT_CDN_URL: 'https://console.redhat.com/connections/cdn' });

      expect(resolveSegmentCdnUrl()).toBe('https://console.redhat.com/connections/cdn');
    });

    it('rejects the CDN URL when http protocol is used', () => {
      setTelemetry({ SEGMENT_CDN_URL: 'http://example.com/cdn' });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('rejects protocol-relative CDN URLs', () => {
      setTelemetry({ SEGMENT_CDN_URL: '//example.com/cdn' });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('prepends https when the CDN URL has no protocol', () => {
      setTelemetry({ SEGMENT_CDN_URL: 'console.redhat.com/connections/cdn' });

      expect(resolveSegmentCdnUrl()).toBe('https://console.redhat.com/connections/cdn');
    });

    it('strips trailing slashes', () => {
      setTelemetry({ SEGMENT_CDN_URL: 'https://example.com/cdn///' });

      expect(resolveSegmentCdnUrl()).toBe('https://example.com/cdn');
    });

    it('takes precedence over SEGMENT_JS_URL and SEGMENT_JS_HOST', () => {
      setTelemetry({
        SEGMENT_CDN_URL: 'https://preferred.example.com/cdn',
        SEGMENT_JS_URL: 'https://ignored.example.com/cdn/analytics.js/v1/key/analytics.min.js',
        SEGMENT_JS_HOST: 'ignored.example.com',
      });

      expect(resolveSegmentCdnUrl()).toBe('https://preferred.example.com/cdn');
    });
  });

  describe('SEGMENT_JS_URL', () => {
    it('strips the /analytics.js/v1/... suffix from a legacy full script URL', () => {
      setTelemetry({
        SEGMENT_JS_URL: 'https://example.redhat.com/cdn/analytics.js/v1/abcde/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBe('https://example.redhat.com/cdn');
    });

    it('normalizes the stripped base URL when it has no protocol', () => {
      setTelemetry({
        SEGMENT_JS_URL: 'example.redhat.com/cdn/analytics.js/v1/abcde/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBe('https://example.redhat.com/cdn');
    });

    it('strips trailing slashes from the stripped base URL', () => {
      setTelemetry({
        SEGMENT_JS_URL: 'https://example.redhat.com/cdn///analytics.js/v1/abcde/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBe('https://example.redhat.com/cdn');
    });

    it('returns undefined when the legacy URL does not match /analytics.js/v1', () => {
      setTelemetry({
        SEGMENT_JS_URL: 'https://example.redhat.com/custom/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('returns undefined when the legacy URL contains /analytics.js/v10', () => {
      setTelemetry({
        SEGMENT_JS_URL: 'https://example.redhat.com/cdn/analytics.js/v10/abcde/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('returns undefined when the legacy URL contains /analytics.js/v1-old', () => {
      setTelemetry({
        SEGMENT_JS_URL: 'https://example.redhat.com/cdn/analytics.js/v1-old/abcde/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('logs a debug message when DEBUG is true and the legacy URL does not match', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      setTelemetry({
        DEBUG: 'true',
        SEGMENT_JS_URL: 'https://example.redhat.com/custom/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
      expect(debugSpy).toHaveBeenCalledWith(
        'A legacy "SEGMENT_JS_URL" was provided, but no "/analytics.js/v1" was matched',
        'https://example.redhat.com/custom/analytics.min.js',
      );

      debugSpy.mockRestore();
    });

    it('does not log when DEBUG is not true and the legacy URL does not match', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      setTelemetry({
        SEGMENT_JS_URL: 'https://example.redhat.com/custom/analytics.min.js',
      });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
      expect(debugSpy).not.toHaveBeenCalled();

      debugSpy.mockRestore();
    });

    it('takes precedence over SEGMENT_JS_HOST when SEGMENT_CDN_URL is not set', () => {
      setTelemetry({
        SEGMENT_JS_URL: 'https://preferred.example.com/cdn/analytics.js/v1/key/analytics.min.js',
        SEGMENT_JS_HOST: 'ignored.example.com',
      });

      expect(resolveSegmentCdnUrl()).toBe('https://preferred.example.com/cdn');
    });
  });

  describe('SEGMENT_JS_HOST', () => {
    it('prepends https when only a hostname is provided', () => {
      setTelemetry({ SEGMENT_JS_HOST: 'console.redhat.com/connections/cdn' });

      expect(resolveSegmentCdnUrl()).toBe('https://console.redhat.com/connections/cdn');
    });

    it('returns the host URL unchanged when https is already present', () => {
      setTelemetry({ SEGMENT_JS_HOST: 'https://console.redhat.com/connections/cdn' });

      expect(resolveSegmentCdnUrl()).toBe('https://console.redhat.com/connections/cdn');
    });

    it('rejects the host URL when http is already present', () => {
      setTelemetry({ SEGMENT_JS_HOST: 'http://example.com/cdn' });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('rejects protocol-relative host URLs', () => {
      setTelemetry({ SEGMENT_JS_HOST: '//example.com/cdn' });

      expect(resolveSegmentCdnUrl()).toBeUndefined();
    });

    it('strips trailing slashes from the host URL', () => {
      setTelemetry({ SEGMENT_JS_HOST: 'https://example.com/cdn/' });

      expect(resolveSegmentCdnUrl()).toBe('https://example.com/cdn');
    });
  });
});
