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

let telemetryArray = [];

export const getConsoleVersion = () => window.SERVER_FLAGS?.consoleVersion;

export const getClusterType = () => {
  if (
    window.SERVER_FLAGS?.telemetry?.CLUSTER_TYPE === 'OSD' &&
    window.SERVER_FLAGS?.telemetry?.DEVSANDBOX === 'true'
  ) {
    return 'DEVSANDBOX';
  }
  return window.SERVER_FLAGS?.telemetry?.CLUSTER_TYPE;
};

let consoleVersion = getConsoleVersion();
let clusterType = getClusterType();

export const updateServerFlagsFromTests = () => {
  consoleVersion = getConsoleVersion();
  clusterType = getClusterType();
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
      telemetryArray.length > 0
    ) {
      telemetryArray.forEach((telemetryEvent) => {
        extensions.forEach((e) =>
          e.properties.listener(telemetryEvent.eventType, {
            consoleVersion,
            clusterType,
            ...telemetryEvent,
            path: telemetryEvent?.pathname,
          }),
        );
      });
      telemetryArray = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserPreferenceTelemetryValue]);

  return React.useCallback<TelemetryEventListener>(
    (eventType, properties) => {
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
        telemetryArray.push({ ...properties, eventType });
        if (telemetryArray.length > 10) {
          telemetryArray.shift(); // Remove the first element
        }
        return;
      }
      extensions.forEach((e) =>
        e.properties.listener(eventType, {
          consoleVersion,
          clusterType,
          ...properties,
        }),
      );
    },
    [extensions, currentUserPreferenceTelemetryValue],
  );
};
