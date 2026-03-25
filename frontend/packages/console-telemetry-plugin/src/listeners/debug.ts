import { TELEMETRY_DEBUG } from '@console/dynamic-plugin-sdk/src/api/segment-analytics';
import type { TelemetryEventListener } from '@console/dynamic-plugin-sdk/src/extensions/telemetry';

export const eventListener: TelemetryEventListener = (eventType: string, properties?: any) => {
  if (TELEMETRY_DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('console-telemetry-plugin: received telemetry event:', eventType, properties);
  }
};
