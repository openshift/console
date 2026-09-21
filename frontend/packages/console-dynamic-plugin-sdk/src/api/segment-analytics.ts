import type { InitOptions } from '@segment/analytics-next';
import { AnalyticsBrowser } from '@segment/analytics-next';
import type { GetSegmentAnalytics } from '../extensions/console-types';
import { hasSegmentCdnOverride, resolveSegmentCdnUrl } from './segment-utils';

// Segment's API key. When the cluster is running in the Developer Sandbox
// environment, use their API key instead.
const apiKey =
  (window.SERVER_FLAGS.telemetry?.DEVSANDBOX === 'true' &&
    window.SERVER_FLAGS.telemetry?.DEVSANDBOX_SEGMENT_API_KEY) ||
  window.SERVER_FLAGS.telemetry?.SEGMENT_API_KEY ||
  window.SERVER_FLAGS.telemetry?.SEGMENT_PUBLIC_API_KEY ||
  '';

// Overrideable Segment's API host. The Segment client falls back to its
// default value "api.segment.io/v1" if none defined.
const apiHost = window.SERVER_FLAGS.telemetry?.SEGMENT_API_HOST;

// Overrideable Segment's CDN URL. The Segment client falls back to its
// default value "https://cdn.segment.com" if no overrides have been given.
const cdnURL = resolveSegmentCdnUrl();
const hasCdnOverride = hasSegmentCdnOverride();

// Flag whether we want the debug logs for our telemetry code.
const isDebugModeEnabled = window.SERVER_FLAGS.telemetry?.DEBUG === 'true';

// Sample 20% of sessions
const isSessionBeingSampled = Math.random() < 0.2;

if (!isSessionBeingSampled && isDebugModeEnabled) {
  console.debug('Analytics session is not being sampled, telemetry events will be ignored');
}

// Make sure that we have the required configuration bits to enable the
// Segment integration.
const isDisabled =
  !apiKey ||
  window.SERVER_FLAGS.telemetry?.DISABLED === 'true' ||
  window.SERVER_FLAGS.telemetry?.DEVSANDBOX_DISABLED === 'true' ||
  window.SERVER_FLAGS.telemetry?.TELEMETER_CLIENT_DISABLED === 'true';

// We only want the Segment integration enabled for the sessions that are
// being sampled.
let isEnabled = !isDisabled && isSessionBeingSampled;

// Initialize Segment Analytics as soon as possible, outside of React useEffect.
// This ensures that analytics.load method is invoked before any other methods.
let analytics: AnalyticsBrowser | undefined;
if (isEnabled) {
  if (hasCdnOverride && cdnURL === undefined) {
    if (isDebugModeEnabled) {
      console.warn('Segment CDN URL override is invalid; disabling analytics');
    }
    isEnabled = false;
  } else {
    if (isDebugModeEnabled) {
      console.info('Initialize Segment Analytics', {
        apiHost,
        apiKey,
        cdnURL,
      });
    }

    const options: InitOptions = {};
    if (apiHost) {
      options.integrations = { 'Segment.io': { apiHost } };
    }

    analytics = new AnalyticsBrowser();
    analytics
      .load(
        {
          cdnURL,
          writeKey: apiKey,
        },
        options,
      )
      .catch((error) => {
        console.error('Unable to initialize Segment analytics script', error);
        isEnabled = false;
      });
  }
}

/**
 * Segment analytics client returned by `getSegmentAnalytics`.
 * @see getSegmentAnalytics in `@openshift-console/dynamic-plugin-sdk-internal`.
 */
export type SegmentAnalyticsClient = AnalyticsBrowser;

export const getSegmentAnalytics: GetSegmentAnalytics = () => ({
  analytics,
  analyticsEnabled: isEnabled,
});

/**
 * Whether telemetry is disabled by cluster configuration. Use
 * `getSegmentAnalytics().analyticsEnabled` to determine if the current
 * session is being sampled and if we are actively sending events to Segment.
 */
export { isDisabled as isSegmentDisabled };

/**
 * Whether debug mode is enabled to report any extra information that we might
 * want to log.
 */
export { isDebugModeEnabled as isSegmentDebugModeEnabled };
