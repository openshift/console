import * as React from 'react';
import {
  useResolvedExtensions,
  isTelemetryListener,
  TelemetryEventListener,
} from '@console/dynamic-plugin-sdk';

export const useTelemetry = () => {
  const [extensions] = useResolvedExtensions(isTelemetryListener);
  return React.useCallback<TelemetryEventListener>(
    (eventType, properties) => {
      extensions.forEach((e) => e.properties.listener(eventType, properties));
    },
    [extensions],
  );
};
