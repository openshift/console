import { TELEMETRY_DISABLED } from '@console/dynamic-plugin-sdk/src/api/segment-analytics';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { CLUSTER_TELEMETRY_ANALYTICS } from '@console/shared';
import { FLAG_TELEMETRY_ENABLED, FLAG_TELEMETRY_USER_PREFERENCE } from '../const';

const isTelemetryUserPreferenceEnabled = () => {
  return (
    window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN ||
    window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT
  );
};

export const useTelemetryProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_TELEMETRY_ENABLED, !TELEMETRY_DISABLED);
  setFeatureFlag(FLAG_TELEMETRY_USER_PREFERENCE, isTelemetryUserPreferenceEnabled());
};
