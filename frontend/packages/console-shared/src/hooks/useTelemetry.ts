import * as React from 'react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import {
  isTelemetryListener,
  TelemetryEventListener,
} from '@console/dynamic-plugin-sdk/src/extensions/telemetry';

export const useTelemetry = () => {
  // TODO how can we wait for all plugins to load such that we can create a stable callback reference and not end up firing events multiple times whenever plugins asynchronously load
  const [extensions] = useResolvedExtensions(isTelemetryListener);
  return React.useCallback<TelemetryEventListener>(
    (eventType, properties) => {
      extensions.forEach((e) =>
        (e.properties as any).listener(eventType, {
          consoleVersion: window.SERVER_FLAGS.consoleVersion,
          ...properties,
        }),
      );
    },
    [extensions],
  );
};
