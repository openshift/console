import { AnalyticsBrowser } from '@segment/analytics-next';

const mockLoad = jest.fn();
const mockAnalyticsInstance = { load: mockLoad };

type SegmentAnalyticsModule = {
  getSegmentAnalytics: () => {
    analytics: typeof mockAnalyticsInstance | undefined;
    analyticsEnabled: boolean;
  };
  isSegmentDisabled: boolean;
  isSegmentDebugModeEnabled: boolean;
};

jest.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: jest.fn(() => mockAnalyticsInstance),
}));

const MockAnalyticsBrowser = AnalyticsBrowser as jest.MockedClass<typeof AnalyticsBrowser>;

const loadSegmentAnalyticsModule = (): SegmentAnalyticsModule => {
  let moduleExports: SegmentAnalyticsModule | undefined;
  jest.isolateModules(() => {
    moduleExports = jest.requireActual('../segment-analytics') as SegmentAnalyticsModule;
  });
  if (!moduleExports) {
    throw new Error('Failed to load segment-analytics module');
  }
  return moduleExports;
};

describe('segment-analytics', () => {
  let originalServerFlags: typeof window.SERVER_FLAGS;
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    originalServerFlags = window.SERVER_FLAGS;
    mockLoad.mockReset();
    mockLoad.mockReturnValue({ catch: jest.fn() });
    MockAnalyticsBrowser.mockClear();
    randomSpy = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    window.SERVER_FLAGS = originalServerFlags;
    randomSpy.mockRestore();
    jest.restoreAllMocks();
  });

  const setTelemetry = (telemetry: Record<string, string>) => {
    window.SERVER_FLAGS = { ...originalServerFlags, telemetry };
  };

  const loadWithTelemetry = (
    telemetry: Record<string, string>,
    randomValue = 0.1,
  ): SegmentAnalyticsModule => {
    setTelemetry(telemetry);
    randomSpy.mockReturnValue(randomValue);
    return loadSegmentAnalyticsModule();
  };

  describe('isSegmentDisabled', () => {
    it('is true when no API key is configured', () => {
      const { isSegmentDisabled } = loadWithTelemetry({});

      expect(isSegmentDisabled).toBe(true);
    });

    it('is true when DISABLED is "true"', () => {
      const { isSegmentDisabled } = loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        DISABLED: 'true',
      });

      expect(isSegmentDisabled).toBe(true);
    });

    it('is true when DEVSANDBOX_DISABLED is "true"', () => {
      const { isSegmentDisabled } = loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        DEVSANDBOX_DISABLED: 'true',
      });

      expect(isSegmentDisabled).toBe(true);
    });

    it('is true when TELEMETER_CLIENT_DISABLED is "true"', () => {
      const { isSegmentDisabled } = loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        TELEMETER_CLIENT_DISABLED: 'true',
      });

      expect(isSegmentDisabled).toBe(true);
    });

    it('is false when an API key is present and disable flags are not set', () => {
      const { isSegmentDisabled } = loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
      });

      expect(isSegmentDisabled).toBe(false);
    });
  });

  describe('isSegmentDebugModeEnabled', () => {
    it('is true when DEBUG is "true"', () => {
      const { isSegmentDebugModeEnabled } = loadWithTelemetry({ DEBUG: 'true' });

      expect(isSegmentDebugModeEnabled).toBe(true);
    });

    it('is false when DEBUG is not "true"', () => {
      const { isSegmentDebugModeEnabled } = loadWithTelemetry({ DEBUG: 'false' });

      expect(isSegmentDebugModeEnabled).toBe(false);
    });
  });

  describe('API key resolution', () => {
    it('prefers the DevSandbox API key when DEVSANDBOX is "true"', () => {
      loadWithTelemetry({
        DEVSANDBOX: 'true',
        DEVSANDBOX_SEGMENT_API_KEY: 'devsandbox-key',
        SEGMENT_API_KEY: 'prod-key',
        SEGMENT_PUBLIC_API_KEY: 'public-key',
      });

      expect(MockAnalyticsBrowser).toHaveBeenCalled();
      expect(mockLoad).toHaveBeenCalledWith(
        expect.objectContaining({ writeKey: 'devsandbox-key' }),
        expect.any(Object),
      );
    });

    it('falls back to SEGMENT_API_KEY', () => {
      loadWithTelemetry({ SEGMENT_API_KEY: 'segment-key' });

      expect(mockLoad).toHaveBeenCalledWith(
        expect.objectContaining({ writeKey: 'segment-key' }),
        expect.any(Object),
      );
    });

    it('falls back to SEGMENT_PUBLIC_API_KEY when SEGMENT_API_KEY is absent', () => {
      loadWithTelemetry({ SEGMENT_PUBLIC_API_KEY: 'public-key' });

      expect(mockLoad).toHaveBeenCalledWith(
        expect.objectContaining({ writeKey: 'public-key' }),
        expect.any(Object),
      );
    });
  });

  describe('session sampling', () => {
    it('enables analytics when the session is sampled', () => {
      const { getSegmentAnalytics } = loadWithTelemetry({ SEGMENT_API_KEY: 'test-key' }, 0.1);

      expect(getSegmentAnalytics()).toEqual({
        analytics: mockAnalyticsInstance,
        analyticsEnabled: true,
      });
    });

    it('disables analytics when the session is not sampled', () => {
      const { getSegmentAnalytics } = loadWithTelemetry({ SEGMENT_API_KEY: 'test-key' }, 0.9);

      expect(getSegmentAnalytics()).toEqual({
        analytics: undefined,
        analyticsEnabled: false,
      });
      expect(MockAnalyticsBrowser).not.toHaveBeenCalled();
    });

    it('treats a random value of 0.2 as not sampled', () => {
      const { getSegmentAnalytics } = loadWithTelemetry({ SEGMENT_API_KEY: 'test-key' }, 0.2);

      expect(getSegmentAnalytics().analyticsEnabled).toBe(false);
    });
  });

  describe('AnalyticsBrowser initialization', () => {
    it('does not initialize Segment when telemetry is disabled', () => {
      loadWithTelemetry({ DISABLED: 'true', SEGMENT_API_KEY: 'test-key' });

      expect(MockAnalyticsBrowser).not.toHaveBeenCalled();
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it('loads Segment with the default CDN URL when no override is configured', () => {
      loadWithTelemetry({ SEGMENT_API_KEY: 'test-key' });

      expect(mockLoad).toHaveBeenCalledWith(
        {
          cdnURL: undefined,
          writeKey: 'test-key',
        },
        {},
      );
    });

    it('loads Segment with the resolved CDN URL and write key', () => {
      loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        SEGMENT_CDN_URL: 'https://example.com/cdn',
      });

      expect(mockLoad).toHaveBeenCalledWith(
        {
          cdnURL: 'https://example.com/cdn',
          writeKey: 'test-key',
        },
        {},
      );
    });

    it('does not initialize Segment when a CDN override resolves to undefined', () => {
      const { getSegmentAnalytics } = loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        SEGMENT_CDN_URL: 'http://example.com/cdn',
      });

      expect(getSegmentAnalytics()).toEqual({
        analytics: undefined,
        analyticsEnabled: false,
      });
      expect(MockAnalyticsBrowser).not.toHaveBeenCalled();
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it('does not initialize Segment when a protocol-relative CDN override is configured', () => {
      const { getSegmentAnalytics } = loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        SEGMENT_CDN_URL: '//example.com/cdn',
      });

      expect(getSegmentAnalytics()).toEqual({
        analytics: undefined,
        analyticsEnabled: false,
      });
      expect(MockAnalyticsBrowser).not.toHaveBeenCalled();
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it('does not initialize Segment when a legacy CDN override does not match', () => {
      const { getSegmentAnalytics } = loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        SEGMENT_JS_URL: 'https://example.redhat.com/custom/analytics.min.js',
      });

      expect(getSegmentAnalytics()).toEqual({
        analytics: undefined,
        analyticsEnabled: false,
      });
      expect(MockAnalyticsBrowser).not.toHaveBeenCalled();
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it('logs a warning when DEBUG is enabled and a CDN override is invalid', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      loadWithTelemetry({
        DEBUG: 'true',
        SEGMENT_API_KEY: 'test-key',
        SEGMENT_CDN_URL: 'http://example.com/cdn',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'Segment CDN URL override is invalid; disabling analytics',
      );

      warnSpy.mockRestore();
    });

    it('passes the API host in load options when configured', () => {
      loadWithTelemetry({
        SEGMENT_API_KEY: 'test-key',
        SEGMENT_API_HOST: 'console.redhat.com/connections/api/v1',
      });

      expect(mockLoad).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          'Segment.io': { apiHost: 'console.redhat.com/connections/api/v1' },
        },
      });
    });

    it('does not pass integrations when the API host is not configured', () => {
      loadWithTelemetry({ SEGMENT_API_KEY: 'test-key' });

      expect(mockLoad).toHaveBeenCalledWith(expect.any(Object), {});
    });

    it('logs initialization details when DEBUG is enabled', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

      loadWithTelemetry({
        DEBUG: 'true',
        SEGMENT_API_KEY: 'test-key',
        SEGMENT_CDN_URL: 'https://example.com/cdn',
        SEGMENT_API_HOST: 'console.redhat.com/connections/api/v1',
      });

      expect(infoSpy).toHaveBeenCalledWith('Initialize Segment Analytics', {
        apiHost: 'console.redhat.com/connections/api/v1',
        apiKey: 'test-key',
        cdnURL: 'https://example.com/cdn',
      });

      infoSpy.mockRestore();
    });

    it('logs a debug message when DEBUG is enabled and the session is not sampled', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

      loadWithTelemetry({ DEBUG: 'true', SEGMENT_API_KEY: 'test-key' }, 0.9);

      expect(debugSpy).toHaveBeenCalledWith(
        'Analytics session is not being sampled, telemetry events will be ignored',
      );

      debugSpy.mockRestore();
    });

    it('does not log an unsampled-session debug message when DEBUG is disabled', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

      loadWithTelemetry({ SEGMENT_API_KEY: 'test-key' }, 0.9);

      expect(debugSpy).not.toHaveBeenCalled();

      debugSpy.mockRestore();
    });

    it('logs an error when Segment initialization fails', () => {
      const loadError = new Error('Unable to load Segment');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLoad.mockReturnValue({
        catch: jest.fn((handler: (error: Error) => void) => {
          handler(loadError);
        }),
      });

      loadWithTelemetry({ SEGMENT_API_KEY: 'test-key' });

      expect(errorSpy).toHaveBeenCalledWith(
        'Unable to initialize Segment analytics script',
        loadError,
      );

      errorSpy.mockRestore();
    });
  });
});
