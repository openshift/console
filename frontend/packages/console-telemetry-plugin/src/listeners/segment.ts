import { TelemetryEventListener } from '@console/dynamic-plugin-sdk/src';
import { TELEMETRY_DISABLED, TELEMETRY_DEBUG } from './const';

/** Segmnet API Key that looks like a hash */
const apiKey =
  window.SERVER_FLAGS?.telemetry?.DEVSANDBOX_SEGMENT_API_KEY ||
  window.SERVER_FLAGS?.telemetry?.SEGMENT_API_KEY ||
  '';

/**
 * Segment `apiHost` parameter that should have the format like `api.segment.io/v1`.
 * Is not defined here so that Segment can change it.
 */
const apiHost = window.SERVER_FLAGS?.telemetry?.SEGMENT_API_HOST || '';

/** Segment JS host. Default: `cdn.segment.com` */
const jsHost = window.SERVER_FLAGS?.telemetry?.SEGMENT_JS_HOST || 'cdn.segment.com';

/** Full segment JS URL */
const jsUrl =
  window.SERVER_FLAGS?.telemetry?.SEGMENT_JS_URL ||
  `https://${jsHost}/analytics.js/v1/${encodeURIComponent(apiKey)}/analytics.min.js`;

const initSegment = () => {
  if (TELEMETRY_DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('console-telemetry-plugin: initialize segment API with:', {
      apiKey,
      apiHost,
      jsHost,
      jsUrl,
    });
  }
  // eslint-disable-next-line no-multi-assign
  const analytics = ((window as any).analytics = (window as any).analytics || []);
  if (analytics.initialize) {
    return;
  }
  if (analytics.invoked) {
    // eslint-disable-next-line no-console
    console.error('console-telemetry-plugin: segment snippet included twice');
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
    t.src = jsUrl;
    const n = document.getElementsByTagName('script')[0];
    if (n.parentNode) {
      n.parentNode.insertBefore(t, n);
    }
    // eslint-disable-next-line no-underscore-dangle
    analytics._loadOptions = e;
  };
  analytics.SNIPPET_VERSION = '4.13.1';
  const options: Record<string, any> = {};
  if (apiHost) {
    options.integrations = { 'Segment.io': { apiHost } };
  }
  analytics.load(apiKey, options);
};

if (!TELEMETRY_DISABLED && apiKey) {
  initSegment();
}

const anonymousIP = {
  context: {
    ip: '0.0.0.0',
  },
};

export const eventListener: TelemetryEventListener = async (
  eventType: string,
  properties?: any,
) => {
  if (TELEMETRY_DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('console-telemetry-plugin: received telemetry event:', eventType, properties);
    return;
  }
  if (TELEMETRY_DISABLED || !apiKey) {
    return;
  }
  switch (eventType) {
    case 'identify':
      {
        const { user, ...otherProperties } = properties;
        const id = user?.metadata?.name;
        if (id) {
          // Use SHA1 hash algorithm to anonymize the user
          const anonymousIdBuffer = await crypto.subtle.digest(
            'SHA-1',
            new TextEncoder().encode(id),
          );
          const anonymousIdArray = Array.from(new Uint8Array(anonymousIdBuffer));
          const anonymousId = anonymousIdArray.map((b) => b.toString(16).padStart(2, '0')).join('');
          (window as any).analytics.identify(anonymousId, otherProperties, anonymousIP);
        } else {
          // eslint-disable-next-line no-console
          console.error(
            'console-telemetry-plugin: unable to identify as no user name was provided',
          );
        }
      }
      break;
    case 'page':
      (window as any).analytics.page(undefined, properties, anonymousIP);
      break;
    default:
      (window as any).analytics.track(eventType, properties, anonymousIP);
  }
};
