import { TelemetryListener as CoreTelemetryListener } from '@openshift/dynamic-plugin-sdk';
import { Extension } from '../types';
import { RepackageExtension } from './data-types';

export type TelemetryListener = RepackageExtension<
  'console.telemetry/listener',
  CoreTelemetryListener
>;

// P should be valid JSON
export type TelemetryEventListener = <P = any>(eventType: string, properties?: P) => void;

// Type guards

export const isTelemetryListener = (e: Extension): e is TelemetryListener => {
  return e.type === 'console.telemetry/listener';
};
