import { TelemetryEventListener } from '@console/dynamic-plugin-sdk/src';
import { SEGMENT_API_KEY, TELEMETRY_DISABLED, TELEMETRY_DEBUG } from './const';

const initSegment = () => {
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
    t.src = `https://cdn.segment.com/analytics.js/v1/${encodeURIComponent(key)}/analytics.min.js`;
    const n = document.getElementsByTagName('script')[0];
    if (n.parentNode) {
      n.parentNode.insertBefore(t, n);
    }
    // eslint-disable-next-line no-underscore-dangle
    analytics._loadOptions = e;
  };
  analytics.SNIPPET_VERSION = '4.13.1';
  analytics.load(SEGMENT_API_KEY);
};

SEGMENT_API_KEY && !TELEMETRY_DISABLED && initSegment();

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
  if (!SEGMENT_API_KEY || TELEMETRY_DISABLED) {
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
