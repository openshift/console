import {
  TELEMETRY_DEBUG,
  getSegmentAnalytics,
} from '@console/dynamic-plugin-sdk/src/api/segment-analytics';
import type { TelemetryEventListener } from '@console/dynamic-plugin-sdk/src/extensions/telemetry';
import type { TelemetryEventProperties } from '@console/shared/src/hooks/useTelemetry';
import { getClusterProperties } from '@console/shared/src/hooks/useTelemetry';

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
        const { user, userResource, ...otherProperties }: TelemetryEventProperties = properties;
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
          if (getClusterProperties().clusterType === 'DEVSANDBOX') {
            processedUserId =
              userResource?.metadata?.annotations?.['toolchain.dev.openshift.com/sso-user-id'];
          } else {
            processedUserId = await anonymizeId(userId);
          }

          if (TELEMETRY_DEBUG) {
            // eslint-disable-next-line no-console
            console.debug(
              'console-telemetry-plugin: use anonymized user identifier to group events',
              { username, clusterId, organizationId, userId, processedUserId },
            );
          }

          analytics.identify(processedUserId, otherProperties, anonymousIP);
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
