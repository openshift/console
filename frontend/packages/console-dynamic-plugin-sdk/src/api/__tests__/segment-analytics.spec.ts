/**
 * Regression tests for OCPBUGS-51368.
 *
 * Console must not contact Segment directly. The Segment JS host is always supplied by the
 * operator's telemetry-config in a healthy cluster; when it is missing, telemetry must be
 * disabled rather than falling back to a Segment-hosted CDN (cdn.segment.com).
 *
 * segment-analytics.ts reads window.SERVER_FLAGS.telemetry at module-evaluation time, so each
 * case re-imports the module in isolation after setting the flags.
 */

import type * as SegmentAnalytics from '../segment-analytics';

type SegmentAnalyticsModule = typeof SegmentAnalytics;

const loadModule = (telemetry?: Record<string, string>): SegmentAnalyticsModule => {
  let mod: SegmentAnalyticsModule | undefined;
  jest.isolateModules(() => {
    (window.SERVER_FLAGS as Window['SERVER_FLAGS']).telemetry = telemetry;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../segment-analytics');
  });
  return mod as SegmentAnalyticsModule;
};

describe('segment-analytics telemetry gating (OCPBUGS-51368)', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    // Default to "not sampled" so the module-load initialization does not run and touch the DOM.
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    // Ensure at least one <script> exists so the Segment snippet's insertBefore never throws.
    document.head.appendChild(document.createElement('script'));
  });

  afterEach(() => {
    randomSpy.mockRestore();
    delete (window.SERVER_FLAGS as Window['SERVER_FLAGS']).telemetry;
    document.querySelectorAll('script').forEach((s) => s.remove());
  });

  it('enables telemetry when an API key and SEGMENT_JS_HOST are configured', () => {
    const { TELEMETRY_DISABLED } = loadModule({
      SEGMENT_PUBLIC_API_KEY: 'key',
      SEGMENT_JS_HOST: 'console.redhat.com/connections/cdn',
      SEGMENT_API_HOST: 'console.redhat.com/connections/api/v1',
    });
    expect(TELEMETRY_DISABLED).toBe(false);
  });

  it('disables telemetry when no JS host or URL is set, instead of falling back to Segment', () => {
    const { TELEMETRY_DISABLED } = loadModule({
      SEGMENT_PUBLIC_API_KEY: 'key',
      SEGMENT_API_HOST: 'console.redhat.com/connections/api/v1',
      // no SEGMENT_JS_HOST and no SEGMENT_JS_URL
    });
    expect(TELEMETRY_DISABLED).toBe(true);
  });

  it('still enables telemetry when an explicit SEGMENT_JS_URL is set without a host', () => {
    const { TELEMETRY_DISABLED } = loadModule({
      SEGMENT_PUBLIC_API_KEY: 'key',
      SEGMENT_API_HOST: 'console.redhat.com/connections/api/v1',
      SEGMENT_JS_URL:
        'https://console.redhat.com/connections/cdn/analytics.js/v1/key/analytics.min.js',
    });
    expect(TELEMETRY_DISABLED).toBe(false);
  });

  it('disables telemetry when no API host is set, so events do not reach Segment directly', () => {
    const { TELEMETRY_DISABLED } = loadModule({
      SEGMENT_PUBLIC_API_KEY: 'key',
      SEGMENT_JS_HOST: 'console.redhat.com/connections/cdn',
      // no SEGMENT_API_HOST: the Segment SDK would otherwise default to api.segment.io
    });
    expect(TELEMETRY_DISABLED).toBe(true);
  });

  it('disables telemetry when no API key is present', () => {
    const { TELEMETRY_DISABLED } = loadModule({
      SEGMENT_JS_HOST: 'console.redhat.com/connections/cdn',
    });
    expect(TELEMETRY_DISABLED).toBe(true);
  });

  it('does not load analytics from cdn.segment.com when the JS host is missing, even if sampled', () => {
    randomSpy.mockReturnValue(0); // force the session to be "sampled"
    const { getSegmentAnalytics } = loadModule({
      SEGMENT_PUBLIC_API_KEY: 'key',
      // no SEGMENT_JS_HOST and no SEGMENT_JS_URL
    });
    expect(getSegmentAnalytics().analyticsEnabled).toBe(false);
    const loadedFromSegment = Array.from(document.getElementsByTagName('script')).some((s) =>
      (s.src || '').includes('cdn.segment.com'),
    );
    expect(loadedFromSegment).toBe(false);
  });
});
