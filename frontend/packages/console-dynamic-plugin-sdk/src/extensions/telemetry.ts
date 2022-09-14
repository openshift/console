import { TelemetryListener as CoreTelemetryListener } from '@openshift/dynamic-plugin-sdk';
import { Extension, ExtensionDeclaration } from '../types';

export type TelemetryListener = ExtensionDeclaration<
  'console.telemetry/listener',
  CoreTelemetryListener['properties']
>;

// P should be valid JSON
export type TelemetryEventListener = <P = any>(eventType: string, properties?: P) => void;

// Type guards

export const isTelemetryListener = (e: Extension): e is TelemetryListener => {
  return e.type === 'console.telemetry/listener';
};
