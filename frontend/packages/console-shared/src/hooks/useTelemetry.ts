import * as React from 'react';
import {
  useResolvedExtensions,
  isTelemetryListener,
  TelemetryListener,
  TelemetryEventListener,
} from '@console/dynamic-plugin-sdk';

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
  const [extensions] = useResolvedExtensions<TelemetryListener>(isTelemetryListener);

  return React.useCallback<TelemetryEventListener>(
    (eventType, properties) => {
      extensions.forEach((e) =>
        e.properties.listener(eventType, {
          consoleVersion,
          clusterType,
          ...properties,
        }),
      );
    },
    [extensions],
  );
};
