import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { TELEMETRY_DEBUG, TELEMETRY_DISABLED } from '../listeners/const';

export const detectTelemetry = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag('TELEMETRY_DEBUG', TELEMETRY_DEBUG);
  setFeatureFlag('TELEMETRY', !TELEMETRY_DISABLED);
};
