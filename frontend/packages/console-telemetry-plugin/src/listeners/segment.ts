import { TelemetryEventListener, UserInfo } from '@console/dynamic-plugin-sdk/src';
import type { ClusterProperties } from '@console/shared/src/hooks/useTelemetry';
import { TELEMETRY_DISABLED, TELEMETRY_DEBUG } from './const';

// Sample 20% of sessions
const SAMPLE_SESSION = Math.random() < 0.2;

/** Segmnet API Key that looks like a hash */
const apiKey =
  window.SERVER_FLAGS?.telemetry?.DEVSANDBOX_SEGMENT_API_KEY ||
  window.SERVER_FLAGS?.telemetry?.SEGMENT_API_KEY ||
  window.SERVER_FLAGS?.telemetry?.SEGMENT_PUBLIC_API_KEY ||
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
    console.info('console-telemetry-plugin: initialize segment API with:', {
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

if (!TELEMETRY_DISABLED && apiKey && SAMPLE_SESSION) {
  initSegment();
}

const anonymousIP = {
  context: {
    ip: '0.0.0.0',
  },
};

/**
 * Uses SHA1 hash algorithm to anonymize the user ID.
 */
const anonymizeId = async (anonymousIdInput: string) => {
  const anonymousIdBuffer = await window.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(anonymousIdInput),
  );
  const anonymousIdArray = Array.from(new Uint8Array(anonymousIdBuffer));
  return anonymousIdArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

type EventProperties = { user?: UserInfo } & ClusterProperties & any;

export const eventListener: TelemetryEventListener = async (
  eventType: string,
  properties?: any,
) => {
  if (!apiKey) {
    if (TELEMETRY_DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(
        'console-telemetry-plugin: missing Segment API key - ignoring telemetry event:',
        eventType,
        properties,
      );
    }
    return;
  }
  if (!SAMPLE_SESSION) {
    if (TELEMETRY_DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(
        'console-telemetry-plugin: session is not being sampled - ignoring telemetry event',
        eventType,
        properties,
      );
    }
    return;
  }
  switch (eventType) {
    case 'identify':
      {
        const { user, ...otherProperties }: EventProperties = properties;
        const clusterId = otherProperties?.clusterId;
        const organizationId = otherProperties?.organizationId;
        const username = user?.username;
        if (username) {
          let userId: string;
          if (organizationId) {
            if (username === 'kubeadmin' || username === 'kube:admin') {
              userId = `${organizationId}@${clusterId}`;
            } else {
              userId = `${username}@${clusterId}`;
            }
          } else {
            userId = username;
          }

          let processedUserId: string;

          // anonymize user ID if cluster is not a DEVSANDBOX cluster
          if (window.SERVER_FLAGS?.telemetry?.DEVSANDBOX === 'true') {
            processedUserId = user?.uid ?? userId;
          } else {
            processedUserId = await anonymizeId(userId);
          }

          if (TELEMETRY_DEBUG) {
            // eslint-disable-next-line no-console
            console.debug(
              `console-telemetry-plugin: use anonymized user identifier to group events`,
              { username, clusterId, organizationId, userId, processedUserId },
            );
          }

          (window as any).analytics.identify(processedUserId, otherProperties, anonymousIP);
        } else {
          // eslint-disable-next-line no-console
          console.error(
            'console-telemetry-plugin: unable to identify as no user name was provided',
            properties,
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
