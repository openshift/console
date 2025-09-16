import { TelemetryEventListener } from '@console/dynamic-plugin-sdk/src';
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/lib-core';

/**
 * Fire and forget implementation to send usage data to the backend.
 * See pkg/usage/ for more information.
 */
const trackUsage = (data: { event: string; perspective: string }) => {
  return consoleFetch('/api/metrics/usage', {
    method: 'POST',
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error('console-telemetry-plugin: unable to track usage:', response.statusText);
      }
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('console-telemetry-plugin: unable to track usage:', error);
    });
};

export const eventListener: TelemetryEventListener = async (
  eventType: string,
  properties?: any,
) => {
  switch (eventType) {
    case 'identify': {
      // identify is triggered once per "browser load" ~= page_view
      const perspective = properties?.perspective || 'unknown';
      trackUsage({ event: 'page_view', perspective });
      break;
    }
    case 'page': {
      // page URL changed, incl. react-router.push/replace ~= page_impression
      const perspective = properties?.perspective || 'unknown';
      trackUsage({ event: 'page_impression', perspective });
      break;
    }
    case 'Perspective Changed': {
      const perspective = properties?.perspective || 'unknown';
      trackUsage({ event: 'perspective_changed', perspective });
      break;
    }
    default:
    // ignore all other events
  }
};
