import { TelemetryEventListener } from '@console/dynamic-plugin-sdk/src';
import { TELEMETRY_DEBUG } from './const';

export const eventListener: TelemetryEventListener = (eventType: string, properties?: any) => {
  if (TELEMETRY_DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('console-telemetry-plugin: received telemetry event:', eventType, properties);
  }
};
