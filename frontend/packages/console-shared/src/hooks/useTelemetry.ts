import * as React from 'react';
import {
  useResolvedExtensions,
  isTelemetryListener,
  TelemetryListener,
  TelemetryEventListener,
} from '@console/dynamic-plugin-sdk';

export const useTelemetry = () => {
  // TODO use useDynamicPluginInfo() hook to tell whether all dynamic plugins have been processed
  // to avoid firing telemetry events multiple times whenever a dynamic plugin loads asynchronously
  const [extensions] = useResolvedExtensions<TelemetryListener>(isTelemetryListener);

  return React.useCallback<TelemetryEventListener>(
    (eventType, properties) => {
      extensions.forEach((e) =>
        e.properties.listener(eventType, {
          consoleVersion: window.SERVER_FLAGS.consoleVersion,
          ...properties,
        }),
      );
    },
    [extensions],
  );
};
