import {
  TELEMETRY_DEBUG,
  getSegmentAnalytics,
} from '@console/dynamic-plugin-sdk/src/api/segment-analytics';
import { TelemetryEventListener } from '@console/dynamic-plugin-sdk/src/extensions/telemetry';

const anonymousIP = {
  context: {
    ip: '0.0.0.0',
  },
};

export const eventListener: TelemetryEventListener = async (
  eventType: string,
  properties?: any,
) => {
  const { analytics, analyticsEnabled } = getSegmentAnalytics();

  if (!analyticsEnabled) {
    if (TELEMETRY_DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(
        'console-telemetry-plugin: analytics is disabled, ignoring telemetry event',
        eventType,
        properties,
      );
    }
    return;
  }

  switch (eventType) {
    case 'identify':
      {
        const { user, ...otherProperties } = properties;
        const clusterId = otherProperties?.clusterId;
        const organizationId = otherProperties?.organizationId;
        const username = user?.username;
        if (username) {
          let anonymousIdInput: string;
          if (organizationId) {
            if (username === 'kubeadmin' || username === 'kube:admin') {
              anonymousIdInput = `${organizationId}@${clusterId}`;
            } else {
              anonymousIdInput = `${username}@${clusterId}`;
            }
          } else {
            anonymousIdInput = username;
          }

          // Use SHA1 hash algorithm to anonymize the user
          const anonymousIdBuffer = await crypto.subtle.digest(
            'SHA-1',
            new TextEncoder().encode(anonymousIdInput),
          );
          const anonymousIdArray = Array.from(new Uint8Array(anonymousIdBuffer));
          const anonymousId = anonymousIdArray.map((b) => b.toString(16).padStart(2, '0')).join('');

          if (TELEMETRY_DEBUG) {
            // eslint-disable-next-line no-console
            console.debug(
              'console-telemetry-plugin: use anonymized user identifier to group events',
              { username, clusterId, organizationId, anonymousIdInput, anonymousId },
            );
          }

          analytics.identify(anonymousId, otherProperties, anonymousIP);
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
      analytics.page(undefined, properties, anonymousIP);
      break;
    default:
      analytics.track(eventType, properties, anonymousIP);
  }
};
