import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { FLAG_TELEMETRY_ENABLED } from '../const';
import { TELEMETRY_DISABLED } from '../listeners/const';

const apiKey =
  window.SERVER_FLAGS?.telemetry?.DEVSANDBOX_SEGMENT_API_KEY ||
  window.SERVER_FLAGS?.telemetry?.SEGMENT_API_KEY ||
  '';

export const useTelemetryProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_TELEMETRY_ENABLED, apiKey && !TELEMETRY_DISABLED);
};
