import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { JSONSchema6Object } from 'json-schema';

export type TelemetryListener = ExtensionDeclaration<
  'console.telemetry/listener',
  {
    /** Listen for telemetry events */
    listener: CodeRef<TelemetryEventListener>;
  }
>;

// P should be valid JSON
export type TelemetryEventListener = <P extends JSONSchema6Object = JSONSchema6Object>(
  eventType: string,
  properties?: P,
) => void;

// Type guards

export const isTelemetryListener = (e: Extension): e is TelemetryListener => {
  return e.type === 'console.telemetry/listener';
};
