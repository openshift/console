/* eslint-disable no-barrel-files/no-barrel-files */
import { createContainer } from '@patternfly/react-charts/victory';
import { AsyncComponent } from '../utils/async';

// Constants
export {
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from './consts';

// Components
export const Area = (props) => (
  <AsyncComponent loader={() => import('./graph-loader').then((c) => c.Area)} {...props} />
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

type PrometheusLabels = { [key: string]: string };
type PrometheusValue = [number, string];

// Only covers range and instant vector responses for now.
export type PrometheusResult = {
  metric: PrometheusLabels;
  values?: PrometheusValue[];
  value?: PrometheusValue;
};

type PrometheusData = {
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
