import * as React from 'react';
import { AsyncComponent } from '../utils/async';

// Constants
export const PROMETHEUS_BASE_PATH = window.SERVER_FLAGS.prometheusBaseURL;
export const PROMETHEUS_TENANCY_BASE_PATH = window.SERVER_FLAGS.prometheusTenancyBaseURL;
export const ALERT_MANAGER_BASE_PATH = window.SERVER_FLAGS.alertManagerBaseURL;

// Components
export * from './require-prometheus';
export { errorStatus, Status } from './status';
export const Area = (props) => (
  <AsyncComponent loader={() => import('./graph-loader').then((c) => c.Area)} {...props} />
);
export const Bar = (props) => (
  <AsyncComponent loader={() => import('./graph-loader').then((c) => c.Bar)} {...props} />
);
export const Gauge = (props) => (
  <AsyncComponent loader={() => import('./graph-loader').then((c) => c.Gauge)} {...props} />
);

// Types
export type DataPoint<X = Date | number | string> = {
  x?: X;
  y?: number;
  label?: string;
  metric?: { [key: string]: string };
  description?: (date: string, value: string) => string;
};

export type DomainPadding =
  | number
  | {
      x?: number | [number, number];
      y?: number | [number, number];
    };
