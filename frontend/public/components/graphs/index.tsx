import * as React from 'react';
import { createContainer } from '@patternfly/react-charts';
import { AsyncComponent } from '../utils/async';
import { ONE_HOUR } from '@console/shared/src/constants/time';

// Constants
export const PROMETHEUS_BASE_PATH = window.SERVER_FLAGS.prometheusBaseURL;
export const PROMETHEUS_TENANCY_BASE_PATH = window.SERVER_FLAGS.prometheusTenancyBaseURL;
export const ALERTMANAGER_BASE_PATH = window.SERVER_FLAGS.alertManagerBaseURL;
export const ALERTMANAGER_USER_WORKLOAD_BASE_PATH =
  window.SERVER_FLAGS.alertmanagerUserWorkloadBaseURL;
export const ALERTMANAGER_TENANCY_BASE_PATH = 'api/alertmanager-tenancy'; // remove it once it get added to SERVER_FLAGS
export const DEFAULT_PROMETHEUS_SAMPLES = 60;
export const DEFAULT_PROMETHEUS_TIMESPAN = ONE_HOUR;
// Components
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
export const Stack = (props) => (
  <AsyncComponent loader={() => import('./graph-loader').then((c) => c.Stack)} {...props} />
);

export const CursorVoronoiContainer = createContainer('cursor', 'voronoi');

// Types
export type DataPoint<X = Date | number | string> = {
  x?: X;
  y?: number;
  label?: string;
  metric?: { [key: string]: string };
  description?: string;
  symbol?: {
    type?: string;
    fill?: string;
  };
};

export type PrometheusLabels = { [key: string]: string };
export type PrometheusValue = [number, string];

// Only covers range and instant vector responses for now.
export type PrometheusResult = {
  metric: PrometheusLabels;
  values?: PrometheusValue[];
  value?: PrometheusValue;
};

export type PrometheusData = {
  resultType: 'matrix' | 'vector' | 'scalar' | 'string';
  result: PrometheusResult[];
};

export type PrometheusResponse = {
  status: string;
  data: PrometheusData;
  errorType?: string;
  error?: string;
  warnings?: string[];
};

export type DomainPadding =
  | number
  | {
      x?: number | [number, number];
      y?: number | [number, number];
    };
