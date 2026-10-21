import type { Extension, CodeRef } from '../types';

/** This component can be used to register a listener function receiving telemetry events.
    These events include user identification, page navigation, and other application specific events.
    The listener may use this data for reporting and analytics purposes. */
export type TelemetryListener = Extension<
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
