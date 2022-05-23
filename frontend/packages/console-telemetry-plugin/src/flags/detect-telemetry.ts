import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { TELEMETRY_DISABLED } from '../listeners/const';

export const detectTelemetry = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag('TELEMETRY', !TELEMETRY_DISABLED);
};
