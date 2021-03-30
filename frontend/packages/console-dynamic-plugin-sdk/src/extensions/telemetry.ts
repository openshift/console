import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

namespace ExtensionProperties {
  export type TelemetryListener = {
    /** Listen for telemetry events */
    listener: EncodedCodeRef;
  };

  export type TelemetryListenerCodeRefs = {
    listener: CodeRef<TelemetryEventListener>;
  };
}

// Extension types

export type TelemetryListener = Extension<ExtensionProperties.TelemetryListener> & {
  type: 'console.telemetry/listener';
};

export type ResolvedTelemetryListener = UpdateExtensionProperties<
  TelemetryListener,
  ExtensionProperties.TelemetryListenerCodeRefs
>;

export type TelemetryEventListener = <P extends {} = {}>(eventType: string, properties: P) => void;

// Type guards

export const isTelemetryListener = (e: Extension): e is ResolvedTelemetryListener => {
  return e.type === 'console.telemetry/listener';
};
