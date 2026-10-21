import {
  TELEMETRY_DEBUG,
  TELEMETRY_DISABLED,
} from '@console/dynamic-plugin-sdk/src/api/segment-analytics';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';

export const detectTelemetry = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag('TELEMETRY_DEBUG', TELEMETRY_DEBUG);
  setFeatureFlag('TELEMETRY', !TELEMETRY_DISABLED);
};
