import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type TelemetryListener = ExtensionDeclaration<
  'console.telemetry/listener',
  {
    /** Listen for telemetry events */
    listener: CodeRef<TelemetryEventListener>;
  }
>;

// P should be valid JSON
export type TelemetryEventListener = <P = any>(eventType: string, properties?: P) => void;

// Type guards

export const isTelemetryListener = (e: Extension): e is TelemetryListener => {
  return e.type === 'console.telemetry/listener';
};
