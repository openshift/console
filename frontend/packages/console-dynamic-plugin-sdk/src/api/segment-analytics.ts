import type { GetSegmentAnalytics } from '../extensions/console-types';

// Segment API key. Must be present for telemetry to be enabled.
const TELEMETRY_API_KEY =
  window.SERVER_FLAGS.telemetry?.SEGMENT_API_KEY ||
  window.SERVER_FLAGS.telemetry?.SEGMENT_PUBLIC_API_KEY ||
  window.SERVER_FLAGS.telemetry?.DEVSANDBOX_SEGMENT_API_KEY ||
  '';

// Segment "apiHost" parameter, should be like "api.segment.io/v1"
const TELEMETRY_API_HOST = window.SERVER_FLAGS.telemetry?.SEGMENT_API_HOST || '';

// Segment JS host, defaults to "cdn.segment.com" if not defined
const TELEMETRY_JS_HOST = window.SERVER_FLAGS.telemetry?.SEGMENT_JS_HOST || 'cdn.segment.com';

// Segment analytics.min.js script URL
const TELEMETRY_JS_URL =
  window.SERVER_FLAGS.telemetry?.SEGMENT_JS_URL ||
  `https://${TELEMETRY_JS_HOST}/analytics.js/v1/${encodeURIComponent(
    TELEMETRY_API_KEY,
  )}/analytics.min.js`;

export const TELEMETRY_DISABLED =
  !TELEMETRY_API_KEY ||
  window.SERVER_FLAGS.telemetry?.DISABLED === 'true' ||
  window.SERVER_FLAGS.telemetry?.DEVSANDBOX_DISABLED === 'true' ||
  window.SERVER_FLAGS.telemetry?.TELEMETER_CLIENT_DISABLED === 'true';

export const TELEMETRY_DEBUG = window.SERVER_FLAGS.telemetry?.DEBUG === 'true';

// Sample 20% of sessions
const SAMPLE_SESSION = Math.random() < 0.2;

// TODO: replace this copy-pasted Segment init snippet with proper use of Segment package
// https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/quickstart/#step-2-install-segment-to-your-site
const initSegmentAnalytics = () => {
  if (TELEMETRY_DEBUG) {
    // eslint-disable-next-line no-console
    console.info('Initialize Segment Analytics', {
      TELEMETRY_API_HOST,
      TELEMETRY_API_KEY,
      TELEMETRY_JS_HOST,
      TELEMETRY_JS_URL,
    });
  }
  // eslint-disable-next-line no-multi-assign
  const analytics = ((window as any).analytics = (window as any).analytics || []);
  if (analytics.initialize) {
    return;
  }
  if (analytics.invoked) {
    // eslint-disable-next-line no-console
    console.error('Analytics snippet included twice');
    return;
  }
  analytics.invoked = true;
  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'debug',
    'page',
    'once',
    'off',
    'on',
    'addSourceMiddleware',
    'addIntegrationMiddleware',
    'setAnonymousId',
    'addDestinationMiddleware',
  ];
  analytics.factory = function (e: string) {
    return function () {
      // eslint-disable-next-line prefer-rest-params
      const t = Array.prototype.slice.call(arguments);
      t.unshift(e);
      analytics.push(t);
      return analytics;
    };
  };
  for (const key of analytics.methods) {
    analytics[key] = analytics.factory(key);
  }
  analytics.load = function (key: string, e: Event) {
    const t = document.createElement('script');
    t.type = 'text/javascript';
    t.async = true;
    t.src = TELEMETRY_JS_URL;
    const n = document.getElementsByTagName('script')[0];
    if (n.parentNode) {
      n.parentNode.insertBefore(t, n);
    }
    // eslint-disable-next-line no-underscore-dangle
    analytics._loadOptions = e;
  };
  analytics.SNIPPET_VERSION = '4.13.1';
  const options: Record<string, any> = {};
  if (TELEMETRY_API_HOST) {
    options.integrations = { 'Segment.io': { apiHost: TELEMETRY_API_HOST } };
  }
  analytics.load(TELEMETRY_API_KEY, options);
  analytics.page(); // Make the first page call to load the integrations
};

if (!SAMPLE_SESSION) {
  // eslint-disable-next-line no-console
  console.debug('Analytics session is not being sampled, telemetry events will be ignored');
}

const analyticsEnabled = !TELEMETRY_DISABLED && SAMPLE_SESSION;

// Initialize Segment Analytics as soon as possible, outside of React useEffect.
// This ensures that analytics.load method is invoked before any other methods.
if (analyticsEnabled) {
  initSegmentAnalytics();
}

export const getSegmentAnalytics: GetSegmentAnalytics = () => {
  return {
    analytics: (window as any).analytics,
    analyticsEnabled,
  };
};
