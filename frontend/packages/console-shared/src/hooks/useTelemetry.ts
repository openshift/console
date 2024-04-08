import * as React from 'react';
import {
  useResolvedExtensions,
  isTelemetryListener,
  TelemetryListener,
  TelemetryEventListener,
} from '@console/dynamic-plugin-sdk';
import {
  CLUSTER_TELEMETRY_ANALYTICS,
  PREFERRED_TELEMETRY_USER_SETTING_KEY,
  USER_TELEMETRY_ANALYTICS,
} from '../constants';
import { useUserSettings } from './useUserSettings';

let telemetryEvents: { eventType: string; event: Record<string, any> }[] = [];

export const getClusterType = () => {
  if (
    window.SERVER_FLAGS?.telemetry?.CLUSTER_TYPE === 'OSD' &&
    window.SERVER_FLAGS?.telemetry?.DEVSANDBOX === 'true'
  ) {
    return 'DEVSANDBOX';
  }
  return window.SERVER_FLAGS?.telemetry?.CLUSTER_TYPE;
};

export const getConsoleVersion = () => window.SERVER_FLAGS?.consoleVersion;

export const getOrganizationId = () => window.SERVER_FLAGS?.telemetry?.ORGANIZATION_ID;

let clusterType = getClusterType();
let consoleVersion = getConsoleVersion();
let organizationId = getOrganizationId();

export const updateServerFlagsFromTests = () => {
  clusterType = getClusterType();
  consoleVersion = getConsoleVersion();
  organizationId = getOrganizationId();
};

export const useTelemetry = () => {
  // TODO use useDynamicPluginInfo() hook to tell whether all dynamic plugins have been processed
  // to avoid firing telemetry events multiple times whenever a dynamic plugin loads asynchronously

  const [currentUserPreferenceTelemetryValue] = useUserSettings<USER_TELEMETRY_ANALYTICS>(
    PREFERRED_TELEMETRY_USER_SETTING_KEY,
    null,
    true,
  );

  const [extensions] = useResolvedExtensions<TelemetryListener>(isTelemetryListener);

  React.useEffect(() => {
    if (
      currentUserPreferenceTelemetryValue === USER_TELEMETRY_ANALYTICS.ALLOW &&
      window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN &&
      telemetryEvents.length > 0
    ) {
      telemetryEvents.forEach(({ eventType, event }) => {
        extensions.forEach((e) => e.properties.listener(eventType, event));
      });
      telemetryEvents = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserPreferenceTelemetryValue]);

  return React.useCallback<TelemetryEventListener>(
    (eventType, properties: Record<string, any>) => {
      const event = {
        clusterType,
        consoleVersion,
        organizationId,
        ...properties,
        // This is required to ensure that the replayed events uses the right path.
        path: properties?.pathname,
      };
      if (
        window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.DISABLED ||
        (currentUserPreferenceTelemetryValue === USER_TELEMETRY_ANALYTICS.DENY &&
          (window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN ||
            window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT))
      ) {
        return;
      }
      if (
        !currentUserPreferenceTelemetryValue &&
        window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN
      ) {
        telemetryEvents.push({ eventType, event });
        if (telemetryEvents.length > 10) {
          telemetryEvents.shift(); // Remove the first element
        }
        return;
      }
      extensions.forEach((e) => e.properties.listener(eventType, event));
    },
    [extensions, currentUserPreferenceTelemetryValue],
  );
};
