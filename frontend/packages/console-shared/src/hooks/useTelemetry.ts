import * as React from 'react';
import {
  useResolvedExtensions,
  isTelemetryListener,
  TelemetryListener,
  TelemetryEventListener,
} from '@console/dynamic-plugin-sdk';

export const useTelemetry = () => {
  // TODO(vojtech): once #8966 is merged, utilize useDynamicPluginInfo hook to determine
  // whether all dynamic plugins have finished loading (no plugins with 'Pending' status)
  // in order to avoid firing events multiple times whenever plugins asynchronously load.
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
