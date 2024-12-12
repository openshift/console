import * as React from 'react';
import { createContainer } from '@patternfly/react-charts/victory';
import { AsyncComponent } from '../utils/async';

// Constants
export {
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
  ALERTMANAGER_BASE_PATH,
  ALERTMANAGER_USER_WORKLOAD_BASE_PATH,
  ALERTMANAGER_TENANCY_BASE_PATH,
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from './consts';

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
