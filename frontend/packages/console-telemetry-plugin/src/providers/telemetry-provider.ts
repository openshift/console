import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { CLUSTER_TELEMETRY_ANALYTICS } from '@console/shared';
import { FLAG_TELEMETRY_ENABLED, FLAG_TELEMETRY_USER_PREFERENCE } from '../const';
import { TELEMETRY_DISABLED } from '../listeners/const';

const apiKey =
  window.SERVER_FLAGS?.telemetry?.DEVSANDBOX_SEGMENT_API_KEY ||
  window.SERVER_FLAGS?.telemetry?.SEGMENT_API_KEY ||
  '';

const isTelemetryUserPreferenceEnabled = () => {
  return (
    window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN ||
    window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT
  );
};

export const useTelemetryProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_TELEMETRY_ENABLED, apiKey && !TELEMETRY_DISABLED);
  setFeatureFlag(FLAG_TELEMETRY_USER_PREFERENCE, isTelemetryUserPreferenceEnabled());
};
